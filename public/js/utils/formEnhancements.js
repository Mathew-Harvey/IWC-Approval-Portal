/**
 * Form Enhancements Module
 * Provides autosave, progress tracking, validation, and duplicate detection
 * 
 * Usage:
 *   FormEnhancements.init({ formId: 'jobForm', storageKey: 'iwc_autosave' });
 */

const FormEnhancements = {
    config: {
        formId: 'jobForm',
        storageKey: 'iwc_autosave',
        autosaveInterval: 30000,  // 30 seconds
        debounceDelay: 1000,      // 1 second after typing stops
    },
    
    form: null,
    autosaveTimer: null,
    debounceTimer: null,
    lastSaveTime: null,
    
    // ============================================
    // Initialization
    // ============================================
    
    init(options = {}) {
        Object.assign(this.config, options);
        this.form = document.getElementById(this.config.formId);
        
        if (!this.form) {
            console.warn('FormEnhancements: Form not found');
            return;
        }
        
        this.initAutosave();
        this.initProgressTracker();
        this.initValidation();
        this.initDuplicateDetection();
        this.restoreAutosave();
        
        console.log('✨ FormEnhancements initialized');
    },
    
    // ============================================
    // Autosave System
    // ============================================
    
    initAutosave() {
        // Create autosave indicator
        this.createAutosaveIndicator();
        
        // Save on any form change (debounced)
        this.form.addEventListener('input', () => this.debouncedSave());
        this.form.addEventListener('change', () => this.debouncedSave());
        
        // Periodic autosave as backup
        this.autosaveTimer = setInterval(() => {
            this.saveToStorage();
        }, this.config.autosaveInterval);
        
        // Save before page unload
        window.addEventListener('beforeunload', () => this.saveToStorage());
    },
    
    createAutosaveIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'autosaveIndicator';
        indicator.className = 'autosave-indicator';
        indicator.innerHTML = `
            <span class="autosave-icon">💾</span>
            <span class="autosave-text">Saved</span>
        `;
        document.body.appendChild(indicator);
    },
    
    debouncedSave() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.saveToStorage();
        }, this.config.debounceDelay);
    },
    
    saveToStorage() {
        const formData = this.getFormData();
        
        // Don't save if form is essentially empty
        if (!formData.vesselName && !formData.clientName) return;
        
        const saveData = {
            data: formData,
            timestamp: Date.now(),
            jobNumber: formData.jobNumber
        };
        
        localStorage.setItem(this.config.storageKey, JSON.stringify(saveData));
        this.lastSaveTime = Date.now();
        this.showAutosaveNotification();
    },
    
    restoreAutosave() {
        const saved = localStorage.getItem(this.config.storageKey);
        if (!saved) return;
        
        try {
            const { data, timestamp, jobNumber } = JSON.parse(saved);
            const age = Date.now() - timestamp;
            const ageMinutes = Math.floor(age / 60000);
            
            // If data is older than 24 hours, don't restore
            if (age > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(this.config.storageKey);
                return;
            }
            
            // Ask user if they want to restore
            const timeAgo = ageMinutes < 60 
                ? `${ageMinutes} minute${ageMinutes !== 1 ? 's' : ''} ago`
                : `${Math.floor(ageMinutes / 60)} hour${Math.floor(ageMinutes / 60) !== 1 ? 's' : ''} ago`;
            
            if (confirm(`Found autosaved data from ${timeAgo} for "${data.vesselName || 'Untitled'}". Restore it?`)) {
                this.populateForm(data);
                this.showNotification('Draft restored', 'success');
            }
        } catch (e) {
            console.error('Failed to restore autosave:', e);
        }
    },
    
    clearAutosave() {
        localStorage.removeItem(this.config.storageKey);
    },
    
    showAutosaveNotification() {
        const indicator = document.getElementById('autosaveIndicator');
        if (!indicator) return;
        
        indicator.classList.add('visible');
        setTimeout(() => indicator.classList.remove('visible'), 2000);
    },
    
    // ============================================
    // Progress Tracker
    // ============================================
    
    initProgressTracker() {
        this.createProgressBar();
        this.updateProgress();
        
        // Update on any change
        this.form.addEventListener('input', () => this.updateProgress());
        this.form.addEventListener('change', () => this.updateProgress());
    },
    
    createProgressBar() {
        const container = document.createElement('div');
        container.id = 'progressContainer';
        container.className = 'progress-container';
        container.innerHTML = `
            <div class="progress-label">
                <span>Form Progress</span>
                <span id="progressPercent">0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-sections" id="progressSections"></div>
        `;
        
        // Insert before form
        this.form.parentNode.insertBefore(container, this.form);
    },
    
    // Define required and optional fields with weights
    getFieldGroups() {
        return [
            {
                name: 'Job Details',
                fields: ['jobNumber', 'clientName', 'proposedStartDate'],
                weight: 15
            },
            {
                name: 'Vessel',
                fields: ['vesselName', 'imoNumber', 'vesselType'],
                weight: 15
            },
            {
                name: 'AFC',
                fields: ['afcType', 'afcCondition'],
                weight: 10
            },
            {
                name: 'Scope',
                fields: ['cleaningLocation', 'foulingRating'],
                weight: 15
            },
            {
                name: 'Crew',
                fields: ['diveSupervisor'],
                weight: 15
            },
            {
                name: 'Dive Params',
                fields: ['maxDepth', 'bottomTime'],
                weight: 10
            },
            {
                name: 'Equipment',
                fields: ['equipDivePanel', 'equipComms'],
                weight: 10
            },
            {
                name: 'Contacts',
                fields: ['clientContact'],
                weight: 10
            }
        ];
    },
    
    updateProgress() {
        const groups = this.getFieldGroups();
        let totalWeight = 0;
        let completedWeight = 0;
        const sectionStatus = [];
        
        groups.forEach(group => {
            totalWeight += group.weight;
            const filledCount = group.fields.filter(id => this.isFieldFilled(id)).length;
            const groupProgress = filledCount / group.fields.length;
            completedWeight += group.weight * groupProgress;
            
            sectionStatus.push({
                name: group.name,
                complete: groupProgress === 1,
                partial: groupProgress > 0 && groupProgress < 1
            });
        });
        
        const percent = Math.round((completedWeight / totalWeight) * 100);
        
        // Update progress bar
        const fill = document.getElementById('progressFill');
        const percentText = document.getElementById('progressPercent');
        
        if (fill) fill.style.width = `${percent}%`;
        if (percentText) percentText.textContent = `${percent}%`;
        
        // Update section indicators
        const sectionsEl = document.getElementById('progressSections');
        if (sectionsEl) {
            sectionsEl.innerHTML = sectionStatus.map(s => `
                <span class="progress-section ${s.complete ? 'complete' : s.partial ? 'partial' : ''}" 
                      title="${s.name}">
                    ${s.complete ? '✓' : s.partial ? '◐' : '○'}
                </span>
            `).join('');
        }
    },
    
    isFieldFilled(fieldId) {
        const el = document.getElementById(fieldId);
        if (!el) return false;
        
        if (el.type === 'checkbox') return el.checked;
        if (el.tagName === 'SELECT') return el.value && el.value !== '';
        return el.value && el.value.trim() !== '';
    },
    
    // ============================================
    // Real-time Validation
    // ============================================
    
    initValidation() {
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            // Add required indicator
            const label = this.form.querySelector(`label[for="${field.id}"]`);
            if (label && !label.querySelector('.required-star')) {
                const star = document.createElement('span');
                star.className = 'required-star';
                star.textContent = ' *';
                label.appendChild(star);
            }
            
            // Validate on blur
            field.addEventListener('blur', () => this.validateField(field));
            
            // Clear error on input
            field.addEventListener('input', () => {
                if (field.classList.contains('field-error')) {
                    this.validateField(field);
                }
            });
        });
    },
    
    validateField(field) {
        const isValid = field.value && field.value.trim() !== '';
        
        field.classList.toggle('field-error', !isValid);
        field.classList.toggle('field-valid', isValid);
        
        // Update or create error message
        let errorMsg = field.parentNode.querySelector('.field-error-message');
        
        if (!isValid) {
            if (!errorMsg) {
                errorMsg = document.createElement('span');
                errorMsg.className = 'field-error-message';
                field.parentNode.appendChild(errorMsg);
            }
            const label = this.form.querySelector(`label[for="${field.id}"]`);
            const fieldName = label ? label.textContent.replace(' *', '') : 'This field';
            errorMsg.textContent = `${fieldName} is required`;
        } else if (errorMsg) {
            errorMsg.remove();
        }
        
        return isValid;
    },
    
    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let allValid = true;
        let firstInvalid = null;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                allValid = false;
                if (!firstInvalid) firstInvalid = field;
            }
        });
        
        if (firstInvalid) {
            firstInvalid.focus();
            // Expand parent section if collapsed
            const section = firstInvalid.closest('.form-section');
            if (section && section.classList.contains('collapsed')) {
                section.classList.remove('collapsed');
            }
        }
        
        return allValid;
    },
    
    // ============================================
    // Duplicate Detection
    // ============================================
    
    initDuplicateDetection() {
        const vesselField = document.getElementById('vesselName');
        const jobField = document.getElementById('jobNumber');
        
        if (vesselField) {
            vesselField.addEventListener('blur', () => this.checkDuplicateVessel());
        }
        
        if (jobField) {
            jobField.addEventListener('blur', () => this.checkDuplicateJob());
        }
    },
    
    checkDuplicateVessel() {
        const vesselName = document.getElementById('vesselName')?.value?.trim();
        if (!vesselName) return;
        
        const savedJobs = JSON.parse(localStorage.getItem('iwc_jobs') || '[]');
        const duplicates = savedJobs.filter(job => 
            job.vesselName?.toLowerCase() === vesselName.toLowerCase()
        );
        
        if (duplicates.length > 0) {
            this.showNotification(
                `Note: ${duplicates.length} previous job(s) found for "${vesselName}"`,
                'info'
            );
        }
    },
    
    checkDuplicateJob() {
        const jobNumber = document.getElementById('jobNumber')?.value?.trim();
        if (!jobNumber) return;
        
        const savedJobs = JSON.parse(localStorage.getItem('iwc_jobs') || '[]');
        const duplicate = savedJobs.find(job => job.jobNumber === jobNumber);
        
        if (duplicate) {
            this.showNotification(
                `Warning: Job number "${jobNumber}" already exists`,
                'warning'
            );
        }
    },
    
    // ============================================
    // Utility Methods
    // ============================================
    
    getFormData() {
        const data = {};
        const inputs = this.form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!input.id) return;
            
            if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else if (input.type === 'file') {
                // Skip file inputs
            } else {
                data[input.id] = input.value;
            }
        });
        
        return data;
    },
    
    populateForm(data) {
        Object.entries(data).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (!el) return;
            
            if (el.type === 'checkbox') {
                el.checked = value;
            } else if (el.type !== 'file') {
                el.value = value;
            }
        });
        
        // Trigger updates
        this.updateProgress();
        if (typeof App !== 'undefined' && App.updateCalculations) {
            App.updateCalculations();
        }
    },
    
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.form-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `form-notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-text">${message}</span>
            <button class="notification-close" onclick="this.parentNode.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    },
    
    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            warning: '⚠️',
            error: '✕',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.FormEnhancements = FormEnhancements;
}

