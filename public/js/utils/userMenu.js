/**
 * User Menu Module
 * Handles Dashboard and My Jobs navigation
 */

const UserMenu = {
    // ============================================
    // Initialization
    // ============================================
    
    init() {
        this.createModals();
        this.bindEvents();
        console.log('👤 UserMenu initialized');
    },
    
    bindEvents() {
        // Dashboard
        document.getElementById('btnDashboard')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openDashboard();
        });
        
        // My Jobs
        document.getElementById('btnMyJobs')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openMyJobs();
        });
    },
    
    // ============================================
    // Modal Creation
    // ============================================
    
    createModals() {
        this.createDashboardModal();
        this.createMyJobsModal();
    },
    
    createDashboardModal() {
        if (document.getElementById('dashboardModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'dashboardModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" id="dashboardOverlay"></div>
            <div class="modal-content dashboard-modal">
                <div class="modal-header">
                    <h2>📊 Dashboard</h2>
                    <button class="modal-close" id="dashboardCloseBtn">×</button>
                </div>
                <div class="modal-body">
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-value" id="statTotalJobs">0</div>
                            <div class="stat-label">Total Jobs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="statThisMonth">0</div>
                            <div class="stat-label">This Month</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="statVessels">0</div>
                            <div class="stat-label">Saved Vessels</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h3>📋 Recent Jobs</h3>
                        <div id="recentJobsList" class="recent-jobs-list">
                            <p class="empty-state">No jobs yet. Create your first job to get started!</p>
                        </div>
                    </div>
                    
                    <div class="dashboard-section">
                        <h3>⚡ Quick Actions</h3>
                        <div class="quick-actions">
                            <button class="btn btn-primary" id="dashboardNewJobBtn">
                                ➕ New Job
                            </button>
                            <button class="btn btn-secondary" id="dashboardViewJobsBtn">
                                📋 View All Jobs
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="dashboardCloseFooterBtn">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Bind events (CSP-compliant)
        document.getElementById('dashboardOverlay').addEventListener('click', () => this.closeDashboard());
        document.getElementById('dashboardCloseBtn').addEventListener('click', () => this.closeDashboard());
        document.getElementById('dashboardCloseFooterBtn').addEventListener('click', () => this.closeDashboard());
        document.getElementById('dashboardNewJobBtn').addEventListener('click', () => {
            this.closeDashboard();
            document.getElementById('btnNewJob')?.click();
        });
        document.getElementById('dashboardViewJobsBtn').addEventListener('click', () => {
            this.closeDashboard();
            this.openMyJobs();
        });
    },
    
    createMyJobsModal() {
        if (document.getElementById('myJobsModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'myJobsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" id="myJobsOverlay"></div>
            <div class="modal-content my-jobs-modal">
                <div class="modal-header">
                    <h2>📋 My Jobs</h2>
                    <button class="modal-close" id="myJobsCloseBtn">×</button>
                </div>
                <div class="modal-body">
                    <div class="jobs-toolbar">
                        <div class="search-box">
                            <input type="text" id="jobSearchInput" placeholder="Search jobs...">
                        </div>
                        <div class="sort-options">
                            <select id="jobSortSelect">
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="name-asc">Vessel A-Z</option>
                                <option value="name-desc">Vessel Z-A</option>
                            </select>
                        </div>
                    </div>
                    <div id="myJobsList" class="jobs-list">
                        <p class="empty-state">No jobs saved yet.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="myJobsNewBtn">
                        ➕ New Job
                    </button>
                    <button class="btn btn-secondary" id="myJobsCloseFooterBtn">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Bind events (CSP-compliant)
        document.getElementById('myJobsOverlay').addEventListener('click', () => this.closeMyJobs());
        document.getElementById('myJobsCloseBtn').addEventListener('click', () => this.closeMyJobs());
        document.getElementById('myJobsCloseFooterBtn').addEventListener('click', () => this.closeMyJobs());
        document.getElementById('myJobsNewBtn').addEventListener('click', () => {
            this.closeMyJobs();
            document.getElementById('btnNewJob')?.click();
        });
        document.getElementById('jobSearchInput').addEventListener('input', () => this.filterJobs());
        document.getElementById('jobSortSelect').addEventListener('change', () => this.sortJobs());
    },
    
    // ============================================
    // Dashboard
    // ============================================
    
    openDashboard() {
        this.updateDashboardStats();
        this.updateRecentJobs();
        document.getElementById('dashboardModal').classList.add('active');
        document.getElementById('userMenuDropdown')?.classList.remove('active');
    },
    
    closeDashboard() {
        document.getElementById('dashboardModal').classList.remove('active');
    },
    
    updateDashboardStats() {
        const jobs = StorageService?.getJobs?.() || [];
        const vessels = StorageService?.getVessels?.() || [];
        
        // Total jobs
        document.getElementById('statTotalJobs').textContent = jobs.length;
        
        // Jobs this month
        const now = new Date();
        const thisMonth = jobs.filter(j => {
            const created = new Date(j.createdAt);
            return created.getMonth() === now.getMonth() && 
                   created.getFullYear() === now.getFullYear();
        }).length;
        document.getElementById('statThisMonth').textContent = thisMonth;
        
        // Vessels
        document.getElementById('statVessels').textContent = vessels.length;
    },
    
    updateRecentJobs() {
        const jobs = StorageService?.getJobs?.() || [];
        const listEl = document.getElementById('recentJobsList');
        
        if (jobs.length === 0) {
            listEl.innerHTML = '<p class="empty-state">No jobs yet. Create your first job to get started!</p>';
            return;
        }
        
        // Get 5 most recent jobs
        const recent = [...jobs]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);
        
        listEl.innerHTML = recent.map(job => `
            <div class="job-card" data-job-id="${job.id}">
                <div class="job-card-main">
                    <div class="job-card-title">${this.escapeHtml(job.vesselName || 'Untitled Job')}</div>
                    <div class="job-card-meta">
                        ${job.jobNumber ? `#${job.jobNumber}` : ''} 
                        ${job.clientName ? `• ${this.escapeHtml(job.clientName)}` : ''}
                    </div>
                </div>
                <div class="job-card-date">${this.formatDate(job.updatedAt)}</div>
            </div>
        `).join('');
        
        // Use event delegation for clicks
        listEl.querySelectorAll('.job-card').forEach(card => {
            card.addEventListener('click', () => {
                this.loadJob(card.dataset.jobId);
            });
        });
    },
    
    // ============================================
    // My Jobs
    // ============================================
    
    openMyJobs() {
        this.renderJobsList();
        document.getElementById('myJobsModal').classList.add('active');
        document.getElementById('userMenuDropdown')?.classList.remove('active');
    },
    
    closeMyJobs() {
        document.getElementById('myJobsModal').classList.remove('active');
    },
    
    renderJobsList() {
        const jobs = StorageService?.getJobs?.() || [];
        const listEl = document.getElementById('myJobsList');
        const searchTerm = document.getElementById('jobSearchInput')?.value?.toLowerCase() || '';
        const sortOrder = document.getElementById('jobSortSelect')?.value || 'date-desc';
        
        // Filter
        let filtered = jobs.filter(job => {
            if (!searchTerm) return true;
            return (
                job.vesselName?.toLowerCase().includes(searchTerm) ||
                job.jobNumber?.toLowerCase().includes(searchTerm) ||
                job.clientName?.toLowerCase().includes(searchTerm) ||
                job.imoNumber?.toLowerCase().includes(searchTerm)
            );
        });
        
        // Sort
        filtered.sort((a, b) => {
            switch (sortOrder) {
                case 'date-asc':
                    return new Date(a.updatedAt) - new Date(b.updatedAt);
                case 'name-asc':
                    return (a.vesselName || '').localeCompare(b.vesselName || '');
                case 'name-desc':
                    return (b.vesselName || '').localeCompare(a.vesselName || '');
                default: // date-desc
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
        });
        
        if (filtered.length === 0) {
            listEl.innerHTML = searchTerm 
                ? '<p class="empty-state">No jobs match your search.</p>'
                : '<p class="empty-state">No jobs saved yet. Create your first job to get started!</p>';
            return;
        }
        
        listEl.innerHTML = filtered.map(job => `
            <div class="job-card-full" data-job-id="${job.id}" data-job-name="${this.escapeHtml(job.vesselName || 'this job')}">
                <div class="job-card-left">
                    <div class="job-card-title">${this.escapeHtml(job.vesselName || 'Untitled Job')}</div>
                    <div class="job-card-details">
                        ${job.jobNumber ? `<span class="job-tag">Job #${job.jobNumber}</span>` : ''}
                        ${job.clientName ? `<span class="job-client">${this.escapeHtml(job.clientName)}</span>` : ''}
                        ${job.imoNumber ? `<span class="job-imo">IMO: ${job.imoNumber}</span>` : ''}
                    </div>
                    <div class="job-card-dates">
                        Created: ${this.formatDate(job.createdAt)} • Updated: ${this.formatDate(job.updatedAt)}
                    </div>
                </div>
                <div class="job-card-actions">
                    <button class="btn btn-primary btn-small job-load-btn">
                        📂 Load
                    </button>
                    <button class="btn btn-secondary btn-small job-duplicate-btn">
                        📋 Duplicate
                    </button>
                    <button class="btn btn-danger btn-small job-delete-btn">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
        
        // Bind events using event delegation
        listEl.querySelectorAll('.job-card-full').forEach(card => {
            const jobId = card.dataset.jobId;
            const jobName = card.dataset.jobName;
            
            card.querySelector('.job-load-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadJob(jobId);
            });
            card.querySelector('.job-duplicate-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.duplicateJob(jobId);
            });
            card.querySelector('.job-delete-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteJob(jobId, jobName);
            });
        });
    },
    
    filterJobs() {
        this.renderJobsList();
    },
    
    sortJobs() {
        this.renderJobsList();
    },
    
    loadJob(id) {
        this.closeMyJobs();
        this.closeDashboard();
        
        // Trigger the existing load functionality
        if (typeof window.loadJob === 'function') {
            window.loadJob(id);
        } else {
            // Fallback: dispatch custom event
            window.dispatchEvent(new CustomEvent('loadJob', { detail: { id } }));
        }
    },
    
    duplicateJob(id) {
        const job = StorageService?.getJob?.(id);
        if (!job) return;
        
        // Create a copy with new ID and updated timestamps
        const newJob = {
            ...job,
            id: StorageService.generateId(),
            jobNumber: null, // Will be auto-generated
            vesselName: `${job.vesselName || 'Job'} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        StorageService.saveJob(newJob);
        this.renderJobsList();
        
        FormEnhancements?.showNotification?.('Job duplicated successfully', 'success');
    },
    
    deleteJob(id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
            return;
        }
        
        StorageService?.deleteJob?.(id);
        this.renderJobsList();
        this.updateDashboardStats();
        this.updateRecentJobs();
        
        FormEnhancements?.showNotification?.('Job deleted', 'success');
    },
    
    // ============================================
    // Utilities
    // ============================================
    
    formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-AU', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.UserMenu = UserMenu;
}
