/**
 * IWC Notification Package Generator
 * Main Application Module
 */

const App = {
    currentJob: null,
    activeTab: 'wms',

    /**
     * Initialize the application
     */
    async init() {
        // Initialize templates
        Templates.init();

        // Initialize API service and detect deployment mode
        await this.initApiService();

        // Generate initial job number
        this.generateNewJob();

        // Set default dates
        this.setDefaultDates();

        // Bind event listeners
        this.bindEvents();

        // Update calculated fields
        this.updateCalculations();
        
        // Load saved API keys into settings form
        this.loadApiSettings();
    },
    
    /**
     * Initialize API service
     */
    async initApiService() {
        const status = await VesselApiService.init();
        console.log('API Service initialized:', status);
        
        // Update the help text based on API status
        const helpText = document.querySelector('.vessel-lookup .help-text');
        if (helpText) {
            if (status.mode === 'server' && status.aisstream) {
                helpText.innerHTML = 'Powered by Marinesia + AISStream <span style="color: #10b981;">● Live</span>';
            } else if (status.mode === 'server') {
                helpText.innerHTML = 'Powered by Marinesia API <span style="color: #3b82f6;">● Connected</span>';
            } else {
                helpText.innerHTML = 'Powered by Demo Data <span style="color: #f59e0b;">● Offline</span>';
            }
        }
    },

    /**
     * Generate a new job
     */
    generateNewJob() {
        const jobNumber = JobNumberService.generate();
        document.getElementById('jobNumber').value = jobNumber;
        this.currentJob = { jobNumber };
    },

    /**
     * Set default dates
     */
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('revisionDate').value = today;
        
        // Set proposed start date to next week
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        document.getElementById('proposedStartDate').value = nextWeek.toISOString().split('T')[0];
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Form inputs that affect calculations
        const calcInputs = [
            'afcType', 'foulingRating', 'foulingCover', 'biofoulingOrigin',
            'afcCondition', 'noProhibitedBiocides', 'scopeHull', 'scopeNicheAreas', 'scopePropeller'
        ];
        calcInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.updateCalculations());
            }
        });

        // Cleaning location toggle
        document.getElementById('cleaningLocation').addEventListener('change', (e) => {
            const otherGroup = document.getElementById('otherLocationGroup');
            otherGroup.style.display = e.target.value === 'other' ? 'block' : 'none';
        });

        // Vessel search
        document.getElementById('btnSearchVessel').addEventListener('click', () => this.searchVessel());
        document.getElementById('vesselSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchVessel();
            }
        });

        // Vessel search modal
        document.getElementById('closeVesselModal').addEventListener('click', () => this.closeVesselModal());
        document.getElementById('btnCancelSearch').addEventListener('click', () => this.closeVesselModal());
        document.getElementById('btnEnterManually').addEventListener('click', () => {
            this.closeVesselModal();
            document.getElementById('vesselName').focus();
        });
        
        // Close modal on overlay click
        document.querySelector('#vesselSearchModal .modal-overlay')?.addEventListener('click', () => {
            this.closeVesselModal();
        });

        // Action buttons
        document.getElementById('btnNewJob').addEventListener('click', () => this.newJob());
        document.getElementById('btnLoadJob').addEventListener('click', () => this.showSavedJobs());
        document.getElementById('btnSaveJob').addEventListener('click', () => this.saveJob());
        document.getElementById('btnGenerateEmail').addEventListener('click', () => this.generateEmail());
        document.getElementById('btnGenerateWMS').addEventListener('click', () => this.generateWMS());
        document.getElementById('btnPrint').addEventListener('click', () => window.print());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Modal close buttons
        document.getElementById('closeEmailModal').addEventListener('click', () => this.closeModal('emailModal'));
        document.getElementById('btnCloseEmailModal').addEventListener('click', () => this.closeModal('emailModal'));
        document.getElementById('closeSavedJobsModal').addEventListener('click', () => this.closeModal('savedJobsModal'));

        // Copy email
        document.getElementById('btnCopyEmailModal').addEventListener('click', () => this.copyEmail());
        document.getElementById('btnCopyEmail').addEventListener('click', () => this.copyEmail());
        
        // Settings modal
        document.getElementById('btnSettings').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('settingsModalOverlay').addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('btnSaveSettings').addEventListener('click', () => this.saveApiSettings());
        document.getElementById('btnTestConnection').addEventListener('click', () => this.testApiConnection());
        
        // API key visibility toggle
        document.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                    e.target.textContent = input.type === 'password' ? '👁️' : '🙈';
                }
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    },
    
    // ============================================
    // Settings Modal Methods
    // ============================================
    
    /**
     * Show settings modal
     */
    showSettingsModal() {
        document.getElementById('settingsModal').style.display = 'flex';
        this.updateDeploymentStatus();
    },
    
    /**
     * Close settings modal
     */
    closeSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    },
    
    /**
     * Load API settings from localStorage
     */
    loadApiSettings() {
        const marinesiaKey = localStorage.getItem('marinesia_api_key') || '';
        const aisstreamKey = localStorage.getItem('aisstream_api_key') || '';
        
        document.getElementById('marinesiaApiKey').value = marinesiaKey;
        document.getElementById('aisstreamApiKey').value = aisstreamKey;
    },
    
    /**
     * Save API settings to localStorage
     */
    saveApiSettings() {
        const marinesiaKey = document.getElementById('marinesiaApiKey').value.trim();
        const aisstreamKey = document.getElementById('aisstreamApiKey').value.trim();
        
        VesselApiService.saveApiKeys(marinesiaKey, aisstreamKey);
        
        // Show confirmation
        const btn = document.getElementById('btnSaveSettings');
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.classList.add('btn-success');
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('btn-success');
        }, 2000);
    },
    
    /**
     * Test API connection
     */
    async testApiConnection() {
        const btn = document.getElementById('btnTestConnection');
        btn.textContent = 'Testing...';
        btn.disabled = true;
        
        try {
            // Re-initialize with current settings
            await VesselApiService.init();
            const results = await VesselApiService.testConnection();
            
            // Update status display
            const marinesiaStatus = document.getElementById('marinesiaStatus');
            const aisstreamStatus = document.getElementById('aisstreamStatus');
            
            marinesiaStatus.textContent = results.marinesia.status === 'connected' 
                ? '✓ Connected' 
                : `✗ ${results.marinesia.message}`;
            marinesiaStatus.className = `status-value ${results.marinesia.status}`;
            
            aisstreamStatus.textContent = results.aisstream.status === 'connected'
                ? `✓ ${results.aisstream.message}`
                : results.aisstream.message;
            aisstreamStatus.className = `status-value ${results.aisstream.status}`;
            
        } catch (error) {
            console.error('Connection test error:', error);
        } finally {
            btn.textContent = 'Test Connection';
            btn.disabled = false;
        }
    },
    
    /**
     * Update deployment status display
     */
    async updateDeploymentStatus() {
        const modeEl = document.getElementById('deploymentMode');
        const marinesiaEl = document.getElementById('marinesiaStatus');
        const aisstreamEl = document.getElementById('aisstreamStatus');
        
        if (VesselApiService.isLocalDev) {
            modeEl.textContent = '🖥️ Local Development';
            modeEl.className = 'status-value connected';
        } else {
            modeEl.textContent = '🌐 Static/GitHub Pages';
            modeEl.className = 'status-value partial';
        }
        
        // Test connections
        await this.testApiConnection();
    },

    /**
     * Search for vessel using smart search with modal
     */
    async searchVessel() {
        const query = document.getElementById('vesselSearch').value.trim();
        if (!query) {
            alert('Please enter a vessel name, IMO, or MMSI to search.');
            return;
        }

        if (query.length < 2) {
            alert('Please enter at least 2 characters to search.');
            return;
        }

        const btn = document.getElementById('btnSearchVessel');
        btn.textContent = 'Searching...';
        btn.disabled = true;

        // Show modal with loading state
        this.showVesselModal();
        
        try {
            const searchResults = await VesselApiService.smartSearch(query);
            this.displayVesselResults(searchResults, query);
        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. Please enter details manually.');
        } finally {
            btn.textContent = 'Search';
            btn.disabled = false;
        }
    },

    /**
     * Populate vessel fields from API result
     */
    populateVesselFields(vessel) {
        document.getElementById('vesselName').value = vessel.vesselName || '';
        document.getElementById('imoNumber').value = vessel.imoNumber || '';
        document.getElementById('mmsiNumber').value = vessel.mmsi || '';
        document.getElementById('vesselType').value = vessel.vesselType || '';
        document.getElementById('vesselLOA').value = vessel.vesselLOA || '';
        document.getElementById('vesselBeam').value = vessel.vesselBeam || '';
        document.getElementById('grossTonnage').value = vessel.grossTonnage || '';
        document.getElementById('vesselFlag').value = vessel.vesselFlag || '';

        // Save to local vessel database
        StorageService.saveVessel(vessel);
    },

    /**
     * Show vessel search modal
     */
    showVesselModal() {
        const modal = document.getElementById('vesselSearchModal');
        const statusEl = document.getElementById('vesselSearchStatus');
        const resultsEl = document.getElementById('vesselSearchResults');
        const noResultsEl = document.getElementById('noVesselResults');
        
        // Reset modal state
        statusEl.style.display = 'flex';
        resultsEl.innerHTML = '';
        resultsEl.style.display = 'none';
        noResultsEl.style.display = 'none';
        
        modal.style.display = 'flex';
    },

    /**
     * Close vessel search modal
     */
    closeVesselModal() {
        document.getElementById('vesselSearchModal').style.display = 'none';
    },

    /**
     * Display vessel search results in modal
     */
    displayVesselResults(searchResults, query) {
        const statusEl = document.getElementById('vesselSearchStatus');
        const resultsEl = document.getElementById('vesselSearchResults');
        const noResultsEl = document.getElementById('noVesselResults');
        
        statusEl.style.display = 'none';
        
        const { apiResults, aisStreamResults = [], localResults, mockResults, totalCount } = searchResults;
        
        if (totalCount === 0) {
            noResultsEl.style.display = 'block';
            resultsEl.style.display = 'none';
            return;
        }
        
        resultsEl.style.display = 'grid';
        let html = '';
        
        // Results count with API indicator
        const apiCount = apiResults.length + aisStreamResults.length;
        html += `<div class="results-count" style="grid-column: 1 / -1;">
            Found <strong>${totalCount}</strong> vessel(s) matching "<strong>${query}</strong>"
            ${apiCount > 0 ? `<span style="color: #10b981; margin-left: 0.5rem;">✓ Live API</span>` : ''}
        </div>`;
        
        // AISStream Results (highest priority - real-time data)
        if (aisStreamResults.length > 0) {
            html += `<div class="results-section-title" style="grid-column: 1 / -1; margin-top: 0.5rem; color: #10b981; font-size: 0.85rem;">
                📡 AISStream (Real-time)
            </div>`;
            aisStreamResults.forEach(vessel => {
                html += this.renderVesselCard(vessel, 'aisstream');
            });
        }
        
        // Marinesia API Results
        if (apiResults.length > 0) {
            if (aisStreamResults.length > 0) {
                html += `<div class="results-section-title" style="grid-column: 1 / -1; margin-top: 1rem; color: #3b82f6; font-size: 0.85rem;">
                    🌐 Marinesia
                </div>`;
            }
            apiResults.forEach(vessel => {
                html += this.renderVesselCard(vessel, 'marinesia');
            });
        }
        
        // Demo Results (only show if no live API results)
        if (mockResults.length > 0 && apiCount === 0) {
            html += `<div class="results-section-title" style="grid-column: 1 / -1; margin-top: 1rem; color: #64748b; font-size: 0.85rem;">
                📦 Demo Vessels
            </div>`;
            mockResults.forEach(vessel => {
                html += this.renderVesselCard(vessel, 'demo');
            });
        }
        
        // Local saved vessels
        if (localResults.length > 0) {
            html += `<div class="results-section-title" style="grid-column: 1 / -1; margin-top: 1rem; color: #8b5cf6; font-size: 0.85rem;">
                💾 Previously Saved
            </div>`;
            localResults.forEach(vessel => {
                html += this.renderVesselCard(vessel, 'local');
            });
        }
        
        resultsEl.innerHTML = html;
        
        // Add click handlers to all vessel cards
        resultsEl.querySelectorAll('.vessel-result-card').forEach(card => {
            card.addEventListener('click', () => {
                const vesselData = JSON.parse(card.dataset.vessel);
                this.selectVessel(vesselData);
            });
        });
    },

    /**
     * Render a vessel card for the search results
     */
    renderVesselCard(vessel, source) {
        const sourceLabels = {
            'aisstream': '📡 AIS Live',
            'marinesia': '🌐 Marinesia',
            'api': '🌐 Marinesia',
            'demo': '📦 Demo',
            'local': '💾 Saved'
        };
        
        const sourceColors = {
            'aisstream': '#10b981',  // Green
            'marinesia': '#3b82f6',  // Blue
            'api': '#3b82f6',        // Blue
            'demo': '#64748b',       // Gray
            'local': '#8b5cf6'       // Purple
        };
        
        const vesselJson = JSON.stringify(vessel).replace(/"/g, '&quot;');
        const sourceColor = sourceColors[source] || '#64748b';
        
        // Add position info if available (from AISStream)
        let positionInfo = '';
        if (vessel.latitude && vessel.longitude) {
            positionInfo = `
                <div class="vessel-detail-row">
                    <span class="vessel-detail-label">Position:</span>
                    <span class="vessel-detail-value" style="font-size: 0.75rem;">${vessel.latitude.toFixed(3)}°, ${vessel.longitude.toFixed(3)}°</span>
                </div>`;
        }
        
        // Add destination if available
        let destInfo = '';
        if (vessel.destination && vessel.destination.trim()) {
            destInfo = `
                <div class="vessel-detail-row">
                    <span class="vessel-detail-label">Dest:</span>
                    <span class="vessel-detail-value" style="font-size: 0.75rem;">${vessel.destination.trim()}</span>
                </div>`;
        }
        
        return `
            <div class="vessel-result-card" data-vessel="${vesselJson}" style="border-left: 3px solid ${sourceColor};">
                <div class="vessel-card-header">
                    <h4 class="vessel-card-name">${vessel.vesselName || 'Unknown'}</h4>
                    <span class="vessel-card-flag">${vessel.vesselFlag || 'N/A'}</span>
                </div>
                <div class="vessel-card-details">
                    <div class="vessel-detail-row">
                        <span class="vessel-detail-label">IMO:</span>
                        <span class="vessel-detail-value">${vessel.imoNumber || '-'}</span>
                    </div>
                    <div class="vessel-detail-row">
                        <span class="vessel-detail-label">MMSI:</span>
                        <span class="vessel-detail-value">${vessel.mmsi || '-'}</span>
                    </div>
                    <div class="vessel-detail-row">
                        <span class="vessel-detail-label">LOA:</span>
                        <span class="vessel-detail-value">${vessel.vesselLOA ? vessel.vesselLOA + 'm' : '-'}</span>
                    </div>
                    <div class="vessel-detail-row">
                        <span class="vessel-detail-label">Beam:</span>
                        <span class="vessel-detail-value">${vessel.vesselBeam ? vessel.vesselBeam + 'm' : '-'}</span>
                    </div>
                    ${positionInfo}
                    ${destInfo}
                </div>
                <div class="vessel-card-type" style="color: ${sourceColor};">
                    ${vessel.vesselType || 'Unknown type'} • ${sourceLabels[source] || source}
                </div>
                <button class="vessel-select-btn">Select →</button>
            </div>
        `;
    },

    /**
     * Select a vessel from the search results
     */
    selectVessel(vessel) {
        this.populateVesselFields(vessel);
        this.closeVesselModal();
        
        // Show a brief confirmation
        const vesselName = vessel.vesselName || 'Vessel';
        console.log(`Selected vessel: ${vesselName}`);
    },

    /**
     * Update calculated fields based on form inputs
     */
    updateCalculations() {
        const data = this.getFormData();
        const determination = ScenarioLogic.determine(data);

        // Update scenario card
        const scenarioCard = document.getElementById('scenarioCard');
        document.getElementById('scenarioText').textContent = determination.scenario || '-';

        // Update capture card
        const captureCard = document.getElementById('captureCard');
        const captureText = document.getElementById('captureText');
        captureText.textContent = determination.captureRequired ? 'Yes' : 'No';
        captureCard.className = `requirement-card ${determination.captureRequired ? 'capture-yes' : 'capture-no'}`;

        // Update SAP card
        const sapCard = document.getElementById('sapCard');
        const sapText = document.getElementById('sapText');
        sapText.textContent = determination.sapRequired ? 'Yes' : 'No';
        sapCard.className = `requirement-card ${determination.sapRequired ? 'sap-yes' : 'sap-no'}`;

        // Update risk card
        const riskCard = document.getElementById('riskCard');
        const riskText = document.getElementById('riskText');
        riskText.textContent = determination.riskLevel.charAt(0).toUpperCase() + determination.riskLevel.slice(1);
        riskCard.className = `requirement-card risk-${determination.riskLevel}`;

        // Update warning messages
        const warningContainer = document.getElementById('warningMessages');
        warningContainer.innerHTML = determination.warnings.map(w => 
            `<div class="warning-message">⚠️ ${w}</div>`
        ).join('');
    },

    /**
     * Get all form data
     */
    getFormData() {
        return {
            jobNumber: document.getElementById('jobNumber').value,
            clientName: document.getElementById('clientName').value,
            proposedStartDate: document.getElementById('proposedStartDate').value,
            estimatedDuration: document.getElementById('estimatedDuration').value,
            
            vesselName: document.getElementById('vesselName').value,
            imoNumber: document.getElementById('imoNumber').value,
            mmsiNumber: document.getElementById('mmsiNumber').value,
            vesselType: document.getElementById('vesselType').value,
            vesselLOA: parseFloat(document.getElementById('vesselLOA').value) || 0,
            vesselBeam: parseFloat(document.getElementById('vesselBeam').value) || 0,
            vesselFlag: document.getElementById('vesselFlag').value,
            grossTonnage: document.getElementById('grossTonnage').value,
            
            afcType: document.getElementById('afcType').value,
            afcProductName: document.getElementById('afcProductName').value,
            afcApplicationDate: document.getElementById('afcApplicationDate').value,
            afcServiceLife: document.getElementById('afcServiceLife').value,
            noProhibitedBiocides: document.getElementById('noProhibitedBiocides').checked,
            afcCondition: document.getElementById('afcCondition').value,
            
            recentPortCalls: document.getElementById('recentPortCalls').value,
            stationaryPeriods: document.getElementById('stationaryPeriods').value,
            operatingProfile: document.getElementById('operatingProfile').value,
            imsTrackingDoc: document.getElementById('imsTrackingDoc').value,
            biofoulingOrigin: document.getElementById('biofoulingOrigin').value,
            
            scopeHull: document.getElementById('scopeHull').checked,
            scopeNicheAreas: document.getElementById('scopeNicheAreas').checked,
            scopePropeller: document.getElementById('scopePropeller').checked,
            cleaningLocation: document.getElementById('cleaningLocation').value === 'other' 
                ? document.getElementById('otherLocation').value 
                : document.getElementById('cleaningLocation').value,
            
            foulingRating: document.getElementById('foulingRating').value,
            foulingCover: document.getElementById('foulingCover').value,
            foulingDescription: document.getElementById('foulingDescription').value,
            
            authorName: document.getElementById('authorName').value,
            revisionDate: document.getElementById('revisionDate').value
        };
    },

    /**
     * Prepare template data with calculated fields
     */
    prepareTemplateData(formData) {
        const determination = ScenarioLogic.determine(formData);
        const checklist = ScenarioLogic.getChecklist(formData, determination);

        // Build scope areas text
        const scopeAreas = [];
        if (formData.scopeHull) scopeAreas.push('hull plating and underwater surfaces');
        if (formData.scopeNicheAreas) scopeAreas.push('niche areas');
        if (formData.scopePropeller) scopeAreas.push('propeller');
        const scopeAreasText = scopeAreas.join(', ') || 'hull plating and underwater surfaces';

        // Determine cleaning type text
        let cleaningTypeText = 'full in-water hull clean with capture';
        if (!determination.captureRequired) {
            cleaningTypeText = 'in-water hull grooming';
        }

        // AFC type text
        const afcTypeText = formData.afcType === 'biocidal' ? 'Biocidal' : 
                           formData.afcType === 'non-biocidal' ? 'Non-biocidal' : 'Unknown';

        // Operating profile compliance text
        let operatingProfileCompliance = '';
        if (formData.biofoulingOrigin === 'regional') {
            operatingProfileCompliance = "The vessel's operational history is confined to regional waters, supporting alignment with WA state practices regarding biosecurity risk and AFC cleanliness assessments.";
        } else if (formData.biofoulingOrigin === 'domestic') {
            operatingProfileCompliance = "While the vessel's operational history is largely confined to domestic waters, visits to other states require elevated biosecurity controls as outlined in this WMS.";
        } else {
            operatingProfileCompliance = "The vessel has operated in international waters, requiring full biosecurity assessment and elevated controls as outlined in this WMS.";
        }

        return {
            ...formData,
            ...determination,
            scopeAreasText,
            cleaningTypeText,
            afcTypeText,
            cleaningScenario: determination.scenario,
            foulingTypeText: ScenarioLogic.getFoulingTypeText(parseInt(formData.foulingRating) || 0),
            sapDocument: ScenarioLogic.getSapDocument(formData.vesselLOA),
            checklistItems: checklist,
            operatingProfileCompliance,
            afsCertValid: !!formData.afcProductName,
            afcWithinServiceLife: formData.afcCondition === 'sound',
            currentYear: new Date().getFullYear(),
            
            // Format dates for display
            proposedStartDate: this.formatDateDisplay(formData.proposedStartDate),
            afcApplicationDate: this.formatDateDisplay(formData.afcApplicationDate),
            revisionDate: this.formatDateDisplay(formData.revisionDate)
        };
    },

    /**
     * Format date for display
     */
    formatDateDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-AU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /**
     * Generate WMS document
     */
    generateWMS() {
        const formData = this.getFormData();
        
        // Validate required fields
        if (!formData.vesselName) {
            alert('Please enter a vessel name.');
            document.getElementById('vesselName').focus();
            return;
        }
        if (!formData.clientName) {
            alert('Please enter a client name.');
            document.getElementById('clientName').focus();
            return;
        }

        const templateData = this.prepareTemplateData(formData);
        const html = Templates.render('wms', templateData);

        const outputContent = document.getElementById('outputContent');
        outputContent.innerHTML = html;

        // Switch to WMS tab
        this.switchTab('wms');
    },

    /**
     * Generate notification email
     */
    generateEmail() {
        const formData = this.getFormData();
        
        // Validate required fields
        if (!formData.vesselName) {
            alert('Please enter a vessel name.');
            return;
        }

        const templateData = this.prepareTemplateData(formData);
        const html = Templates.render('email', templateData);

        const emailContent = document.getElementById('emailContent');
        emailContent.innerHTML = html;

        // Show modal
        document.getElementById('emailModal').classList.add('active');
    },

    /**
     * Copy email content to clipboard
     */
    async copyEmail() {
        const emailContent = document.getElementById('emailContent');
        
        try {
            // Get text content (strip HTML)
            const text = emailContent.innerText;
            await navigator.clipboard.writeText(text);
            alert('Email copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(emailContent);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('copy');
            selection.removeAllRanges();
            alert('Email copied to clipboard!');
        }
    },

    /**
     * Switch output tab
     */
    switchTab(tab) {
        this.activeTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update copy button visibility
        document.getElementById('btnCopyEmail').style.display = tab === 'email' ? 'inline-flex' : 'none';

        // If switching to email tab and content exists
        if (tab === 'email') {
            const formData = this.getFormData();
            if (formData.vesselName) {
                const templateData = this.prepareTemplateData(formData);
                const html = Templates.render('email', templateData);
                document.getElementById('outputContent').innerHTML = html;
            }
        }
    },

    /**
     * Start a new job
     */
    newJob() {
        if (confirm('Start a new job? Any unsaved changes will be lost.')) {
            document.getElementById('jobForm').reset();
            this.generateNewJob();
            this.setDefaultDates();
            this.updateCalculations();
            document.getElementById('outputContent').innerHTML = `
                <div class="placeholder-message">
                    <p>Complete the form and click "Generate WMS" to preview the document.</p>
                </div>
            `;
        }
    },

    /**
     * Save current job
     */
    saveJob() {
        const formData = this.getFormData();
        
        if (!formData.vesselName) {
            alert('Please enter at least a vessel name before saving.');
            return;
        }

        const job = {
            ...formData,
            id: this.currentJob?.id || null
        };

        const saved = StorageService.saveJob(job);
        this.currentJob = saved;

        alert(`Job ${formData.jobNumber} saved successfully!`);
    },

    /**
     * Show saved jobs modal
     */
    showSavedJobs() {
        const jobs = StorageService.getJobs();
        const listContainer = document.getElementById('savedJobsList');

        if (jobs.length === 0) {
            listContainer.innerHTML = '<p>No saved jobs found.</p>';
        } else {
            listContainer.innerHTML = jobs.map(job => `
                <div class="saved-job-item" data-id="${job.id}">
                    <div class="saved-job-info">
                        <h4>${job.jobNumber} - ${job.vesselName || 'Unnamed'}</h4>
                        <p>${job.clientName || 'No client'} | ${this.formatDateDisplay(job.proposedStartDate) || 'No date'}</p>
                    </div>
                    <div class="saved-job-actions">
                        <button class="btn btn-primary btn-load" data-id="${job.id}">Load</button>
                        <button class="btn btn-delete" data-id="${job.id}">Delete</button>
                    </div>
                </div>
            `).join('');

            // Bind load/delete buttons
            listContainer.querySelectorAll('.btn-load').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.loadJob(btn.dataset.id);
                });
            });

            listContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteJob(btn.dataset.id);
                });
            });
        }

        document.getElementById('savedJobsModal').classList.add('active');
    },

    /**
     * Load a saved job
     */
    loadJob(id) {
        const job = StorageService.getJob(id);
        if (!job) {
            alert('Job not found.');
            return;
        }

        // Populate form fields
        Object.keys(job).forEach(key => {
            const el = document.getElementById(key);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = job[key];
                } else {
                    el.value = job[key];
                }
            }
        });

        this.currentJob = job;
        this.updateCalculations();
        this.closeModal('savedJobsModal');
    },

    /**
     * Delete a saved job
     */
    deleteJob(id) {
        if (confirm('Are you sure you want to delete this job?')) {
            StorageService.deleteJob(id);
            this.showSavedJobs(); // Refresh list
        }
    },

    /**
     * Close a modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
});

