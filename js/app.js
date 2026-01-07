/**
 * IWC Notification Package Generator
 * Main Application Module
 */

const App = {
    currentJob: null,
    activeTab: 'wms',
    companyLogo: null,           // Base64 encoded company logo
    vesselImage: null,           // Base64 encoded vessel image
    generalArrangement: null,    // Base64 encoded general arrangement drawing
    generatedDocs: null,         // Store generated documents

    /**
     * Initialize the application
     */
    async init() {
        // Initialize templates
        Templates.init();

        // Initialize jurisdiction system
        this.initJurisdiction();

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
     * Initialize jurisdiction configuration system
     */
    initJurisdiction() {
        if (typeof JurisdictionConfig === 'undefined') {
            console.warn('⚠️ Jurisdiction system not loaded');
            return;
        }

        // Initialize with default (AU-WA)
        const config = JurisdictionConfig.init('AU-WA');
        console.log(`🌍 Jurisdiction: ${config.name}`);

        // Populate jurisdiction selector
        this.populateJurisdictionSelector();

        // Populate port dropdown based on jurisdiction
        this.updatePortDropdown();

        // Update jurisdiction-dependent text
        this.updateJurisdictionText();

        // Listen for jurisdiction changes
        window.addEventListener('jurisdictionChange', (e) => {
            console.log(`📍 Jurisdiction changed to: ${e.detail.config.name}`);
            this.onJurisdictionChange(e.detail.config);
        });
    },

    /**
     * Populate the jurisdiction selector dropdown
     */
    populateJurisdictionSelector() {
        const select = document.getElementById('jurisdictionSelect');
        if (!select || typeof JurisdictionConfig === 'undefined') return;

        const jurisdictions = JurisdictionConfig.getAvailable();
        const currentId = JurisdictionConfig.getId();

        select.innerHTML = jurisdictions.map(j => `
            <option value="${j.id}" ${j.id === currentId ? 'selected' : ''}>
                ${j.flag} ${j.name}
            </option>
        `).join('');

        // Bind change event
        select.addEventListener('change', (e) => {
            JurisdictionConfig.set(e.target.value);
        });
    },

    /**
     * Update port dropdown based on current jurisdiction
     */
    updatePortDropdown() {
        if (typeof JurisdictionConfig === 'undefined') return;
        
        const config = JurisdictionConfig.get();
        const portSelect = document.getElementById('cleaningLocation');
        if (!portSelect || !config) return;

        // Save current selection
        const currentValue = portSelect.value;

        // Rebuild options
        portSelect.innerHTML = '<option value="">Select Location</option>';
        
        config.ports.forEach(port => {
            const option = document.createElement('option');
            option.value = port.name;
            option.textContent = port.name;
            portSelect.appendChild(option);
        });

        // Add "Other" option
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'Other (specify)';
        portSelect.appendChild(otherOption);

        // Restore selection if still valid
        const validValues = [...portSelect.options].map(o => o.value);
        if (validValues.includes(currentValue)) {
            portSelect.value = currentValue;
        }
    },

    /**
     * Update jurisdiction-dependent text elements
     */
    updateJurisdictionText() {
        if (typeof JurisdictionConfig === 'undefined') return;
        
        const config = JurisdictionConfig.get();
        if (!config) return;

        // Update biofouling info text
        const infoText = document.getElementById('biofoulingInfoText');
        if (infoText) {
            const regulator = config.regulatoryBodies?.primary?.name || 'regulatory authority';
            const hours = config.features?.preCleanInspectionHours || 48;
            infoText.textContent = `This is the preliminary assessment. Formal pre-clean inspection by ${regulator}-recognised inspector follows (≥${hours}hrs before clean).`;
        }

        // Update help text
        const helpText = document.getElementById('jurisdictionHelpText');
        if (helpText && config.regulatoryBodies?.primary) {
            helpText.innerHTML = `
                <strong>${config.flag} ${config.shortName}</strong> - 
                Primary regulator: ${config.regulatoryBodies.primary.fullName}
            `;
        }

        // Set data attribute on body for CSS styling
        document.body.setAttribute('data-jurisdiction', config.id);
    },

    /**
     * Handle jurisdiction change
     */
    onJurisdictionChange(config) {
        // Update port dropdown
        this.updatePortDropdown();

        // Update text elements
        this.updateJurisdictionText();

        // Update calculations (in case thresholds differ)
        this.updateCalculations();

        // Clear generated documents (they need to be regenerated)
        this.generatedDocs = null;
        
        // Show notification
        this.showJurisdictionChangeNotification(config);
    },

    /**
     * Show notification when jurisdiction changes
     */
    showJurisdictionChangeNotification(config) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'jurisdiction-change-notification';
        notification.innerHTML = `
            <span class="flag">${config.flag}</span>
            <span>Switched to <strong>${config.shortName}</strong></span>
            <span class="regulator">${config.regulatoryBodies?.primary?.name || ''}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #0a3d62 0%, #062743 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        // Add animation keyframes
        if (!document.getElementById('jurisdiction-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'jurisdiction-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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

        // Image uploads
        this.bindImageUpload('companyLogo', 'companyLogoPreview', 'btnClearCompanyLogo');
        this.bindImageUpload('vesselImage', 'vesselImagePreview', 'btnClearVesselImage');
        this.bindImageUpload('generalArrangement', 'generalArrangementPreview', 'btnClearGeneralArrangement');

        // Action buttons
        document.getElementById('btnNewJob').addEventListener('click', () => this.newJob());
        document.getElementById('btnLoadJob').addEventListener('click', () => this.showSavedJobs());
        document.getElementById('btnSaveJob').addEventListener('click', () => this.saveJob());
        document.getElementById('btnGenerateEmail').addEventListener('click', () => this.generateEmail());
        document.getElementById('btnGenerateWMS').addEventListener('click', () => this.generateWMS());
        document.getElementById('btnPrint').addEventListener('click', () => window.print());
        document.getElementById('btnGenerateAll').addEventListener('click', () => this.generateAllDocuments());

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
    // Image Upload Methods
    // ============================================
    
    /**
     * Bind image upload handlers
     */
    bindImageUpload(inputId, previewId, clearBtnId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const clearBtn = document.getElementById(clearBtnId);
        
        if (!input || !preview) return;
        
        // Click on preview to trigger file input
        preview.addEventListener('click', () => input.click());
        
        // Handle file selection
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImageUpload(file, inputId, previewId, clearBtnId);
            }
        });
        
        // Drag and drop
        preview.addEventListener('dragover', (e) => {
            e.preventDefault();
            preview.style.borderColor = 'var(--primary)';
            preview.style.background = 'var(--gray-100)';
        });
        
        preview.addEventListener('dragleave', (e) => {
            e.preventDefault();
            preview.style.borderColor = '';
            preview.style.background = '';
        });
        
        preview.addEventListener('drop', (e) => {
            e.preventDefault();
            preview.style.borderColor = '';
            preview.style.background = '';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.processImageUpload(file, inputId, previewId, clearBtnId);
            }
        });
        
        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImage(inputId, previewId, clearBtnId);
            });
        }
    },
    
    /**
     * Process image upload
     */
    processImageUpload(file, inputId, previewId, clearBtnId) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        
        // Max size 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert('Image too large. Maximum size is 5MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            
            // Store in app state
            if (inputId === 'companyLogo') {
                this.companyLogo = base64;
            } else if (inputId === 'vesselImage') {
                this.vesselImage = base64;
            } else if (inputId === 'generalArrangement') {
                this.generalArrangement = base64;
            }
            
            // Update preview
            const preview = document.getElementById(previewId);
            preview.innerHTML = `<img src="${base64}" alt="Uploaded image">`;
            preview.classList.add('has-image');
            
            // Show clear button
            const clearBtn = document.getElementById(clearBtnId);
            if (clearBtn) {
                clearBtn.style.display = 'inline-flex';
            }
        };
        reader.readAsDataURL(file);
    },
    
    /**
     * Clear uploaded image
     */
    clearImage(inputId, previewId, clearBtnId) {
        // Clear from state
        if (inputId === 'companyLogo') {
            this.companyLogo = null;
        } else if (inputId === 'vesselImage') {
            this.vesselImage = null;
        } else if (inputId === 'generalArrangement') {
            this.generalArrangement = null;
        }
        
        // Reset input
        const input = document.getElementById(inputId);
        if (input) input.value = '';
        
        // Reset preview
        const preview = document.getElementById(previewId);
        if (preview) {
            let placeholderText;
            if (inputId === 'companyLogo') {
                placeholderText = '📷 Click or drag to upload logo';
            } else if (inputId === 'vesselImage') {
                placeholderText = '📷 Click or drag to upload vessel photo';
            } else if (inputId === 'generalArrangement') {
                placeholderText = '📐 Click or drag to upload GA drawing';
            } else {
                placeholderText = '📷 Click or drag to upload image';
            }
            preview.innerHTML = `<span class="placeholder-text">${placeholderText}</span>`;
            preview.classList.remove('has-image');
        }
        
        // Hide clear button
        const clearBtn = document.getElementById(clearBtnId);
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
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
            customScopeOfWork: document.getElementById('customScopeOfWork').value.trim(),
            cleaningLocation: document.getElementById('cleaningLocation').value === 'other' 
                ? document.getElementById('otherLocation').value 
                : document.getElementById('cleaningLocation').value,
            
            // Additional activities
            activityConfinedSpace: document.getElementById('activityConfinedSpace').checked,
            activityHotWork: document.getElementById('activityHotWork').checked,
            activityWorkingAtHeights: document.getElementById('activityWorkingAtHeights').checked,
            activityCraneOps: document.getElementById('activityCraneOps').checked,
            activityHazmat: document.getElementById('activityHazmat').checked,
            activityNightWork: document.getElementById('activityNightWork').checked,
            activityUnderwaterInspection: document.getElementById('activityUnderwaterInspection').checked,
            activityPropPolishing: document.getElementById('activityPropPolishing').checked,
            
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

        // Build scope areas text - use custom scope if provided
        let scopeAreasText;
        let hasCustomScope = false;
        
        if (formData.customScopeOfWork) {
            scopeAreasText = formData.customScopeOfWork;
            hasCustomScope = true;
        } else {
            const scopeAreas = [];
            if (formData.scopeHull) scopeAreas.push('hull plating and underwater surfaces');
            if (formData.scopeNicheAreas) scopeAreas.push('niche areas');
            if (formData.scopePropeller) scopeAreas.push('propeller');
            scopeAreasText = scopeAreas.join(', ') || 'hull plating and underwater surfaces';
        }

        // Get additional hazards based on selected activities
        const additionalHazards = this.getAdditionalHazards(formData);
        const additionalActivities = this.getAdditionalActivitiesList(formData);

        // Determine cleaning type text
        let cleaningTypeText = 'full in-water hull clean with capture';
        if (!determination.captureRequired) {
            cleaningTypeText = 'in-water hull grooming';
        }

        // AFC type text
        const afcTypeText = formData.afcType === 'biocidal' ? 'Biocidal' : 
                           formData.afcType === 'non-biocidal' ? 'Non-biocidal' : 'Unknown';

        // Get jurisdiction config for template data
        const jurisdiction = typeof JurisdictionConfig !== 'undefined' ? JurisdictionConfig.get() : null;
        
        // Operating profile compliance text - use jurisdiction-specific text if available
        let operatingProfileCompliance = '';
        if (jurisdiction && jurisdiction.complianceText) {
            if (formData.biofoulingOrigin === 'regional') {
                operatingProfileCompliance = jurisdiction.complianceText.regionalBiofouling || 
                    "The vessel's operational history is confined to regional waters.";
            } else if (formData.biofoulingOrigin === 'domestic') {
                operatingProfileCompliance = jurisdiction.complianceText.domesticBiofouling || 
                    "The vessel's operational history is largely confined to domestic waters.";
            } else {
                operatingProfileCompliance = jurisdiction.complianceText.internationalBiofouling || 
                    "The vessel has operated in international waters, requiring full biosecurity assessment.";
            }
        } else {
            // Fallback for when jurisdiction system is not loaded
            if (formData.biofoulingOrigin === 'regional') {
                operatingProfileCompliance = "The vessel's operational history is confined to regional waters, supporting alignment with WA state practices regarding biosecurity risk and AFC cleanliness assessments.";
            } else if (formData.biofoulingOrigin === 'domestic') {
                operatingProfileCompliance = "While the vessel's operational history is largely confined to domestic waters, visits to other states require elevated biosecurity controls as outlined in this WMS.";
            } else {
                operatingProfileCompliance = "The vessel has operated in international waters, requiring full biosecurity assessment and elevated controls as outlined in this WMS.";
            }
        }

        // Get month and year for document headers
        const proposedDate = formData.proposedStartDate ? new Date(formData.proposedStartDate) : new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

        return {
            ...formData,
            ...determination,
            scopeAreasText,
            hasCustomScope,
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
            
            // Images
            companyLogo: this.companyLogo,
            vesselImage: this.vesselImage,
            generalArrangement: this.generalArrangement,
            
            // Date formatting for headers
            proposedMonth: months[proposedDate.getMonth()],
            proposedYear: proposedDate.getFullYear(),
            
            // Format dates for display
            proposedStartDate: this.formatDateDisplay(formData.proposedStartDate),
            afcApplicationDate: this.formatDateDisplay(formData.afcApplicationDate),
            revisionDate: this.formatDateDisplay(formData.revisionDate),
            
            // Additional activities and hazards
            additionalHazards,
            additionalActivities,
            hasAdditionalActivities: additionalActivities.length > 0,

            // Jurisdiction data for templates
            jurisdiction: jurisdiction,
            jurisdictionId: jurisdiction?.id || 'AU-WA',
            jurisdictionName: jurisdiction?.shortName || 'Western Australia',
            jurisdictionFlag: jurisdiction?.flag || '🇦🇺',
            
            // Regulatory bodies (for easy access in templates)
            primaryRegulator: jurisdiction?.regulatoryBodies?.primary?.name || 'DPIRD',
            primaryRegulatorFull: jurisdiction?.regulatoryBodies?.primary?.fullName || 'Department of Primary Industries and Regional Development',
            portAuthority: jurisdiction?.regulatoryBodies?.port?.name || 'FPA',
            portAuthorityFull: jurisdiction?.regulatoryBodies?.port?.fullName || 'Fremantle Port Authority',
            
            // Emergency contacts
            imsHotline: jurisdiction?.emergencyContacts?.imsHotline?.phone || '(08) 9368 3657',
            imsHotlineName: jurisdiction?.emergencyContacts?.imsHotline?.name || 'DPIRD Marine Pest Hotline',
            divingEmergencyPhone: jurisdiction?.emergencyContacts?.divingEmergency?.phone || '1800 088 200',
            divingEmergencyName: jurisdiction?.emergencyContacts?.divingEmergency?.name || 'Diving Emergency Service (DES)',
            portEmergencyPhone: jurisdiction?.emergencyContacts?.portEmergency?.phone || jurisdiction?.regulatoryBodies?.port?.emergencyPhone || '(08) 9430 3555',
            
            // Compliance text snippets
            regulatoryAlignmentText: jurisdiction?.complianceText?.regulatoryAlignment || '',
            highRiskNoteText: jurisdiction?.complianceText?.highRiskNote || '',
            imsProtocolText: jurisdiction?.complianceText?.imsProtocol || '',
            
            // Features
            preCleanInspectionHours: jurisdiction?.features?.preCleanInspectionHours || 48,
            postCleanReportDays: jurisdiction?.features?.postCleanReportDays || 20
        };
    },

    /**
     * Get list of additional activities selected
     */
    getAdditionalActivitiesList(formData) {
        const activities = [];
        if (formData.activityConfinedSpace) activities.push('Confined Space Entry');
        if (formData.activityHotWork) activities.push('Hot Work');
        if (formData.activityWorkingAtHeights) activities.push('Working at Heights');
        if (formData.activityCraneOps) activities.push('Crane/Lifting Operations');
        if (formData.activityHazmat) activities.push('Hazardous Materials Handling');
        if (formData.activityNightWork) activities.push('Night Work Operations');
        if (formData.activityUnderwaterInspection) activities.push('Underwater Inspection/Survey');
        if (formData.activityPropPolishing) activities.push('Propeller Polishing');
        return activities;
    },

    /**
     * Get additional hazards based on selected activities
     */
    getAdditionalHazards(formData) {
        const hazards = [];

        if (formData.activityConfinedSpace) {
            hazards.push({
                step: 'Confined Space Entry',
                hazard: 'Oxygen deficiency / toxic atmosphere',
                riskClass: 'risk-extreme',
                riskRating: 'EXTREME',
                controls: 'Atmospheric testing before entry, continuous monitoring, ventilation, rescue team on standby, confined space entry permit',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
            hazards.push({
                step: 'Confined Space Entry',
                hazard: 'Entrapment / difficult egress',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Entry/exit plan, rescue equipment readily available, communication maintained, trained personnel only',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
        }

        if (formData.activityHotWork) {
            hazards.push({
                step: 'Hot Work',
                hazard: 'Fire / explosion',
                riskClass: 'risk-extreme',
                riskRating: 'EXTREME',
                controls: 'Hot work permit, fire watch, extinguisher on standby, combustibles cleared 11m radius, gas-free certification if near tanks',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
            hazards.push({
                step: 'Hot Work',
                hazard: 'Burns / UV exposure',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Welding PPE (helmet, gloves, apron), screens to protect others, appropriate clothing',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
            hazards.push({
                step: 'Hot Work',
                hazard: 'Fume inhalation',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Adequate ventilation, respiratory protection if required, fume extraction where possible',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
        }

        if (formData.activityWorkingAtHeights) {
            hazards.push({
                step: 'Working at Heights',
                hazard: 'Fall from height',
                riskClass: 'risk-extreme',
                riskRating: 'EXTREME',
                controls: 'Fall arrest systems, guardrails, safety nets where applicable, 100% tie-off when exposed, pre-use harness inspection',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
            hazards.push({
                step: 'Working at Heights',
                hazard: 'Dropped objects',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Tool lanyards, barricade areas below, hard hat zones, housekeeping',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
        }

        if (formData.activityCraneOps) {
            hazards.push({
                step: 'Crane/Lifting Operations',
                hazard: 'Struck by falling load',
                riskClass: 'risk-extreme',
                riskRating: 'EXTREME',
                controls: 'Certified crane operator, dogman/rigger, exclusion zones, lift plan for critical lifts, pre-lift inspection',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
            hazards.push({
                step: 'Crane/Lifting Operations',
                hazard: 'Crushing between load and structure',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Never stand under suspended loads, tag lines for load control, clear communication signals',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
        }

        if (formData.activityHazmat) {
            hazards.push({
                step: 'Hazardous Materials Handling',
                hazard: 'Chemical exposure / burns',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'SDS reviewed, appropriate PPE (gloves, goggles, suit), spill kit available, proper storage, trained personnel',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
            hazards.push({
                step: 'Hazardous Materials Handling',
                hazard: 'Environmental contamination',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Secondary containment, spill response procedures, proper disposal methods, environmental monitoring',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
        }

        if (formData.activityNightWork) {
            hazards.push({
                step: 'Night Work Operations',
                hazard: 'Poor visibility / inadequate lighting',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Adequate task lighting, head torches for divers, reflective vests, well-lit access routes',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
            hazards.push({
                step: 'Night Work Operations',
                hazard: 'Fatigue / reduced alertness',
                riskClass: 'risk-medium',
                riskRating: 'MEDIUM',
                controls: 'Fatigue management plan, adequate rest periods, buddy system, shift rotation, caffeine availability',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
        }

        if (formData.activityUnderwaterInspection) {
            hazards.push({
                step: 'Underwater Inspection',
                hazard: 'Reduced visibility / disorientation',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Adequate underwater lighting, lifeline/umbilical, surface monitoring, abort dive if visibility unsafe',
                residualClass: 'risk-medium',
                residualRating: 'MEDIUM'
            });
            hazards.push({
                step: 'Underwater Inspection',
                hazard: 'Contact with vessel machinery/hazards',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Vessel systems isolated and locked out, clear communication with vessel crew, dive plan briefing',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
        }

        if (formData.activityPropPolishing) {
            hazards.push({
                step: 'Propeller Polishing',
                hazard: 'Rotating tool injury',
                riskClass: 'risk-high',
                riskRating: 'HIGH',
                controls: 'Training in powered tool use, two-hand operation, guards in place, emergency stop accessible',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
            hazards.push({
                step: 'Propeller Polishing',
                hazard: 'Propeller movement during work',
                riskClass: 'risk-extreme',
                riskRating: 'EXTREME',
                controls: 'Propulsion system locked out/tagged out, bridge confirmation, shaft brake engaged if available',
                residualClass: 'risk-low',
                residualRating: 'LOW'
            });
        }

        return hazards;
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
     * Generate Emergency Response Plan
     */
    generateERP() {
        const formData = this.getFormData();
        
        if (!this.validateBasicFields(formData)) return;

        const templateData = this.prepareTemplateData(formData);
        const html = Templates.render('erp', templateData);

        document.getElementById('outputContent').innerHTML = html;
        this.switchTab('erp');
    },

    /**
     * Generate Work Health and Safety Management Plan
     */
    generateWHSMP() {
        const formData = this.getFormData();
        
        if (!this.validateBasicFields(formData)) return;

        const templateData = this.prepareTemplateData(formData);
        const html = Templates.render('whsmp', templateData);

        document.getElementById('outputContent').innerHTML = html;
        this.switchTab('whsmp');
    },

    /**
     * Generate Safe Work Method Statement
     */
    generateSWMS() {
        const formData = this.getFormData();
        
        if (!this.validateBasicFields(formData)) return;

        const templateData = this.prepareTemplateData(formData);
        const html = Templates.render('swms', templateData);

        document.getElementById('outputContent').innerHTML = html;
        this.switchTab('swms');
    },

    /**
     * Generate all documents
     */
    generateAllDocuments() {
        const formData = this.getFormData();
        
        if (!this.validateBasicFields(formData)) return;

        const templateData = this.prepareTemplateData(formData);
        
        // Generate WMS first (shown by default)
        const wmsHtml = Templates.render('wms', templateData);
        document.getElementById('outputContent').innerHTML = wmsHtml;
        this.switchTab('wms');
        
        // Store all generated documents
        this.generatedDocs = {
            wms: wmsHtml,
            erp: Templates.render('erp', templateData),
            whsmp: Templates.render('whsmp', templateData),
            swms: Templates.render('swms', templateData),
            email: Templates.render('email', templateData)
        };
        
        alert('All documents generated! Use the tabs to switch between them.');
    },

    /**
     * Validate basic required fields
     */
    validateBasicFields(formData) {
        if (!formData.vesselName) {
            alert('Please enter a vessel name.');
            document.getElementById('vesselName').focus();
            return false;
        }
        if (!formData.clientName) {
            alert('Please enter a client name.');
            document.getElementById('clientName').focus();
            return false;
        }
        return true;
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

        // Check if we have pre-generated content
        if (this.generatedDocs && this.generatedDocs[tab]) {
            document.getElementById('outputContent').innerHTML = this.generatedDocs[tab];
            return;
        }

        // Generate content on tab switch if form has data
        const formData = this.getFormData();
        if (formData.vesselName && formData.clientName) {
            const templateData = this.prepareTemplateData(formData);
            let html = '';
            
            switch(tab) {
                case 'wms':
                    html = Templates.render('wms', templateData);
                    break;
                case 'erp':
                    html = Templates.render('erp', templateData);
                    break;
                case 'whsmp':
                    html = Templates.render('whsmp', templateData);
                    break;
                case 'swms':
                    html = Templates.render('swms', templateData);
                    break;
                case 'email':
                    html = Templates.render('email', templateData);
                    break;
            }
            
            if (html) {
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
            
            // Clear images
            this.clearImage('companyLogo', 'companyLogoPreview', 'btnClearCompanyLogo');
            this.clearImage('vesselImage', 'vesselImagePreview', 'btnClearVesselImage');
            this.clearImage('generalArrangement', 'generalArrangementPreview', 'btnClearGeneralArrangement');
            
            // Clear generated docs
            this.generatedDocs = null;
            
            document.getElementById('outputContent').innerHTML = `
                <div class="placeholder-message">
                    <p>Complete the form and click "Generate WMS" or "Generate All Docs" to preview documents.</p>
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

