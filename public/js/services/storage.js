/**
 * Storage Service
 * Handles LocalStorage operations for jobs and vessels
 */

const StorageService = {
    KEYS: {
        JOBS: 'iwc_jobs',
        VESSELS: 'iwc_vessels',
        SETTINGS: 'iwc_settings',
        JOB_COUNTER: 'iwc_job_counter'
    },

    /**
     * Save a job to storage
     * @param {Object} job - Job data
     * @returns {Object} - Saved job with ID
     */
    saveJob(job) {
        const jobs = this.getJobs();
        
        if (!job.id) {
            job.id = this.generateId();
        }
        
        job.updatedAt = new Date().toISOString();
        
        if (!job.createdAt) {
            job.createdAt = job.updatedAt;
        }

        const existingIndex = jobs.findIndex(j => j.id === job.id);
        if (existingIndex >= 0) {
            jobs[existingIndex] = job;
        } else {
            jobs.push(job);
        }

        localStorage.setItem(this.KEYS.JOBS, JSON.stringify(jobs));
        return job;
    },

    /**
     * Get all saved jobs
     * @returns {Array} - Array of jobs
     */
    getJobs() {
        const data = localStorage.getItem(this.KEYS.JOBS);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Get a specific job by ID
     * @param {string} id - Job ID
     * @returns {Object|null} - Job data or null
     */
    getJob(id) {
        const jobs = this.getJobs();
        return jobs.find(j => j.id === id) || null;
    },

    /**
     * Delete a job
     * @param {string} id - Job ID
     * @returns {boolean} - Success status
     */
    deleteJob(id) {
        const jobs = this.getJobs();
        const filtered = jobs.filter(j => j.id !== id);
        localStorage.setItem(this.KEYS.JOBS, JSON.stringify(filtered));
        return filtered.length < jobs.length;
    },

    /**
     * Save vessel to database
     * @param {Object} vessel - Vessel data
     * @returns {Object} - Saved vessel
     */
    saveVessel(vessel) {
        const vessels = this.getVessels();
        
        // Use IMO as unique identifier if available
        const identifier = vessel.imoNumber || vessel.vesselName;
        const existingIndex = vessels.findIndex(v => 
            (v.imoNumber && v.imoNumber === vessel.imoNumber) ||
            (v.vesselName === vessel.vesselName)
        );

        if (existingIndex >= 0) {
            vessels[existingIndex] = { ...vessels[existingIndex], ...vessel };
        } else {
            vessels.push(vessel);
        }

        localStorage.setItem(this.KEYS.VESSELS, JSON.stringify(vessels));
        return vessel;
    },

    /**
     * Get all saved vessels
     * @returns {Array} - Array of vessels
     */
    getVessels() {
        const data = localStorage.getItem(this.KEYS.VESSELS);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Find vessel by IMO or name
     * @param {string} query - Search query
     * @returns {Object|null} - Vessel data or null
     */
    findVessel(query) {
        const vessels = this.getVessels();
        const q = query.toLowerCase();
        return vessels.find(v => 
            v.imoNumber?.toLowerCase() === q ||
            v.vesselName?.toLowerCase().includes(q)
        ) || null;
    },

    /**
     * Get and increment job counter
     * @returns {number} - Next job number
     */
    getNextJobNumber() {
        let counter = parseInt(localStorage.getItem(this.KEYS.JOB_COUNTER)) || 12134;
        counter++;
        localStorage.setItem(this.KEYS.JOB_COUNTER, counter.toString());
        return counter;
    },

    /**
     * Generate unique ID
     * @returns {string} - UUID
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Clear all data (for testing)
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
}

