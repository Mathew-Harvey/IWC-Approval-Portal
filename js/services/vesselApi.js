/**
 * Vessel API Service
 * 
 * Integrates with backend server for vessel lookups:
 * - Marinesia API (vessel profiles, locations)
 * - AISStream (real-time AIS data cache)
 * 
 * All API calls go through our server - no CORS issues!
 */

const VesselApiService = {
    // API base URL - empty for same-origin requests (production)
    API_BASE: '',
    
    /**
     * Initialize the service
     */
    async init() {
        console.log('🚀 Vessel API Service initializing...');
        
        try {
            const response = await fetch('/health');
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API Server connected:', data.services);
                return {
                    mode: 'server',
                    marinesia: data.services.marinesia === 'available',
                    aisstream: data.services.aisstream === 'connected'
                };
            }
        } catch (e) {
            console.warn('⚠️ Could not connect to API server');
        }
        
        return { mode: 'offline', marinesia: false, aisstream: false };
    },

    /**
     * Smart search - returns combined results from all sources
     */
    async smartSearch(query) {
        const trimmedQuery = query.trim().toUpperCase();
        console.log(`🔍 Searching: "${trimmedQuery}"`);
        
        // Get local saved vessels
        const localResults = this.getLocalMatches(trimmedQuery);
        
        // Get demo vessels
        const mockResults = this.getMockResults(trimmedQuery);
        
        // Determine query type
        const isMMSI = /^\d{9}$/.test(trimmedQuery);
        const isIMO = /^\d{7}$/.test(trimmedQuery);
        
        // Search APIs in parallel
        const [apiResults, aisStreamResults] = await Promise.all([
            this.searchMarinesia(trimmedQuery, isMMSI, isIMO),
            this.searchAISStream(trimmedQuery)
        ]);
        
        const total = apiResults.length + aisStreamResults.length + localResults.length + mockResults.length;
        console.log(`   Results: Marinesia=${apiResults.length}, AISStream=${aisStreamResults.length}, Local=${localResults.length}, Demo=${mockResults.length}`);
        
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
     * Search AISStream cache
     */
    async searchAISStream(query) {
        try {
            const response = await fetch(`/api/aisstream/search?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) return [];
            
            const result = await response.json();
            if (result.error || !result.data) return [];
            
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
        try {
            const response = await fetch('/api/aisstream/status');
            if (!response.ok) return { connectionStatus: 'unavailable' };
            return await response.json();
        } catch (error) {
            return { connectionStatus: 'error' };
        }
    },

    /**
     * Transform AISStream vessel to our format
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
            50: 'Pilot Vessel', 51: 'Search and Rescue', 52: 'Tug',
            53: 'Port Tender', 54: 'Anti-Pollution', 55: 'Law Enforcement',
            58: 'Medical Transport', 59: 'Naval Ship',
            60: 'Passenger Ship', 69: 'Passenger Ship',
            70: 'Cargo Ship', 79: 'Cargo Ship',
            80: 'Tanker', 89: 'Tanker',
            90: 'Other'
        };
        return types[typeCode] || (typeCode ? `Type ${typeCode}` : 'Unknown');
    },

    /**
     * Get local storage vessels that match
     */
    getLocalMatches(query) {
        const vessels = StorageService?.getVessels?.() || [];
        const q = query.toLowerCase();
        
        return vessels.filter(v => 
            (v.vesselName && v.vesselName.toLowerCase().includes(q)) ||
            (v.imoNumber && v.imoNumber.includes(query)) ||
            (v.mmsi && v.mmsi.includes(query))
        ).map(v => ({ ...v, source: 'local' }));
    },

    /**
     * Legacy search function
     */
    async search(query) {
        const results = await this.smartSearch(query);
        
        const allResults = [
            ...results.aisStreamResults,
            ...results.apiResults,
            ...results.localResults,
            ...results.mockResults
        ];
        
        const seen = new Set();
        return allResults.filter(v => {
            const key = v.imoNumber || v.mmsi || v.vesselName;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },

    /**
     * Get vessel by MMSI from Marinesia
     */
    async getByMMSI(mmsi) {
        try {
            const response = await fetch(`/api/marinesia/vessel/${mmsi}/profile`);

            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            if (result.error || !result.data) return null;

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
            const response = await fetch(`/api/marinesia/vessel/profile?filters=${encodeURIComponent(filterString)}&limit=10`);

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const result = await response.json();
            if (result.error || !result.data) return [];

            return result.data.map(v => this.transformVessel(v));
        } catch (error) {
            console.error('Marinesia search error:', error);
            return [];
        }
    },

    /**
     * Transform Marinesia vessel to our format
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
     * Country code mapping
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
     * Get vessel's latest location
     */
    async getLatestLocation(mmsi) {
        try {
            const response = await fetch(`/api/marinesia/vessel/${mmsi}/location/latest`);

            if (!response.ok) return null;

            const result = await response.json();
            if (result.error || !result.data) return null;

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
     * Navigational status text
     */
    getNavStatus(status) {
        const statuses = {
            0: 'Under way using engine', 1: 'At anchor', 2: 'Not under command',
            3: 'Restricted manoeuvrability', 4: 'Constrained by draught',
            5: 'Moored', 6: 'Aground', 7: 'Engaged in fishing',
            8: 'Under way sailing', 11: 'Power-driven towing astern',
            12: 'Power-driven pushing ahead', 14: 'AIS-SART',
            15: 'Not defined'
        };
        return statuses[status] || 'Unknown';
    },

    /**
     * Test API connections
     */
    async testConnection() {
        const results = {
            marinesia: { status: 'error', message: 'Not tested' },
            aisstream: { status: 'unavailable', message: 'Not tested' }
        };
        
        // Test Marinesia via our API
        try {
            const response = await fetch('/api/marinesia/vessel/profile?limit=1');
            if (response.ok) {
                results.marinesia = { status: 'connected', message: 'API working' };
            } else {
                results.marinesia = { status: 'error', message: `HTTP ${response.status}` };
            }
        } catch (error) {
            results.marinesia = { status: 'error', message: error.message };
        }
        
        // Test AISStream
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
                    message: status.connectionStatus 
                };
            }
        } catch (error) {
            results.aisstream = { status: 'error', message: error.message };
        }
        
        return results;
    },

    /**
     * Demo/mock vessel data
     */
    getMockResults(query) {
        const mockVessels = [
            // Commercial Vessels
            { vesselName: 'GINGKO', imoNumber: '9389112', mmsi: '352002084', vesselType: 'Cargo Ship', vesselLOA: 190, vesselBeam: 32, vesselFlag: 'Panama', callsign: '3E3768' },
            { vesselName: 'FUGRO ETIVE', imoNumber: '9665210', mmsi: '235095000', vesselType: 'Offshore Supply Ship', vesselLOA: 82, vesselBeam: 18, vesselFlag: 'United Kingdom', callsign: 'MHFQ8', grossTonnage: 3500 },
            { vesselName: 'FUGRO SALTIRE', imoNumber: '9665222', mmsi: '235096000', vesselType: 'Offshore Supply Ship', vesselLOA: 82, vesselBeam: 18, vesselFlag: 'United Kingdom', callsign: 'MHFR2', grossTonnage: 3500 },
            { vesselName: 'MAERSK HIGHLANDER', imoNumber: '9398056', mmsi: '219633000', vesselType: 'Offshore Tug/Supply Ship', vesselLOA: 91, vesselBeam: 22, vesselFlag: 'Denmark', callsign: 'OWHD2', grossTonnage: 4893 },
            // ============================================
            // SVITZER AUSTRALIA FLEET
            // ============================================
            { vesselName: 'SVITZER ABROLHOS', imoNumber: '', mmsi: '503200001', vesselType: 'Tug', vesselLOA: 28.4, vesselBeam: 11, vesselFlag: 'Australia', grossTonnage: 350 },
            { vesselName: 'SVITZER ALBATROSS', imoNumber: '', mmsi: '503200002', vesselType: 'Tug', vesselLOA: 31.5, vesselBeam: 12, vesselFlag: 'Australia', grossTonnage: 450 },
            { vesselName: 'SVITZER BASS', imoNumber: '', mmsi: '503200003', vesselType: 'Tug', vesselLOA: 24.74, vesselBeam: 10, vesselFlag: 'Australia', grossTonnage: 250 },
            { vesselName: 'SVITZER BILBY', imoNumber: '', mmsi: '503200004', vesselType: 'Tug', vesselLOA: 28.4, vesselBeam: 11, vesselFlag: 'Australia', grossTonnage: 350 },
            { vesselName: 'SVITZER BONDI', imoNumber: '', mmsi: '503200005', vesselType: 'Tug', vesselLOA: 22.73, vesselBeam: 9.5, vesselFlag: 'Australia', grossTonnage: 200 },
            { vesselName: 'SVITZER BOODIE', imoNumber: '', mmsi: '503200006', vesselType: 'Tug', vesselLOA: 33.3, vesselBeam: 12.5, vesselFlag: 'Australia', grossTonnage: 550 },
            { vesselName: 'SVITZER COLMSLIE', imoNumber: '', mmsi: '503200007', vesselType: 'Tug', vesselLOA: 24.47, vesselBeam: 10, vesselFlag: 'Australia', grossTonnage: 250 },
            { vesselName: 'SVITZER DORADO', imoNumber: '', mmsi: '503200008', vesselType: 'Tug', vesselLOA: 28.4, vesselBeam: 11, vesselFlag: 'Australia', grossTonnage: 350 },
            { vesselName: 'SVITZER DRAGON', imoNumber: '', mmsi: '503200009', vesselType: 'Tug', vesselLOA: 28.4, vesselBeam: 11, vesselFlag: 'Australia', grossTonnage: 350 },
            { vesselName: 'SVITZER DUGITE', imoNumber: '', mmsi: '503200010', vesselType: 'Tug', vesselLOA: 32.6, vesselBeam: 12.5, vesselFlag: 'Australia', grossTonnage: 500 },
            { vesselName: 'SVITZER DUGONG', imoNumber: '', mmsi: '503200011', vesselType: 'Tug', vesselLOA: 33.3, vesselBeam: 12.5, vesselFlag: 'Australia', grossTonnage: 550 },
            { vesselName: 'SVITZER EAGLE', imoNumber: '9704821', mmsi: '503124000', vesselType: 'Tug', vesselLOA: 29.09, vesselBeam: 12, vesselFlag: 'Australia', callsign: 'VHF3', grossTonnage: 500 },
            { vesselName: 'SVITZER EDWINA', imoNumber: '', mmsi: '503200012', vesselType: 'Tug', vesselLOA: 33.92, vesselBeam: 12.8, vesselFlag: 'Australia', grossTonnage: 600 },
            { vesselName: 'SVITZER EUREKA', imoNumber: '', mmsi: '503200013', vesselType: 'Tug', vesselLOA: 24.74, vesselBeam: 10, vesselFlag: 'Australia', grossTonnage: 250 },
            { vesselName: 'SVITZER FALCON', imoNumber: '9704819', mmsi: '503123000', vesselType: 'Tug', vesselLOA: 32, vesselBeam: 12, vesselFlag: 'Australia', callsign: 'VHF2', grossTonnage: 500 },
            { vesselName: 'SVITZER WARATAH', imoNumber: '', mmsi: '503200014', vesselType: 'Tug', vesselLOA: 28.67, vesselBeam: 11.2, vesselFlag: 'Australia', grossTonnage: 380 },
            { vesselName: 'SVITZER WARRAWEE', imoNumber: '', mmsi: '503200015', vesselType: 'Tug', vesselLOA: 28.67, vesselBeam: 11.2, vesselFlag: 'Australia', grossTonnage: 380 },
            { vesselName: 'SVITZER WILU', imoNumber: '', mmsi: '503200016', vesselType: 'Tug', vesselLOA: 28.4, vesselBeam: 11, vesselFlag: 'Australia', grossTonnage: 350 },
            { vesselName: 'RV INVESTIGATOR', imoNumber: '9616888', mmsi: '503000000', vesselType: 'Research Vessel', vesselLOA: 94, vesselBeam: 18.5, vesselFlag: 'Australia', callsign: 'VNAC', grossTonnage: 6000 },
            
            // ============================================
            // ROYAL AUSTRALIAN NAVY FLEET
            // ============================================
            
            // Landing Helicopter Docks (LHD)
            { vesselName: 'HMAS CANBERRA', imoNumber: '', mmsi: '503800001', vesselType: 'Landing Helicopter Dock', vesselLOA: 230.8, vesselBeam: 32, vesselFlag: 'Australia', grossTonnage: 27500 },
            { vesselName: 'HMAS ADELAIDE', imoNumber: '', mmsi: '503800002', vesselType: 'Landing Helicopter Dock', vesselLOA: 230.8, vesselBeam: 32, vesselFlag: 'Australia', grossTonnage: 27500 },
            
            // Hobart-class Guided Missile Destroyers (DDG)
            { vesselName: 'HMAS HOBART', imoNumber: '', mmsi: '503800010', vesselType: 'Guided Missile Destroyer', vesselLOA: 147.2, vesselBeam: 18.6, vesselFlag: 'Australia', grossTonnage: 7000 },
            { vesselName: 'HMAS BRISBANE', imoNumber: '', mmsi: '503800011', vesselType: 'Guided Missile Destroyer', vesselLOA: 147.2, vesselBeam: 18.6, vesselFlag: 'Australia', grossTonnage: 7000 },
            { vesselName: 'HMAS SYDNEY', imoNumber: '', mmsi: '503800012', vesselType: 'Guided Missile Destroyer', vesselLOA: 147.2, vesselBeam: 18.6, vesselFlag: 'Australia', grossTonnage: 7000 },
            
            // Anzac-class Frigates (FFH)
            { vesselName: 'HMAS ANZAC', imoNumber: '', mmsi: '503800020', vesselType: 'Frigate', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            { vesselName: 'HMAS ARUNTA', imoNumber: '', mmsi: '503800021', vesselType: 'Frigate', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            { vesselName: 'HMAS WARRAMUNGA', imoNumber: '', mmsi: '503800022', vesselType: 'Frigate', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            { vesselName: 'HMAS STUART', imoNumber: '', mmsi: '503800023', vesselType: 'Frigate', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            { vesselName: 'HMAS PARRAMATTA', imoNumber: '', mmsi: '503800024', vesselType: 'Frigate', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            { vesselName: 'HMAS BALLARAT', imoNumber: '', mmsi: '503800025', vesselType: 'Frigate', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            { vesselName: 'HMAS TOOWOOMBA', imoNumber: '', mmsi: '503800026', vesselType: 'Frigate', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            { vesselName: 'HMAS PERTH', imoNumber: '', mmsi: '503800027', vesselType: 'Frigate', vesselLOA: 118, vesselBeam: 14.8, vesselFlag: 'Australia', grossTonnage: 3600 },
            
            // Collins-class Submarines (SSG)
            { vesselName: 'HMAS COLLINS', imoNumber: '', mmsi: '503800030', vesselType: 'Submarine', vesselLOA: 77.8, vesselBeam: 7.8, vesselFlag: 'Australia', grossTonnage: 3051 },
            { vesselName: 'HMAS FARNCOMB', imoNumber: '', mmsi: '503800031', vesselType: 'Submarine', vesselLOA: 77.8, vesselBeam: 7.8, vesselFlag: 'Australia', grossTonnage: 3051 },
            { vesselName: 'HMAS WALLER', imoNumber: '', mmsi: '503800032', vesselType: 'Submarine', vesselLOA: 77.8, vesselBeam: 7.8, vesselFlag: 'Australia', grossTonnage: 3051 },
            { vesselName: 'HMAS DECHAINEUX', imoNumber: '', mmsi: '503800033', vesselType: 'Submarine', vesselLOA: 77.8, vesselBeam: 7.8, vesselFlag: 'Australia', grossTonnage: 3051 },
            { vesselName: 'HMAS SHEEAN', imoNumber: '', mmsi: '503800034', vesselType: 'Submarine', vesselLOA: 77.8, vesselBeam: 7.8, vesselFlag: 'Australia', grossTonnage: 3051 },
            { vesselName: 'HMAS RANKIN', imoNumber: '', mmsi: '503800035', vesselType: 'Submarine', vesselLOA: 77.8, vesselBeam: 7.8, vesselFlag: 'Australia', grossTonnage: 3051 },
            
            // Arafura-class Offshore Patrol Vessels (OPV)
            { vesselName: 'HMAS ARAFURA', imoNumber: '', mmsi: '503800040', vesselType: 'Offshore Patrol Vessel', vesselLOA: 80, vesselBeam: 13, vesselFlag: 'Australia', grossTonnage: 1640 },
            
            // Cape-class Patrol Boats (P)
            { vesselName: 'HMAS CAPE CAPRICORN', imoNumber: '', mmsi: '503800050', vesselType: 'Patrol Boat', vesselLOA: 58, vesselBeam: 10.6, vesselFlag: 'Australia', grossTonnage: 335 },
            { vesselName: 'HMAS CAPE NATURALISTE', imoNumber: '', mmsi: '503800051', vesselType: 'Patrol Boat', vesselLOA: 58, vesselBeam: 10.6, vesselFlag: 'Australia', grossTonnage: 335 },
            { vesselName: 'HMAS CAPE PILLAR', imoNumber: '', mmsi: '503800052', vesselType: 'Patrol Boat', vesselLOA: 58, vesselBeam: 10.6, vesselFlag: 'Australia', grossTonnage: 335 },
            { vesselName: 'HMAS CAPE SCHANCK', imoNumber: '', mmsi: '503800053', vesselType: 'Patrol Boat', vesselLOA: 58, vesselBeam: 10.6, vesselFlag: 'Australia', grossTonnage: 335 },
            { vesselName: 'HMAS CAPE SOLANDER', imoNumber: '', mmsi: '503800054', vesselType: 'Patrol Boat', vesselLOA: 58, vesselBeam: 10.6, vesselFlag: 'Australia', grossTonnage: 335 },
            { vesselName: 'HMAS CAPE WOOLAMAI', imoNumber: '', mmsi: '503800055', vesselType: 'Patrol Boat', vesselLOA: 58, vesselBeam: 10.6, vesselFlag: 'Australia', grossTonnage: 335 },
            { vesselName: 'HMAS CAPE LEVEQUE', imoNumber: '', mmsi: '503800056', vesselType: 'Patrol Boat', vesselLOA: 58, vesselBeam: 10.6, vesselFlag: 'Australia', grossTonnage: 335 },
            { vesselName: 'HMAS CAPE INSCRIPTION', imoNumber: '', mmsi: '503800057', vesselType: 'Patrol Boat', vesselLOA: 58, vesselBeam: 10.6, vesselFlag: 'Australia', grossTonnage: 335 },
            
            // Huon-class Minehunters (M)
            { vesselName: 'HMAS HUON', imoNumber: '', mmsi: '503800060', vesselType: 'Minehunter', vesselLOA: 52.5, vesselBeam: 9.9, vesselFlag: 'Australia', grossTonnage: 720 },
            { vesselName: 'HMAS GASCOYNE', imoNumber: '', mmsi: '503800061', vesselType: 'Minehunter', vesselLOA: 52.5, vesselBeam: 9.9, vesselFlag: 'Australia', grossTonnage: 720 },
            { vesselName: 'HMAS DIAMANTINA', imoNumber: '', mmsi: '503800062', vesselType: 'Minehunter', vesselLOA: 52.5, vesselBeam: 9.9, vesselFlag: 'Australia', grossTonnage: 720 },
            
            // Supply-class Replenishment Oilers (A)
            { vesselName: 'HMAS SUPPLY', imoNumber: '', mmsi: '503800070', vesselType: 'Replenishment Oiler', vesselLOA: 173.9, vesselBeam: 24, vesselFlag: 'Australia', grossTonnage: 19500 },
            { vesselName: 'HMAS STALWART', imoNumber: '', mmsi: '503800071', vesselType: 'Replenishment Oiler', vesselLOA: 173.9, vesselBeam: 24, vesselFlag: 'Australia', grossTonnage: 19500 },
            
            // Leeuwin-class Survey Vessel (A)
            { vesselName: 'HMAS MELVILLE', imoNumber: '', mmsi: '503800080', vesselType: 'Survey Vessel', vesselLOA: 71.2, vesselBeam: 15.2, vesselFlag: 'Australia', grossTonnage: 2200 }
        ];

        const q = query.toLowerCase();
        
        return mockVessels.filter(v => {
            const name = v.vesselName.toLowerCase();
            const type = (v.vesselType || '').toLowerCase();
            
            if (name.includes(q) || type.includes(q)) return true;
            if (v.imoNumber && v.imoNumber.includes(query)) return true;
            if (v.mmsi && v.mmsi.includes(query)) return true;
            
            return false;
        }).map(v => ({ ...v, source: 'demo' }));
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.VesselApiService = VesselApiService;
}
