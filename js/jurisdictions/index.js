/**
 * Jurisdictions Index
 * 
 * This file loads and registers all available jurisdiction configurations.
 * Include this file after config.js and all individual jurisdiction files.
 * 
 * Usage in HTML:
 * <script src="js/jurisdictions/config.js"></script>
 * <script src="js/jurisdictions/au-wa.js"></script>
 * <script src="js/jurisdictions/nz.js"></script>
 * <script src="js/jurisdictions/sg.js"></script>
 * <script src="js/jurisdictions/us-ca.js"></script>
 * <script src="js/jurisdictions/jp.js"></script>
 * <script src="js/jurisdictions/index.js"></script>
 * 
 * Or simply:
 * <script src="js/jurisdictions/bundle.js"></script>  (if bundled)
 */

// Initialize the jurisdiction system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with default jurisdiction (AU-WA as the original)
    if (typeof JurisdictionConfig !== 'undefined') {
        const config = JurisdictionConfig.init('AU-WA');
        console.log(`🌍 Jurisdiction system initialized: ${config.name}`);
        console.log(`📍 Available jurisdictions: ${JurisdictionConfig.getAvailable().map(j => j.id).join(', ')}`);
        
        // Initialize the approval process modal button
        JurisdictionConfig.initApprovalProcessButton();
    }
});

/**
 * Jurisdiction Selector Component
 * Call this function to add a jurisdiction selector to the page
 * 
 * @param {string} containerId - ID of the container element
 */
function createJurisdictionSelector(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} not found`);
        return;
    }

    const jurisdictions = JurisdictionConfig.getAvailable();
    const currentId = JurisdictionConfig.getId();

    const html = `
        <div class="jurisdiction-selector">
            <label for="jurisdictionSelect">
                <span class="label-icon">🌍</span>
                Jurisdiction:
            </label>
            <select id="jurisdictionSelect" class="jurisdiction-select">
                ${jurisdictions.map(j => `
                    <option value="${j.id}" ${j.id === currentId ? 'selected' : ''}>
                        ${j.flag} ${j.name}
                    </option>
                `).join('')}
            </select>
        </div>
    `;

    container.innerHTML = html;

    // Bind change handler
    const select = document.getElementById('jurisdictionSelect');
    select.addEventListener('change', (e) => {
        JurisdictionConfig.set(e.target.value);
        // Optionally reload the page or update the form
        if (confirm('Jurisdiction changed. Would you like to reload the page to apply changes?')) {
            window.location.reload();
        }
    });
}

/**
 * Update form elements based on current jurisdiction
 * Call this after jurisdiction change to update dynamic elements
 */
function updateJurisdictionElements() {
    const config = JurisdictionConfig.get();
    if (!config) return;

    // Update port dropdown
    const portSelect = document.getElementById('cleaningLocation');
    if (portSelect) {
        // Save current selection
        const currentValue = portSelect.value;
        
        // Clear existing options (except 'other')
        const otherOption = portSelect.querySelector('option[value="other"]');
        portSelect.innerHTML = '<option value="">Select Location</option>';
        
        // Add jurisdiction-specific ports
        config.ports.forEach(port => {
            const option = document.createElement('option');
            option.value = port.name;
            option.textContent = port.name;
            portSelect.appendChild(option);
        });
        
        // Re-add 'other' option
        if (otherOption) {
            portSelect.appendChild(otherOption);
        } else {
            const other = document.createElement('option');
            other.value = 'other';
            other.textContent = 'Other (specify below)';
            portSelect.appendChild(other);
        }
        
        // Restore selection if still valid
        if ([...portSelect.options].some(o => o.value === currentValue)) {
            portSelect.value = currentValue;
        }
    }

    // Update emergency contacts display
    const emergencyContactsTable = document.querySelector('.emergency-contacts-table');
    if (emergencyContactsTable) {
        const contacts = config.emergencyContacts;
        // Update table with jurisdiction-specific contacts
        // This would need to be implemented based on your template structure
    }

    // Update abbreviations/glossary
    const abbreviationsTable = document.querySelector('.abbreviations-table');
    if (abbreviationsTable) {
        const abbrevs = config.abbreviations;
        // Update table with jurisdiction-specific abbreviations
    }

    console.log(`✅ Form elements updated for ${config.name}`);
}

// Listen for jurisdiction changes
window.addEventListener('jurisdictionChange', (e) => {
    console.log(`📍 Jurisdiction changed to: ${e.detail.config.name}`);
    updateJurisdictionElements();
});

// Export functions globally
if (typeof window !== 'undefined') {
    window.createJurisdictionSelector = createJurisdictionSelector;
    window.updateJurisdictionElements = updateJurisdictionElements;
}

