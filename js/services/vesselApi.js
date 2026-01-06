/**
 * Vessel API Service
 * Integrates with Marinesia API and AISStream for comprehensive vessel lookup
 * 
 * Supports two deployment modes:
 * 1. Local development with proxy server (npm start) - Full functionality
 * 2. GitHub Pages / static hosting - Marinesia only via CORS proxy
 * 
 * API Keys are stored in localStorage for security.
 */

const VesselApiService = {
    // Deployment detection
    isLocalDev: false,
    
    // CORS proxy for client-side requests (when not using local proxy)
    CORS_PROXY: 'https://corsproxy.io/?',
    
    // API endpoints
    MARINESIA_BASE: 'https://api.marinesia.com/api/v1',
    LOCAL_PROXY_BASE: '/marinesia/api/v1',
    AISSTREAM_BASE: '/aisstream',
    
    // Default API key (can be overridden by user)
    DEFAULT_MARINESIA_KEY: 'JlOZeHWxHmsGRViFvaVwSNiCH',
    
    /**
     * Initialize the service - detect deployment mode
     */
    async init() {
        // Check if we're running with local proxy
        try {
            const response = await fetch('/health', { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'ok') {
                    this.isLocalDev = true;
                    console.log('🔧 Running with local proxy server');
                    return { mode: 'local', marinesia: true, aisstream: true };
                }
            }
        } catch (e) {
            // Not running with proxy
        }
        
        this.isLocalDev = false;
        console.log('🌐 Running in client-side mode (GitHub Pages compatible)');
        return { mode: 'static', marinesia: true, aisstream: false };
    },
    
    /**
     * Get API key from localStorage or use default
     */
    getMarinesiaKey() {
        return localStorage.getItem('marinesia_api_key') || this.DEFAULT_MARINESIA_KEY;
    },
    
    /**
     * Get AISStream API key from localStorage
     */
    getAISStreamKey() {
        return localStorage.getItem('aisstream_api_key') || '';
    },
    
    /**
     * Save API keys to localStorage
     */
    saveApiKeys(marinesiaKey, aisstreamKey) {
        if (marinesiaKey) {
            localStorage.setItem('marinesia_api_key', marinesiaKey);
        }
        if (aisstreamKey) {
            localStorage.setItem('aisstream_api_key', aisstreamKey);
        }
    },
    
    /**
     * Build URL for Marinesia API - handles both local and static deployment
     */
    buildMarinesiaUrl(endpoint) {
        const apiKey = this.getMarinesiaKey();
        const separator = endpoint.includes('?') ? '&' : '?';
        
        if (this.isLocalDev) {
            // Use local proxy
            return `${this.LOCAL_PROXY_BASE}${endpoint}${separator}key=${apiKey}`;
        } else {
            // Use CORS proxy for static deployment
            const targetUrl = `${this.MARINESIA_BASE}${endpoint}${separator}key=${apiKey}`;
            return `${this.CORS_PROXY}${encodeURIComponent(targetUrl)}`;
        }
    },

    /**
     * Smart search for vessels - returns combined results from multiple sources
     */
    async smartSearch(query) {
        const trimmedQuery = query.trim().toUpperCase();
        
        console.log(`🔍 Smart search: "${trimmedQuery}" (mode: ${this.isLocalDev ? 'local' : 'static'})`);
        
        // Get local saved vessels that match
        const localResults = this.getLocalMatches(trimmedQuery);
        
        // Get mock/demo vessels that match
        const mockResults = this.getMockResults(trimmedQuery);
        
        // Determine query type
        const isMMSI = /^\d{9}$/.test(trimmedQuery);
        const isIMO = /^\d{7}$/.test(trimmedQuery);
        
        // Search APIs in parallel
        const searchPromises = [
            this.searchMarinesia(trimmedQuery, isMMSI, isIMO)
        ];
        
        // Only search AISStream if running with local proxy
        if (this.isLocalDev) {
            searchPromises.push(this.searchAISStream(trimmedQuery));
        }
        
        const results = await Promise.allSettled(searchPromises);
        
        const apiResults = results[0].status === 'fulfilled' ? results[0].value : [];
        const aisStreamResults = (results[1]?.status === 'fulfilled') ? results[1].value : [];
        
        const total = apiResults.length + aisStreamResults.length + localResults.length + mockResults.length;
        console.log(`   Marinesia: ${apiResults.length} | AISStream: ${aisStreamResults.length} | Local: ${localResults.length} | Demo: ${mockResults.length}`);
        
        return {
            apiResults,
            aisStreamResults,
            localResults,
            mockResults,
            totalCount: total
        };
    },

    /**
     * Search Marinesia API
     */
    async searchMarinesia(query, isMMSI, isIMO) {
        try {
            if (isMMSI) {
                const vessel = await this.getByMMSI(query);
                return vessel ? [vessel] : [];
            } else if (isIMO) {
                return await this.searchByFilter(`imo:${query}`);
            } else if (query.length >= 3) {
                const results = await this.searchByFilter(`name:${query}`);
                
                // Try first word if no results
                if (results.length === 0 && query.includes(' ')) {
                    const firstWord = query.split(' ')[0];
                    if (firstWord.length >= 3) {
                        return await this.searchByFilter(`name:${firstWord}`);
                    }
                }
                return results;
            }
            return [];
        } catch (error) {
            console.error('Marinesia search error:', error);
            return [];
        }
    },

    /**
     * Search AISStream cached vessel data (only available with local proxy)
     */
    async searchAISStream(query) {
        if (!this.isLocalDev) {
            return [];
        }
        
        try {
            const response = await fetch(`${this.AISSTREAM_BASE}/search?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                return [];
            }
            
            const result = await response.json();
            
            if (result.error || !result.data) {
                return [];
            }
            
            return result.data.map(v => this.transformAISStreamVessel(v));
        } catch (error) {
            console.error('AISStream search error:', error);
            return [];
        }
    },

    /**
     * Get AISStream connection status
     */
    async getAISStreamStatus() {
        if (!this.isLocalDev) {
            return { connectionStatus: 'unavailable', reason: 'Client-side mode' };
        }
        
        try {
            const response = await fetch(`${this.AISSTREAM_BASE}/status`);
            if (!response.ok) return { connectionStatus: 'unavailable' };
            return await response.json();
        } catch (error) {
            return { connectionStatus: 'error' };
        }
    },

    /**
     * Transform AISStream vessel data to our format
     */
    transformAISStreamVessel(vessel) {
        const countryMap = this.getCountryMap();
        const shipType = this.getShipTypeName(vessel.shipType);
        
        return {
            vesselName: vessel.name || '',
            imoNumber: vessel.imoNumber ? String(vessel.imoNumber) : '',
            mmsi: vessel.mmsi ? String(vessel.mmsi) : '',
            vesselType: shipType,
            vesselLOA: vessel.length || '',
            vesselBeam: vessel.beam || '',
            vesselFlag: countryMap[vessel.country] || vessel.country || '',
            callsign: vessel.callSign || '',
            grossTonnage: '',
            latitude: vessel.latitude,
            longitude: vessel.longitude,
            destination: vessel.destination,
            lastSeen: vessel.lastSeen,
            source: 'aisstream',
            _raw: vessel
        };
    },

    /**
     * Get ship type name from AIS type code
     */
    getShipTypeName(typeCode) {
        const types = {
            20: 'Wing in Ground', 30: 'Fishing', 31: 'Towing', 32: 'Towing (Large)',
            33: 'Dredging', 34: 'Diving Operations', 35: 'Military Operations',
            36: 'Sailing', 37: 'Pleasure Craft', 40: 'High-Speed Craft',
            50: 'Pilot Vessel', 51: 'Search and Rescue Vessel', 52: 'Tug',
            53: 'Port Tender', 54: 'Anti-Pollution Vessel', 55: 'Law Enforcement',
            58: 'Medical Transport', 59: 'Naval Ship',
            60: 'Passenger Ship', 69: 'Passenger Ship',
            70: 'Cargo Ship', 79: 'Cargo Ship',
            80: 'Tanker', 89: 'Tanker',
            90: 'Other Type'
        };
        return types[typeCode] || (typeCode ? `Type ${typeCode}` : 'Unknown');
    },

    /**
     * Get local storage vessels that match query
     */
    getLocalMatches(query) {
        const vessels = StorageService.getVessels() || [];
        const q = query.toLowerCase();
        
        return vessels.filter(v => 
            (v.vesselName && v.vesselName.toLowerCase().includes(q)) ||
            (v.imoNumber && v.imoNumber.includes(query)) ||
            (v.mmsi && v.mmsi.includes(query))
        ).map(v => ({ ...v, source: 'local' }));
    },

    /**
     * Legacy search function - returns combined results
     */
    async search(query) {
        const results = await this.smartSearch(query);
        
        const allResults = [
            ...results.aisStreamResults,
            ...results.apiResults,
            ...results.localResults,
            ...results.mockResults
        ];
        
        // Remove duplicates
        const seen = new Set();
        return allResults.filter(v => {
            const key = v.imoNumber || v.mmsi || v.vesselName;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },

    /**
     * Get vessel profile by MMSI from Marinesia
     */
    async getByMMSI(mmsi) {
        try {
            const url = this.buildMarinesiaUrl(`/vessel/${mmsi}/profile`);
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error || !result.data) {
                return null;
            }

            return this.transformVessel(result.data);
        } catch (error) {
            console.error('Get vessel by MMSI error:', error);
            return null;
        }
    },

    /**
     * Search vessels using Marinesia filters
     */
    async searchByFilter(filterString) {
        try {
            const url = this.buildMarinesiaUrl(`/vessel/profile?filters=${encodeURIComponent(filterString)}&limit=10`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error || !result.data) {
                return [];
            }

            return result.data.map(v => this.transformVessel(v));
        } catch (error) {
            console.error('Marinesia search error:', error);
            return [];
        }
    },

    /**
     * Transform Marinesia API vessel to our format
     */
    transformVessel(vessel) {
        const countryMap = this.getCountryMap();

        return {
            vesselName: vessel.name || '',
            imoNumber: vessel.imo ? String(vessel.imo) : '',
            mmsi: vessel.mmsi ? String(vessel.mmsi) : '',
            vesselType: vessel.ship_type || '',
            vesselLOA: vessel.length || '',
            vesselBeam: vessel.width || '',
            vesselFlag: countryMap[vessel.country] || vessel.country || '',
            callsign: vessel.callsign || '',
            grossTonnage: '',
            source: 'marinesia',
            _raw: vessel
        };
    },

    /**
     * Get country code to name mapping
     */
    getCountryMap() {
        return {
            'PAN': 'Panama', 'GBR': 'United Kingdom', 'USA': 'United States',
            'AUS': 'Australia', 'NOR': 'Norway', 'SGP': 'Singapore',
            'MHL': 'Marshall Islands', 'LBR': 'Liberia', 'HKG': 'Hong Kong',
            'MLT': 'Malta', 'BHS': 'Bahamas', 'CYP': 'Cyprus', 'GRC': 'Greece',
            'JPN': 'Japan', 'CHN': 'China', 'KOR': 'South Korea', 'DNK': 'Denmark',
            'NLD': 'Netherlands', 'DEU': 'Germany', 'ITA': 'Italy', 'FRA': 'France',
            'ESP': 'Spain', 'PRT': 'Portugal', 'BEL': 'Belgium', 'IND': 'India',
            'IDN': 'Indonesia', 'MYS': 'Malaysia', 'PHL': 'Philippines',
            'THA': 'Thailand', 'VNM': 'Vietnam', 'NZL': 'New Zealand',
            'BRA': 'Brazil', 'ARG': 'Argentina', 'CHL': 'Chile', 'MEX': 'Mexico',
            'RUS': 'Russia', 'UKR': 'Ukraine', 'TUR': 'Turkey',
            'SAU': 'Saudi Arabia', 'ARE': 'United Arab Emirates', 'QAT': 'Qatar'
        };
    },

    /**
     * Get vessel's latest location from Marinesia
     */
    async getLatestLocation(mmsi) {
        try {
            const url = this.buildMarinesiaUrl(`/vessel/${mmsi}/location/latest`);
            const response = await fetch(url);

            if (!response.ok) {
                return null;
            }

            const result = await response.json();
            
            if (result.error || !result.data) {
                return null;
            }

            return {
                latitude: result.data.lat,
                longitude: result.data.lng,
                speed: result.data.sog,
                course: result.data.cog,
                heading: result.data.hdt,
                status: this.getNavStatus(result.data.status),
                timestamp: result.data.ts,
                destination: result.data.dest,
                eta: result.data.eta
            };
        } catch (error) {
            console.error('Get location error:', error);
            return null;
        }
    },

    /**
     * Get navigational status text
     */
    getNavStatus(status) {
        const statuses = {
            0: 'Under way using engine', 1: 'At anchor', 2: 'Not under command',
            3: 'Restricted manoeuvrability', 4: 'Constrained by draught',
            5: 'Moored', 6: 'Aground', 7: 'Engaged in fishing',
            8: 'Under way sailing', 11: 'Power-driven vessel towing astern',
            12: 'Power-driven vessel pushing ahead', 14: 'AIS-SART (active)',
            15: 'Not defined'
        };
        return statuses[status] || 'Unknown';
    },

    /**
     * Test API connection
     */
    async testConnection() {
        const results = {
            marinesia: { status: 'error', message: 'Not tested' },
            aisstream: { status: 'unavailable', message: 'Not available in client mode' }
        };
        
        // Test Marinesia
        try {
            const url = this.buildMarinesiaUrl('/vessel/profile?limit=1');
            const response = await fetch(url);
            if (response.ok) {
                results.marinesia = { status: 'connected', message: 'API is working' };
            } else {
                results.marinesia = { status: 'error', message: `HTTP ${response.status}` };
            }
        } catch (error) {
            results.marinesia = { status: 'error', message: error.message };
        }
        
        // Test AISStream (only if local)
        if (this.isLocalDev) {
            try {
                const status = await this.getAISStreamStatus();
                if (status.connectionStatus === 'connected') {
                    results.aisstream = { 
                        status: 'connected', 
                        message: `${status.totalVessels} vessels cached` 
                    };
                } else {
                    results.aisstream = { 
                        status: status.connectionStatus, 
                        message: status.reason || 'Disconnected' 
                    };
                }
            } catch (error) {
                results.aisstream = { status: 'error', message: error.message };
            }
        }
        
        return results;
    },

    /**
     * Get mock results for demo/offline mode
     */
    getMockResults(query) {
        const mockVessels = [
            { vesselName: 'GINGKO', imoNumber: '9389112', mmsi: '352002084', vesselType: 'Cargo Ship', vesselLOA: 190, vesselBeam: 32, vesselFlag: 'Panama', callsign: '3E3768' },
            { vesselName: 'FUGRO ETIVE', imoNumber: '9665210', mmsi: '235095000', vesselType: 'Offshore Supply Ship', vesselLOA: 82, vesselBeam: 18, vesselFlag: 'United Kingdom', callsign: 'MHFQ8', grossTonnage: 3500 },
            { vesselName: 'FUGRO SALTIRE', imoNumber: '9665222', mmsi: '235096000', vesselType: 'Offshore Supply Ship', vesselLOA: 82, vesselBeam: 18, vesselFlag: 'United Kingdom', callsign: 'MHFR2', grossTonnage: 3500 },
            { vesselName: 'MAERSK HIGHLANDER', imoNumber: '9398056', mmsi: '219633000', vesselType: 'Offshore Tug/Supply Ship', vesselLOA: 91, vesselBeam: 22, vesselFlag: 'Denmark', callsign: 'OWHD2', grossTonnage: 4893 },
            { vesselName: 'HMAS ANZAC', imoNumber: '', mmsi: '503800000', vesselType: 'Naval Ship', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            { vesselName: 'HMAS HOBART', imoNumber: '', mmsi: '503800002', vesselType: 'Naval Ship', vesselLOA: 147, vesselBeam: 18.6, vesselFlag: 'Australia', grossTonnage: 6250 },
            { vesselName: 'HMAS CANBERRA', imoNumber: '', mmsi: '503800004', vesselType: 'Landing Helicopter Dock', vesselLOA: 230.8, vesselBeam: 32, vesselFlag: 'Australia', grossTonnage: 27500 },
            { vesselName: 'SVITZER FALCON', imoNumber: '9704819', mmsi: '503123000', vesselType: 'Tug', vesselLOA: 32, vesselBeam: 12, vesselFlag: 'Australia', callsign: 'VHF2', grossTonnage: 500 },
            { vesselName: 'SVITZER EAGLE', imoNumber: '9704821', mmsi: '503124000', vesselType: 'Tug', vesselLOA: 32, vesselBeam: 12, vesselFlag: 'Australia', callsign: 'VHF3', grossTonnage: 500 },
            { vesselName: 'FREMANTLE PILOT', imoNumber: '', mmsi: '503126000', vesselType: 'Pilot Vessel', vesselLOA: 20, vesselBeam: 6, vesselFlag: 'Australia', grossTonnage: 50 },
            { vesselName: 'RV INVESTIGATOR', imoNumber: '9616888', mmsi: '503000000', vesselType: 'Research Vessel', vesselLOA: 94, vesselBeam: 18.5, vesselFlag: 'Australia', callsign: 'VNAC', grossTonnage: 6000 },
            { vesselName: 'BOURBON RAINBOW', imoNumber: '9412345', mmsi: '226123000', vesselType: 'Platform Supply Ship', vesselLOA: 78, vesselBeam: 17, vesselFlag: 'France', grossTonnage: 3200 }
        ];

        const q = query.toLowerCase();
        
        return mockVessels.filter(v => {
            const name = v.vesselName.toLowerCase();
            const type = (v.vesselType || '').toLowerCase();
            
            if (name.includes(q) || type.includes(q)) return true;
            
            const queryWords = q.split(/\s+/).filter(w => w.length >= 2);
            const nameWords = name.split(/\s+/);
            
            for (const qw of queryWords) {
                for (const nw of nameWords) {
                    if (nw.includes(qw) || qw.includes(nw)) return true;
                }
            }
            
            if (v.imoNumber && v.imoNumber.includes(query)) return true;
            if (v.mmsi && v.mmsi.includes(query)) return true;
            
            return false;
        }).map(v => ({ ...v, source: 'demo' }));
    },

    /**
     * Check if API is configured
     */
    isConfigured() {
        return !!this.getMarinesiaKey();
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.VesselApiService = VesselApiService;
}
