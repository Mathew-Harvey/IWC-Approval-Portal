/**
 * Template Loader Module
 * Loads Handlebars templates from external .hbs files in /templates/
 * Each template is standalone with embedded styles
 * 
 * IMPORTANT: Templates are stored in /templates/*.hbs
 * Edit those files to modify document content/styling
 */

const Templates = {
    _cache: {},
    _compiled: {},
    _baseUrl: '/templates/',
    _initialized: false,
    
    // Available templates - edit files in /templates/ folder
    available: {
        'wms': 'wms.hbs',        // Work Method Statement
        'erp': 'erp.hbs',        // Emergency Response Plan
        'whsmp': 'whsmp.hbs',    // WHS Management Plan
        'swms': 'swms.hbs',      // Safe Work Method Statement
        'email': 'email.hbs'     // Email Notification
    },
    
    /**
     * Initialize the template system
     * Call this once on app startup
     */
    async init() {
        if (this._initialized) return;
        
        this.registerHelpers();
        
        // Optionally preload all templates for better performance
        // await this.preloadAll();
        
        this._initialized = true;
        console.log('📄 Templates initialized (external files)');
    },
    
    /**
     * Register custom Handlebars helpers
     */
    registerHelpers() {
        // Equals helper
        Handlebars.registerHelper('eq', function(a, b) {
            return a === b;
        });
        
        // Not equals helper
        Handlebars.registerHelper('neq', function(a, b) {
            return a !== b;
        });
        
        // Greater than helper
        Handlebars.registerHelper('gt', function(a, b) {
            return a > b;
        });
        
        // Less than helper
        Handlebars.registerHelper('lt', function(a, b) {
            return a < b;
        });
        
        // And helper
        Handlebars.registerHelper('and', function() {
            const args = Array.prototype.slice.call(arguments, 0, -1);
            return args.every(Boolean);
        });
        
        // Or helper
        Handlebars.registerHelper('or', function() {
            const args = Array.prototype.slice.call(arguments, 0, -1);
            return args.some(Boolean);
        });

        // Format date helper (DD/MM/YYYY)
        Handlebars.registerHelper('formatDate', function(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-AU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        });

        // Format date long (e.g., "9 January 2026")
        Handlebars.registerHelper('formatDateLong', function(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        });
        
        // Current year helper
        Handlebars.registerHelper('currentYear', function() {
            return new Date().getFullYear();
        });
        
        // JSON stringify helper (for debugging)
        Handlebars.registerHelper('json', function(context) {
            return JSON.stringify(context, null, 2);
        });
        
        // Default value helper
        Handlebars.registerHelper('default', function(value, defaultValue) {
            return value || defaultValue;
        });
    },
    
    /**
     * Fetch a template from the server
     * @param {string} name - Template name (without .hbs extension)
     * @returns {Promise<string>} - Template content
     */
    async fetch(name) {
        // Return from cache if available
        if (this._cache[name]) {
            return this._cache[name];
        }
        
        const filename = this.available[name];
        if (!filename) {
            throw new Error(`Unknown template: "${name}". Available: ${Object.keys(this.available).join(', ')}`);
        }
        
        const url = this._baseUrl + filename;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const content = await response.text();
            this._cache[name] = content;
            return content;
            
        } catch (error) {
            console.error(`Error loading template "${name}" from ${url}:`, error);
            throw new Error(`Failed to load template "${name}": ${error.message}`);
        }
    },
    
    /**
     * Get a compiled template function
     * @param {string} name - Template name
     * @returns {Promise<Function>} - Compiled Handlebars template function
     */
    async getCompiled(name) {
        // Return from compiled cache if available
        if (this._compiled[name]) {
            return this._compiled[name];
        }
        
        const content = await this.fetch(name);
        const compiled = Handlebars.compile(content);
        this._compiled[name] = compiled;
        return compiled;
    },
    
    /**
     * Render a template with data
     * @param {string} name - Template name (wms, erp, whsmp, swms, email)
     * @param {Object} data - Template data
     * @returns {Promise<string>} - Rendered HTML
     */
    async render(name, data) {
        // Ensure initialized
        if (!this._initialized) {
            await this.init();
        }
        
        const template = await this.getCompiled(name);
        return template(data);
    },
    
    /**
     * Preload all templates into cache
     * Call this on app init for better performance
     */
    async preloadAll() {
        const names = Object.keys(this.available);
        console.log(`📄 Preloading ${names.length} templates...`);
        
        const promises = names.map(name => this.fetch(name));
        
        try {
            await Promise.all(promises);
            console.log(`📄 All templates preloaded`);
        } catch (error) {
            console.error('Error preloading templates:', error);
        }
    },
    
    /**
     * Clear the template cache
     * Useful for development/hot reload
     */
    clearCache() {
        this._cache = {};
        this._compiled = {};
        console.log('📄 Template cache cleared');
    },
    
    /**
     * Get list of available template names
     * @returns {Array<string>}
     */
    getAvailable() {
        return Object.keys(this.available);
    },
    
    /**
     * Check if a template exists
     * @param {string} name - Template name
     * @returns {boolean}
     */
    exists(name) {
        return name in this.available;
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.Templates = Templates;
}
