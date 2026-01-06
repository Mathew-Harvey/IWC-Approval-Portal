/**
 * Job Number Service
 * Generates job numbers in format F#####
 */

const JobNumberService = {
    PREFIX: 'F',

    /**
     * Generate a new job number
     * @returns {string} - Job number (e.g., F12135)
     */
    generate() {
        const counter = StorageService.getNextJobNumber();
        return `${this.PREFIX}${counter}`;
    },

    /**
     * Parse a job number
     * @param {string} jobNumber - Job number string
     * @returns {Object} - Parsed components
     */
    parse(jobNumber) {
        const match = jobNumber.match(/^([A-Z])(\d+)$/);
        if (!match) return null;
        return {
            prefix: match[1],
            number: parseInt(match[2])
        };
    },

    /**
     * Validate job number format
     * @param {string} jobNumber - Job number to validate
     * @returns {boolean} - Is valid
     */
    isValid(jobNumber) {
        return /^F\d{5,}$/.test(jobNumber);
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.JobNumberService = JobNumberService;
}

