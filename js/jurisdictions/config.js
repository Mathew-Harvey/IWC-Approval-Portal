/**
 * Jurisdiction Configuration Manager
 * Loads and manages jurisdiction-specific settings for the IWC Approval Portal
 * 
 * Usage:
 *   JurisdictionConfig.init('AU-WA');  // Initialize with default jurisdiction
 *   JurisdictionConfig.set('NZ');      // Switch jurisdiction
 *   JurisdictionConfig.get();          // Get current jurisdiction config
 */

const JurisdictionConfig = {
    // Currently loaded jurisdiction
    _current: null,
    _currentId: null,

    // Registry of available jurisdictions
    _registry: {},

    /**
     * Register a jurisdiction configuration
     * @param {string} id - Jurisdiction identifier (e.g., 'AU-WA', 'NZ', 'SG')
     * @param {Object} config - Jurisdiction configuration object
     */
    register(id, config) {
        this._registry[id] = config;
        console.log(`📍 Registered jurisdiction: ${config.name} (${id})`);
    },

    /**
     * Initialize with a default jurisdiction
     * @param {string} defaultId - Default jurisdiction ID
     */
    init(defaultId = 'AU-WA') {
        // Load saved preference or use default
        const savedId = localStorage.getItem('iwc_jurisdiction') || defaultId;
        this.set(savedId);
        return this._current;
    },

    /**
     * Set the active jurisdiction
     * @param {string} id - Jurisdiction ID
     */
    set(id) {
        if (!this._registry[id]) {
            console.error(`❌ Jurisdiction '${id}' not found. Available: ${Object.keys(this._registry).join(', ')}`);
            // Fall back to first available
            const fallback = Object.keys(this._registry)[0];
            if (fallback) {
                id = fallback;
            } else {
                throw new Error('No jurisdictions registered');
            }
        }

        this._currentId = id;
        this._current = this._registry[id];
        localStorage.setItem('iwc_jurisdiction', id);
        
        console.log(`🌍 Active jurisdiction: ${this._current.name}`);
        
        // Dispatch event for UI updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('jurisdictionChange', { 
                detail: { id, config: this._current } 
            }));
        }

        return this._current;
    },

    /**
     * Get the current jurisdiction configuration
     * @returns {Object} Current jurisdiction config
     */
    get() {
        return this._current;
    },

    /**
     * Get current jurisdiction ID
     * @returns {string} Current jurisdiction ID
     */
    getId() {
        return this._currentId;
    },

    /**
     * Get list of available jurisdictions
     * @returns {Array} Array of {id, name, flag} objects
     */
    getAvailable() {
        return Object.entries(this._registry).map(([id, config]) => ({
            id,
            name: config.name,
            flag: config.flag,
            region: config.region
        }));
    },

    /**
     * Get a specific config value with dot notation
     * @param {string} path - Dot-notation path (e.g., 'regulatoryBodies.primary.name')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Config value
     */
    getValue(path, defaultValue = null) {
        if (!this._current) return defaultValue;
        
        const keys = path.split('.');
        let value = this._current;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    },

    /**
     * Format a phone number according to jurisdiction format
     * @param {string} number - Phone number
     * @returns {string} Formatted number
     */
    formatPhone(number) {
        const format = this.getValue('formatting.phoneFormat', 'international');
        // Basic formatting - can be enhanced per jurisdiction
        return number;
    },

    /**
     * Format a date according to jurisdiction locale
     * @param {string|Date} date - Date to format
     * @param {string} style - 'short', 'long', 'iso'
     * @returns {string} Formatted date
     */
    formatDate(date, style = 'short') {
        const locale = this.getValue('formatting.dateLocale', 'en-AU');
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (style === 'iso') {
            return dateObj.toISOString().split('T')[0];
        }
        
        const options = style === 'long' 
            ? { day: 'numeric', month: 'long', year: 'numeric' }
            : { day: '2-digit', month: '2-digit', year: 'numeric' };
            
        return dateObj.toLocaleDateString(locale, options);
    },

    /**
     * Get regulatory body by role
     * @param {string} role - 'primary', 'port', 'biosecurity', 'environmental'
     * @returns {Object} Regulatory body info
     */
    getRegulatoryBody(role) {
        return this.getValue(`regulatoryBodies.${role}`, null);
    },

    /**
     * Get ports list for current jurisdiction
     * @returns {Array} Array of port objects
     */
    getPorts() {
        return this.getValue('ports', []);
    },

    /**
     * Get emergency contacts for current jurisdiction
     * @returns {Object} Emergency contacts
     */
    getEmergencyContacts() {
        return this.getValue('emergencyContacts', {});
    },

    /**
     * Get scenario logic overrides for current jurisdiction
     * @returns {Object} Scenario logic config
     */
    getScenarioLogic() {
        return this.getValue('scenarioLogic', {});
    },

    /**
     * Check if a specific feature/requirement applies in current jurisdiction
     * @param {string} feature - Feature key
     * @returns {boolean}
     */
    hasFeature(feature) {
        return this.getValue(`features.${feature}`, false);
    },

    /**
     * Get document references for current jurisdiction
     * @returns {Object} Document references
     */
    getDocumentReferences() {
        return this.getValue('documentReferences', {});
    },

    /**
     * Get prohibited biocides list
     * @returns {Array} List of prohibited biocide names
     */
    getProhibitedBiocides() {
        return this.getValue('prohibitedBiocides', []);
    },

    /**
     * Generate regulatory compliance text
     * @param {string} section - Section key
     * @returns {string} Compliance text
     */
    getComplianceText(section) {
        return this.getValue(`complianceText.${section}`, '');
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.JurisdictionConfig = JurisdictionConfig;
}

// Export for Node.js (if needed for testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JurisdictionConfig;
}

