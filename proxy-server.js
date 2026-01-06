/**
 * IWC Approval Portal - Production API Server
 * 
 * Serves the frontend static files and proxies API calls to:
 * - Marinesia API (vessel profiles)
 * - AISStream WebSocket (real-time AIS data)
 * 
 * Deployment: Render, Railway, Heroku, or any Node.js host
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');

const app = express();

// ============================================
// Configuration (from environment variables)
// ============================================
const PORT = process.env.PORT || 3001;
const MARINESIA_API_KEY = process.env.MARINESIA_API_KEY || 'JlOZeHWxHmsGRViFvaVwSNiCH';
const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY || '38bd336ae27761db109eec3c6d6c684c404708b0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// Vessel Cache for AISStream Data
// ============================================
class VesselCache {
    constructor() {
        this.vessels = new Map();
        this.byName = new Map();
        this.byIMO = new Map();
        this.lastUpdate = null;
        this.connectionStatus = 'disconnected';
        this.messageCount = 0;
    }

    addVessel(mmsi, data) {
        const existing = this.vessels.get(mmsi) || {};
        const merged = { ...existing, ...data, lastSeen: new Date().toISOString() };
        this.vessels.set(mmsi, merged);
        
        if (data.name && data.name.trim()) {
            const nameLower = data.name.toLowerCase().trim();
            this.byName.set(nameLower, mmsi);
            const words = nameLower.split(/\s+/);
            words.forEach(word => {
                if (word.length >= 3) {
                    if (!this.byName.has(word)) {
                        this.byName.set(word, []);
                    }
                    const arr = this.byName.get(word);
                    if (Array.isArray(arr) && !arr.includes(mmsi)) {
                        arr.push(mmsi);
                    }
                }
            });
        }
        
        if (data.imoNumber && data.imoNumber > 0) {
            this.byIMO.set(data.imoNumber.toString(), mmsi);
        }
        
        this.lastUpdate = new Date().toISOString();
        this.messageCount++;
    }

    search(query) {
        const results = [];
        const queryLower = query.toLowerCase().trim();
        const seen = new Set();

        // Exact MMSI match
        if (/^\d{9}$/.test(query)) {
            const vessel = this.vessels.get(query);
            if (vessel) {
                results.push({ ...vessel, mmsi: query, source: 'aisstream' });
                seen.add(query);
            }
        }

        // Exact IMO match
        if (/^\d{7}$/.test(query)) {
            const mmsi = this.byIMO.get(query);
            if (mmsi && !seen.has(mmsi)) {
                results.push({ ...this.vessels.get(mmsi), mmsi, source: 'aisstream' });
                seen.add(mmsi);
            }
        }

        // Name search
        for (const [key, value] of this.byName.entries()) {
            if (key.includes(queryLower) || queryLower.includes(key)) {
                const mmsiList = Array.isArray(value) ? value : [value];
                for (const mmsi of mmsiList) {
                    if (!seen.has(mmsi)) {
                        const vessel = this.vessels.get(mmsi);
                        if (vessel) {
                            results.push({ ...vessel, mmsi, source: 'aisstream' });
                            seen.add(mmsi);
                        }
                    }
                }
            }
        }

        // Fuzzy search through all vessels
        if (results.length < 20) {
            for (const [mmsi, vessel] of this.vessels.entries()) {
                if (!seen.has(mmsi) && vessel.name) {
                    const nameLower = vessel.name.toLowerCase();
                    if (nameLower.includes(queryLower) || 
                        queryLower.split(/\s+/).some(word => word.length >= 2 && nameLower.includes(word))) {
                        results.push({ ...vessel, mmsi, source: 'aisstream' });
                        seen.add(mmsi);
                        if (results.length >= 50) break;
                    }
                }
            }
        }

        return results.slice(0, 50);
    }

    getStats() {
        return {
            totalVessels: this.vessels.size,
            connectionStatus: this.connectionStatus,
            lastUpdate: this.lastUpdate,
            messageCount: this.messageCount
        };
    }
}

const vesselCache = new VesselCache();

// ============================================
// AISStream WebSocket Connection
// ============================================
let aisStreamSocket = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

function connectAISStream() {
    if (!AISSTREAM_API_KEY) {
        console.log('⚠️ AISStream API key not configured, skipping connection');
        vesselCache.connectionStatus = 'not_configured';
        return;
    }

    if (aisStreamSocket && aisStreamSocket.readyState === WebSocket.OPEN) {
        return;
    }

    console.log('🔌 Connecting to AISStream...');
    vesselCache.connectionStatus = 'connecting';

    try {
        aisStreamSocket = new WebSocket('wss://stream.aisstream.io/v0/stream');

        aisStreamSocket.onopen = () => {
            console.log('✅ AISStream connected');
            vesselCache.connectionStatus = 'connected';
            reconnectAttempts = 0;

            const subscriptionMessage = {
                APIKey: AISSTREAM_API_KEY,
                BoundingBoxes: [[[-90, -180], [90, 180]]],
                FilterMessageTypes: ["ShipStaticData", "PositionReport", "StaticDataReport"]
            };

            aisStreamSocket.send(JSON.stringify(subscriptionMessage));
            console.log('📡 Subscribed to global AIS feed');
        };

        aisStreamSocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleAISMessage(message);
            } catch (err) {
                // Ignore parse errors
            }
        };

        aisStreamSocket.onerror = (error) => {
            console.error('❌ AISStream error:', error.message || 'Unknown');
            vesselCache.connectionStatus = 'error';
        };

        aisStreamSocket.onclose = (event) => {
            console.log(`🔌 AISStream disconnected (${event.code})`);
            vesselCache.connectionStatus = 'disconnected';
            aisStreamSocket = null;
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`⏳ Reconnecting in ${delay/1000}s...`);
                reconnectTimeout = setTimeout(() => {
                    reconnectAttempts++;
                    connectAISStream();
                }, delay);
            }
        };
    } catch (err) {
        console.error('❌ AISStream connection failed:', err.message);
        vesselCache.connectionStatus = 'error';
    }
}

function handleAISMessage(message) {
    const { MessageType, MetaData, Message } = message;
    if (!MetaData || !MetaData.MMSI) return;

    const mmsi = MetaData.MMSI.toString();
    const baseData = {
        name: MetaData.ShipName || null,
        latitude: MetaData.latitude,
        longitude: MetaData.longitude,
        timeUtc: MetaData.time_utc
    };

    if (MessageType === 'ShipStaticData' && Message?.ShipStaticData) {
        const staticData = Message.ShipStaticData;
        vesselCache.addVessel(mmsi, {
            ...baseData,
            name: staticData.Name?.trim() || baseData.name,
            imoNumber: staticData.ImoNumber,
            callSign: staticData.CallSign,
            shipType: staticData.Type,
            destination: staticData.Destination,
            eta: staticData.Eta,
            draught: staticData.MaximumStaticDraught,
            length: (staticData.Dimension?.A || 0) + (staticData.Dimension?.B || 0),
            beam: (staticData.Dimension?.C || 0) + (staticData.Dimension?.D || 0)
        });
    } else if (MessageType === 'PositionReport' && Message?.PositionReport) {
        const posData = Message.PositionReport;
        vesselCache.addVessel(mmsi, {
            ...baseData,
            latitude: posData.Latitude,
            longitude: posData.Longitude,
            cog: posData.Cog,
            sog: posData.Sog,
            heading: posData.TrueHeading,
            navStatus: posData.NavigationalStatus
        });
    } else if (MessageType === 'StaticDataReport' && Message?.StaticDataReport) {
        const report = Message.StaticDataReport;
        const data = { ...baseData };
        
        if (report.ReportA?.Valid) {
            data.name = report.ReportA.Name?.trim();
        }
        if (report.ReportB?.Valid) {
            data.callSign = report.ReportB.CallSign;
            data.shipType = report.ReportB.ShipType;
            if (report.ReportB.Dimension) {
                data.length = (report.ReportB.Dimension.A || 0) + (report.ReportB.Dimension.B || 0);
                data.beam = (report.ReportB.Dimension.C || 0) + (report.ReportB.Dimension.D || 0);
            }
        }
        vesselCache.addVessel(mmsi, data);
    }

    // Log progress periodically
    if (vesselCache.messageCount % 5000 === 0) {
        console.log(`📊 ${vesselCache.vessels.size} vessels cached`);
    }
}

// ============================================
// Express Middleware
// ============================================
app.use(cors());
app.use(express.json());

// Request logging (production: minimal)
if (NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        if (!req.path.startsWith('/aisstream') && req.path !== '/health') {
            console.log(`${req.method} ${req.path}`);
        }
        next();
    });
}

// ============================================
// API Routes
// ============================================

// Health check (required for Render)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        environment: NODE_ENV,
        services: {
            marinesia: 'available',
            aisstream: vesselCache.connectionStatus
        },
        stats: vesselCache.getStats()
    });
});

// Marinesia API proxy
app.get('/api/marinesia/vessel/:mmsi/profile', async (req, res) => {
    try {
        const { mmsi } = req.params;
        const url = `https://api.marinesia.com/api/v1/vessel/${mmsi}/profile?key=${MARINESIA_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Marinesia API error:', error.message);
        res.status(500).json({ error: true, message: 'Failed to fetch from Marinesia' });
    }
});

app.get('/api/marinesia/vessel/profile', async (req, res) => {
    try {
        const queryParams = new URLSearchParams(req.query);
        queryParams.set('key', MARINESIA_API_KEY);
        
        const url = `https://api.marinesia.com/api/v1/vessel/profile?${queryParams}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Marinesia API error:', error.message);
        res.status(500).json({ error: true, message: 'Failed to fetch from Marinesia' });
    }
});

app.get('/api/marinesia/vessel/:mmsi/location/latest', async (req, res) => {
    try {
        const { mmsi } = req.params;
        const url = `https://api.marinesia.com/api/v1/vessel/${mmsi}/location/latest?key=${MARINESIA_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Marinesia API error:', error.message);
        res.status(500).json({ error: true, message: 'Failed to fetch from Marinesia' });
    }
});

// AISStream cached data endpoints
app.get('/api/aisstream/search', (req, res) => {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
        return res.status(400).json({ 
            error: true, 
            message: 'Query must be at least 2 characters' 
        });
    }

    const results = vesselCache.search(query);
    
    res.json({
        error: false,
        message: `Found ${results.length} vessels`,
        data: results,
        stats: vesselCache.getStats()
    });
});

app.get('/api/aisstream/vessel/:mmsi', (req, res) => {
    const { mmsi } = req.params;
    const vessel = vesselCache.vessels.get(mmsi);
    
    if (vessel) {
        res.json({
            error: false,
            data: { ...vessel, mmsi, source: 'aisstream' }
        });
    } else {
        res.status(404).json({
            error: true,
            message: 'Vessel not found in cache'
        });
    }
});

app.get('/api/aisstream/status', (req, res) => {
    res.json({
        error: false,
        ...vesselCache.getStats()
    });
});

// Legacy endpoints (backward compatibility)
app.use('/marinesia', createProxyMiddleware({
    target: 'https://api.marinesia.com',
    changeOrigin: true,
    pathRewrite: { '^/marinesia': '' },
    logLevel: 'silent'
}));

app.get('/aisstream/search', (req, res) => res.redirect(`/api/aisstream/search?${new URLSearchParams(req.query)}`));
app.get('/aisstream/vessel/:mmsi', (req, res) => res.redirect(`/api/aisstream/vessel/${req.params.mmsi}`));
app.get('/aisstream/status', (req, res) => res.redirect('/api/aisstream/status'));

// ============================================
// Serve Static Files
// ============================================
app.use(express.static(path.join(__dirname)));

// SPA fallback - serve index.html for any non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/marinesia/') && !req.path.startsWith('/aisstream/')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// ============================================
// Server Startup
// ============================================
app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🚀 IWC Approval Portal - API Server');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  📍 URL: http://localhost:${PORT}`);
    console.log(`  🌍 Environment: ${NODE_ENV}`);
    console.log('');
    console.log('  📡 API Endpoints:');
    console.log(`     GET /api/marinesia/vessel/:mmsi/profile`);
    console.log(`     GET /api/marinesia/vessel/profile?filters=...`);
    console.log(`     GET /api/aisstream/search?query=...`);
    console.log(`     GET /api/aisstream/status`);
    console.log(`     GET /health`);
    console.log('');
    console.log('  ✅ Server ready!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Start AISStream connection after server is ready
    setTimeout(connectAISStream, 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    if (aisStreamSocket) aisStreamSocket.close();
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (aisStreamSocket) aisStreamSocket.close();
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    process.exit(0);
});
