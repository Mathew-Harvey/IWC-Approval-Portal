// Enhanced CORS Proxy Server with AISStream WebSocket Integration
// Supports both Marinesia REST API and AISStream WebSocket for comprehensive vessel data
// Usage: node proxy-server.js

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 3001;

// API Keys
const MARINESIA_API_KEY = 'JlOZeHWxHmsGRViFvaVwSNiCH';
const AISSTREAM_API_KEY = '38bd336ae27761db109eec3c6d6c684c404708b0';

// ============================================
// Vessel Cache for AISStream Data
// ============================================
class VesselCache {
    constructor() {
        this.vessels = new Map(); // MMSI -> vessel data
        this.byName = new Map();  // lowercase name -> MMSI
        this.byIMO = new Map();   // IMO -> MMSI
        this.lastUpdate = null;
        this.connectionStatus = 'disconnected';
        this.messageCount = 0;
    }

    addVessel(mmsi, data) {
        const existing = this.vessels.get(mmsi) || {};
        const merged = { ...existing, ...data, lastSeen: new Date().toISOString() };
        this.vessels.set(mmsi, merged);
        
        // Index by name for quick searching
        if (data.name && data.name.trim()) {
            const nameLower = data.name.toLowerCase().trim();
            this.byName.set(nameLower, mmsi);
            // Also index partial names for fuzzy search
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
        
        // Index by IMO
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

        // 1. Exact MMSI match
        if (/^\d{9}$/.test(query)) {
            const vessel = this.vessels.get(query);
            if (vessel) {
                results.push({ ...vessel, mmsi: query, source: 'aisstream' });
                seen.add(query);
            }
        }

        // 2. Exact IMO match
        if (/^\d{7}$/.test(query)) {
            const mmsi = this.byIMO.get(query);
            if (mmsi && !seen.has(mmsi)) {
                results.push({ ...this.vessels.get(mmsi), mmsi, source: 'aisstream' });
                seen.add(mmsi);
            }
        }

        // 3. Name search - fuzzy matching
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

        // 4. Also search through all vessels for partial name match
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
    if (aisStreamSocket && aisStreamSocket.readyState === WebSocket.OPEN) {
        console.log('📡 AISStream already connected');
        return;
    }

    console.log('\n🔌 Connecting to AISStream...');
    vesselCache.connectionStatus = 'connecting';

    try {
        aisStreamSocket = new WebSocket('wss://stream.aisstream.io/v0/stream');

        aisStreamSocket.onopen = () => {
            console.log('✅ AISStream WebSocket connected!');
            vesselCache.connectionStatus = 'connected';
            reconnectAttempts = 0;

            // Subscribe to global area for ShipStaticData (vessel info) messages
            // Using a global bounding box to get all vessels
            const subscriptionMessage = {
                APIKey: AISSTREAM_API_KEY,
                BoundingBoxes: [[[-90, -180], [90, 180]]], // Global coverage
                FilterMessageTypes: ["ShipStaticData", "PositionReport", "StaticDataReport"]
            };

            aisStreamSocket.send(JSON.stringify(subscriptionMessage));
            console.log('📡 Subscribed to global AIS feed');
            console.log('   Receiving: ShipStaticData, PositionReport, StaticDataReport');
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
            console.error('❌ AISStream WebSocket error:', error.message || 'Unknown error');
            vesselCache.connectionStatus = 'error';
        };

        aisStreamSocket.onclose = (event) => {
            console.log(`🔌 AISStream WebSocket closed (code: ${event.code})`);
            vesselCache.connectionStatus = 'disconnected';
            aisStreamSocket = null;
            
            // Attempt to reconnect
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`⏳ Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
                reconnectTimeout = setTimeout(() => {
                    reconnectAttempts++;
                    connectAISStream();
                }, delay);
            } else {
                console.log('⚠️ Max reconnection attempts reached. AISStream disabled.');
            }
        };
    } catch (err) {
        console.error('❌ Failed to create AISStream connection:', err.message);
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
            dimensionA: staticData.Dimension?.A,
            dimensionB: staticData.Dimension?.B,
            dimensionC: staticData.Dimension?.C,
            dimensionD: staticData.Dimension?.D,
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
    if (vesselCache.messageCount % 1000 === 0) {
        console.log(`📊 AISStream: ${vesselCache.vessels.size} vessels cached (${vesselCache.messageCount} messages processed)`);
    }
}

// ============================================
// Express Middleware Setup
// ============================================
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    if (!req.path.startsWith('/aisstream')) {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// ============================================
// AISStream API Endpoints
// ============================================

// Search vessels in AISStream cache
app.get('/aisstream/search', (req, res) => {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
        return res.status(400).json({ 
            error: true, 
            message: 'Query must be at least 2 characters' 
        });
    }

    const results = vesselCache.search(query);
    
    console.log(`🔍 AISStream search: "${query}" -> ${results.length} results`);
    
    res.json({
        error: false,
        message: `Found ${results.length} vessels`,
        data: results,
        stats: vesselCache.getStats()
    });
});

// Get vessel by MMSI from AISStream cache
app.get('/aisstream/vessel/:mmsi', (req, res) => {
    const { mmsi } = req.params;
    const vessel = vesselCache.vessels.get(mmsi);
    
    if (vessel) {
        res.json({
            error: false,
            message: 'Vessel found',
            data: { ...vessel, mmsi, source: 'aisstream' }
        });
    } else {
        res.status(404).json({
            error: true,
            message: 'Vessel not found in cache'
        });
    }
});

// Get AISStream cache status
app.get('/aisstream/status', (req, res) => {
    res.json({
        error: false,
        ...vesselCache.getStats()
    });
});

// ============================================
// Marinesia Proxy
// ============================================
app.use('/marinesia', createProxyMiddleware({
    target: 'https://api.marinesia.com',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
        '^/marinesia': ''
    },
    logLevel: 'warn',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`📤 Marinesia: ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        if (proxyRes.statusCode !== 200) {
            console.log(`⚠️ Marinesia response: ${proxyRes.statusCode}`);
        }
    },
    onError: (err, req, res) => {
        console.error('❌ Marinesia proxy error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ 
                error: true, 
                message: err.message
            });
        }
    }
}));

// ============================================
// Health & Status Endpoints
// ============================================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Proxy server running',
        services: {
            marinesia: 'proxied',
            aisstream: vesselCache.connectionStatus
        },
        aisstream: vesselCache.getStats()
    });
});

// Serve static files
app.use(express.static('.'));

// ============================================
// Server Startup
// ============================================
app.listen(PORT, () => {
    console.log('='.repeat(65));
    console.log('🚀 IWC Approval Portal - Vessel API Proxy Server');
    console.log('='.repeat(65));
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log('');
    console.log('📡 API Services:');
    console.log(`   Marinesia:  http://localhost:${PORT}/marinesia/api/v1/...`);
    console.log(`   AISStream:  http://localhost:${PORT}/aisstream/search?query=...`);
    console.log('');
    console.log('🔍 Search Endpoints:');
    console.log(`   GET /aisstream/search?query=VESSEL_NAME`);
    console.log(`   GET /aisstream/vessel/:mmsi`);
    console.log(`   GET /aisstream/status`);
    console.log('');
    console.log('✅ Server ready! Starting AISStream connection...');
    console.log('='.repeat(65));

    // Start AISStream connection
    setTimeout(connectAISStream, 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (aisStreamSocket) {
        aisStreamSocket.close();
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }
    process.exit(0);
});
