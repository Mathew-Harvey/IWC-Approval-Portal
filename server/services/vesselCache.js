/**
 * Vessel Cache for AISStream Data
 * Caches real-time AIS vessel information in memory
 */

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
        
        // Index by name
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

    getVessel(mmsi) {
        return this.vessels.get(mmsi);
    }

    getStats() {
        return {
            totalVessels: this.vessels.size,
            connectionStatus: this.connectionStatus,
            lastUpdate: this.lastUpdate,
            messageCount: this.messageCount
        };
    }

    setConnectionStatus(status) {
        this.connectionStatus = status;
    }
}

// Singleton instance
const vesselCache = new VesselCache();

module.exports = vesselCache;

