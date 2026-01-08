/**
 * Crew Database Module
 * Manages saved crew members for quick selection
 * 
 * Usage:
 *   CrewDatabase.init();
 *   CrewDatabase.saveMember({ name: 'John', position: 'Diver', adasCert: '12345' });
 *   CrewDatabase.getMembers();
 */

const CrewDatabase = {
    storageKey: 'iwc_crew_database',
    
    // ============================================
    // Initialization
    // ============================================
    
    init() {
        this.createCrewModal();
        this.addCrewButtons();
        console.log('👥 CrewDatabase initialized');
    },
    
    // ============================================
    // Storage Operations
    // ============================================
    
    getMembers() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    },
    
    saveMember(member) {
        const members = this.getMembers();
        
        // Check for existing by name
        const existingIndex = members.findIndex(m => 
            m.name.toLowerCase() === member.name.toLowerCase()
        );
        
        if (existingIndex >= 0) {
            // Update existing
            members[existingIndex] = { ...members[existingIndex], ...member, updatedAt: Date.now() };
        } else {
            // Add new
            members.push({ ...member, id: Date.now(), createdAt: Date.now() });
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(members));
        return members;
    },
    
    deleteMember(id) {
        const members = this.getMembers().filter(m => m.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(members));
        return members;
    },
    
    // ============================================
    // UI Components
    // ============================================
    
    createCrewModal() {
        const modal = document.createElement('div');
        modal.id = 'crewModal';
        modal.className = 'modal crew-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="CrewDatabase.closeModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>👥 Crew Database</h2>
                    <button class="modal-close" onclick="CrewDatabase.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="crew-tabs">
                        <button class="crew-tab active" data-tab="select" onclick="CrewDatabase.switchTab('select')">
                            Select Crew
                        </button>
                        <button class="crew-tab" data-tab="manage" onclick="CrewDatabase.switchTab('manage')">
                            Manage Saved
                        </button>
                    </div>
                    
                    <div id="crewSelectTab" class="crew-tab-content active">
                        <p class="crew-help">Click a crew member to fill the selected field, or double-click to fill and close.</p>
                        <div id="crewList" class="crew-list"></div>
                        <div id="crewEmpty" class="crew-empty" style="display:none;">
                            <p>No saved crew members yet.</p>
                            <p>Fill in crew details in the form and click "Save to Database" to add them.</p>
                        </div>
                    </div>
                    
                    <div id="crewManageTab" class="crew-tab-content">
                        <div class="crew-add-form">
                            <h4>Add New Crew Member</h4>
                            <div class="crew-form-grid">
                                <input type="text" id="newCrewName" placeholder="Full Name" />
                                <select id="newCrewPosition">
                                    <option value="Dive Supervisor">Dive Supervisor</option>
                                    <option value="Diver">Diver</option>
                                    <option value="Dive Tender">Dive Tender</option>
                                    <option value="ROV Operator">ROV Operator</option>
                                </select>
                                <input type="text" id="newCrewADAS" placeholder="ADAS Cert #" />
                                <button class="btn btn-primary" onclick="CrewDatabase.addFromForm()">Add</button>
                            </div>
                        </div>
                        <div id="crewManageList" class="crew-list crew-manage-list"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="CrewDatabase.saveCurrentCrew()">
                        💾 Save Current Crew to Database
                    </button>
                    <button class="btn btn-secondary" onclick="CrewDatabase.closeModal()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    addCrewButtons() {
        // Add "Select from Database" buttons to crew fields
        const crewFields = [
            { name: 'diveSupervisor', adas: 'diveSupervisorADAS' },
            { name: 'diver1', adas: 'diver1ADAS' },
            { name: 'diver2', adas: 'diver2ADAS' },
            { name: 'diveTender', adas: 'diveTenderADAS' }
        ];
        
        crewFields.forEach(field => {
            const input = document.getElementById(field.name);
            if (!input) return;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'crew-input-wrapper';
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'crew-select-btn';
            btn.title = 'Select from crew database';
            btn.textContent = '👥';
            btn.onclick = () => this.openModal(field.name, field.adas);
            wrapper.appendChild(btn);
        });
    },
    
    // ============================================
    // Modal Operations
    // ============================================
    
    targetField: null,
    targetAdasField: null,
    
    openModal(fieldName, adasFieldName) {
        this.targetField = fieldName;
        this.targetAdasField = adasFieldName;
        this.renderCrewList();
        this.renderManageList();
        document.getElementById('crewModal').classList.add('active');
    },
    
    closeModal() {
        document.getElementById('crewModal').classList.remove('active');
        this.targetField = null;
        this.targetAdasField = null;
    },
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.crew-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.crew-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`crew${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`)
            .classList.add('active');
    },
    
    renderCrewList() {
        const members = this.getMembers();
        const listEl = document.getElementById('crewList');
        const emptyEl = document.getElementById('crewEmpty');
        
        if (members.length === 0) {
            listEl.style.display = 'none';
            emptyEl.style.display = 'block';
            return;
        }
        
        listEl.style.display = 'grid';
        emptyEl.style.display = 'none';
        
        listEl.innerHTML = members.map(m => `
            <div class="crew-card" 
                 onclick="CrewDatabase.selectMember(${m.id})"
                 ondblclick="CrewDatabase.selectMember(${m.id}, true)">
                <div class="crew-card-name">${this.escapeHtml(m.name)}</div>
                <div class="crew-card-position">${this.escapeHtml(m.position || 'Diver')}</div>
                <div class="crew-card-adas">${m.adasCert ? `ADAS: ${this.escapeHtml(m.adasCert)}` : ''}</div>
            </div>
        `).join('');
    },
    
    renderManageList() {
        const members = this.getMembers();
        const listEl = document.getElementById('crewManageList');
        
        if (members.length === 0) {
            listEl.innerHTML = '<p class="crew-empty">No saved crew members.</p>';
            return;
        }
        
        listEl.innerHTML = members.map(m => `
            <div class="crew-card crew-card-manage">
                <div class="crew-card-info">
                    <div class="crew-card-name">${this.escapeHtml(m.name)}</div>
                    <div class="crew-card-position">${this.escapeHtml(m.position || 'Diver')}</div>
                    <div class="crew-card-adas">${m.adasCert ? `ADAS: ${this.escapeHtml(m.adasCert)}` : 'No ADAS cert'}</div>
                </div>
                <button class="btn btn-delete btn-small" onclick="CrewDatabase.confirmDelete(${m.id}, '${this.escapeHtml(m.name)}')">
                    🗑️
                </button>
            </div>
        `).join('');
    },
    
    // ============================================
    // Actions
    // ============================================
    
    selectMember(id, closeAfter = false) {
        const member = this.getMembers().find(m => m.id === id);
        if (!member) return;
        
        // Fill the target field
        if (this.targetField) {
            const field = document.getElementById(this.targetField);
            if (field) field.value = member.name;
        }
        
        if (this.targetAdasField && member.adasCert) {
            const adasField = document.getElementById(this.targetAdasField);
            if (adasField) adasField.value = member.adasCert;
        }
        
        // Trigger change events
        const event = new Event('change', { bubbles: true });
        document.getElementById(this.targetField)?.dispatchEvent(event);
        
        if (closeAfter) {
            this.closeModal();
        }
    },
    
    addFromForm() {
        const name = document.getElementById('newCrewName').value.trim();
        const position = document.getElementById('newCrewPosition').value;
        const adasCert = document.getElementById('newCrewADAS').value.trim();
        
        if (!name) {
            alert('Please enter a name');
            return;
        }
        
        this.saveMember({ name, position, adasCert });
        
        // Clear form
        document.getElementById('newCrewName').value = '';
        document.getElementById('newCrewADAS').value = '';
        
        // Refresh lists
        this.renderCrewList();
        this.renderManageList();
        
        // Show confirmation
        FormEnhancements?.showNotification?.(`${name} added to crew database`, 'success');
    },
    
    saveCurrentCrew() {
        const crewFields = [
            { name: 'diveSupervisor', adas: 'diveSupervisorADAS', position: 'Dive Supervisor' },
            { name: 'diver1', adas: 'diver1ADAS', position: 'Diver' },
            { name: 'diver2', adas: 'diver2ADAS', position: 'Diver' },
            { name: 'diveTender', adas: 'diveTenderADAS', position: 'Dive Tender' }
        ];
        
        let savedCount = 0;
        
        crewFields.forEach(field => {
            const name = document.getElementById(field.name)?.value?.trim();
            if (!name) return;
            
            const adasCert = document.getElementById(field.adas)?.value?.trim() || '';
            this.saveMember({ name, position: field.position, adasCert });
            savedCount++;
        });
        
        if (savedCount > 0) {
            this.renderCrewList();
            this.renderManageList();
            FormEnhancements?.showNotification?.(`${savedCount} crew member(s) saved to database`, 'success');
        } else {
            alert('No crew members to save. Please fill in at least one crew member in the form.');
        }
    },
    
    confirmDelete(id, name) {
        if (confirm(`Delete "${name}" from crew database?`)) {
            this.deleteMember(id);
            this.renderCrewList();
            this.renderManageList();
        }
    },
    
    // ============================================
    // Utilities
    // ============================================
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.CrewDatabase = CrewDatabase;
}

