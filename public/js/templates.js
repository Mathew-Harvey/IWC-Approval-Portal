/**
 * Templates Module
 * Compiles and manages Handlebars templates
 */

const Templates = {
    _compiled: {},

    /**
     * Initialize templates from script tags
     */
    init() {
        // Register Handlebars helpers
        this.registerHelpers();

        // Compile templates from script tags
        const templateScripts = document.querySelectorAll('script[type="text/x-handlebars-template"]');
        templateScripts.forEach(script => {
            const name = script.id.replace('-template', '');
            this._compiled[name] = Handlebars.compile(script.innerHTML);
        });
    },

    /**
     * Register custom Handlebars helpers
     */
    registerHelpers() {
        // If helper
        Handlebars.registerHelper('if', function(conditional, options) {
            if (conditional) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        // Unless helper
        Handlebars.registerHelper('unless', function(conditional, options) {
            if (!conditional) {
                return options.fn(this);
            }
            return options.inverse(this);
        });

        // Equals helper
        Handlebars.registerHelper('eq', function(a, b) {
            return a === b;
        });

        // Format date helper
        Handlebars.registerHelper('formatDate', function(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-AU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        });

        // Format date long
        Handlebars.registerHelper('formatDateLong', function(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        });
    },

    /**
     * Render a template with data
     * @param {string} name - Template name
     * @param {Object} data - Template data
     * @returns {string} - Rendered HTML
     */
    render(name, data) {
        if (!this._compiled[name]) {
            console.error(`Template "${name}" not found`);
            return '';
        }
        return this._compiled[name](data);
    },

    /**
     * Get list of available templates
     * @returns {Array} - Template names
     */
    getAvailable() {
        return Object.keys(this._compiled);
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.Templates = Templates;
}

