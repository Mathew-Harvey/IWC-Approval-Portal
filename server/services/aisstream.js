/**
 * AISStream WebSocket Service
 * Maintains connection to AISStream for real-time vessel data
 */

const WebSocket = require('ws');
const vesselCache = require('./vesselCache');

let aisStreamSocket = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Connect to AISStream WebSocket
 */
function connect() {
    const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY;
    
    if (!AISSTREAM_API_KEY) {
        console.log('⚠️  AISStream API key not configured, skipping connection');
        vesselCache.setConnectionStatus('not_configured');
        return;
    }

    if (aisStreamSocket && aisStreamSocket.readyState === WebSocket.OPEN) {
        return;
    }

    console.log('🔌 Connecting to AISStream...');
    vesselCache.setConnectionStatus('connecting');

    try {
        aisStreamSocket = new WebSocket('wss://stream.aisstream.io/v0/stream');

        aisStreamSocket.onopen = () => {
            console.log('✅ AISStream connected');
            vesselCache.setConnectionStatus('connected');
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
            vesselCache.setConnectionStatus('error');
        };

        aisStreamSocket.onclose = (event) => {
            console.log(`🔌 AISStream disconnected (${event.code})`);
            vesselCache.setConnectionStatus('disconnected');
            aisStreamSocket = null;
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`⏳ Reconnecting in ${delay/1000}s...`);
                reconnectTimeout = setTimeout(() => {
                    reconnectAttempts++;
                    connect();
                }, delay);
            }
        };
    } catch (err) {
        console.error('❌ AISStream connection failed:', err.message);
        vesselCache.setConnectionStatus('error');
    }
}

/**
 * Handle incoming AIS message
 */
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
    if (vesselCache.messageCount % 5000 === 0 && vesselCache.messageCount > 0) {
        console.log(`📊 ${vesselCache.vessels.size} vessels cached`);
    }
}

/**
 * Disconnect from AISStream
 */
function disconnect() {
    if (aisStreamSocket) {
        aisStreamSocket.close();
        aisStreamSocket = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
}

/**
 * Get connection status
 */
function getStatus() {
    return vesselCache.getStats();
}

module.exports = {
    connect,
    disconnect,
    getStatus
};

