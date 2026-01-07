# IWC Approval Portal - Multi-Jurisdiction Implementation Plan

## Project Overview

**Objective:** Extend the IWC (In-Water Cleaning) Approval Portal to support multiple jurisdictions beyond Western Australia, including:
- 🇦🇺 Australia - Western Australia (current baseline)
- 🇳🇿 New Zealand
- 🇸🇬 Singapore  
- 🇺🇸 United States - California
- 🇯🇵 Japan

**Current State:** The portal is fully functional for WA/Australia with hardcoded references to DPIRD, FPA, and Australian regulations.

**Target State:** A configurable, multi-jurisdiction system where users can select their operating jurisdiction and receive appropriate regulatory guidance, documentation, and approval workflows.

---

## Phase 1: Foundation (Completed ✅)

### 1.1 Research & Documentation
- [x] Research regulatory frameworks for each jurisdiction
- [x] Document key regulatory bodies and contacts
- [x] Identify jurisdiction-specific requirements
- [x] Create research summary document

### 1.2 Configuration Architecture
- [x] Design jurisdiction configuration structure
- [x] Create `JurisdictionConfig` manager class
- [x] Define configuration schema

### 1.3 Jurisdiction Config Files
- [x] Create AU-WA configuration (baseline extraction)
- [x] Create NZ configuration
- [x] Create Singapore configuration
- [x] Create US-CA configuration
- [x] Create Japan configuration
- [x] Create index/loader script

**Deliverables:**
- `/js/jurisdictions/config.js` - Configuration manager
- `/js/jurisdictions/au-wa.js` - Australia WA config
- `/js/jurisdictions/nz.js` - New Zealand config
- `/js/jurisdictions/sg.js` - Singapore config
- `/js/jurisdictions/us-ca.js` - USA California config
- `/js/jurisdictions/jp.js` - Japan config
- `/js/jurisdictions/index.js` - Loader and utilities
- `/docs/MULTI-JURISDICTION-RESEARCH.md` - Research document
- `/docs/IMPLEMENTATION-PLAN.md` - This document

---

## Phase 2: Integration (TODO)

### 2.1 HTML Integration
**Priority: HIGH**

Add jurisdiction selector to the main form:

```html
<!-- Add to index.html, before the form -->
<div id="jurisdiction-selector-container" class="jurisdiction-header">
    <!-- Populated by JavaScript -->
</div>

<!-- Add script includes before app.js -->
<script src="js/jurisdictions/config.js"></script>
<script src="js/jurisdictions/au-wa.js"></script>
<script src="js/jurisdictions/nz.js"></script>
<script src="js/jurisdictions/sg.js"></script>
<script src="js/jurisdictions/us-ca.js"></script>
<script src="js/jurisdictions/jp.js"></script>
<script src="js/jurisdictions/index.js"></script>
```

**Tasks:**
- [ ] Add jurisdiction script includes to `index.html`
- [ ] Add jurisdiction selector container to form header
- [ ] Style the jurisdiction selector component
- [ ] Add CSS for jurisdiction-specific theming (optional)

### 2.2 Port Locations Dynamization
**Priority: HIGH**

Replace hardcoded port dropdown with dynamic options:

```javascript
// In app.js or jurisdiction integration
function updatePortDropdown() {
    const config = JurisdictionConfig.get();
    const portSelect = document.getElementById('cleaningLocation');
    
    // Clear and rebuild options from config.ports
    portSelect.innerHTML = '<option value="">Select Location</option>';
    config.ports.forEach(port => {
        const option = document.createElement('option');
        option.value = port.name;
        option.textContent = port.name;
        portSelect.appendChild(option);
    });
    // Add "Other" option
    portSelect.innerHTML += '<option value="other">Other (specify below)</option>';
}
```

**Tasks:**
- [ ] Remove hardcoded port options from HTML
- [ ] Implement dynamic port dropdown population
- [ ] Listen for jurisdiction change events
- [ ] Update port options on jurisdiction change

### 2.3 Template Parameterization
**Priority: HIGH**

Replace hardcoded text in Handlebars templates with dynamic values:

**Current (hardcoded):**
```handlebars
<p>DPIRD is a key stakeholder in marine pest management.</p>
```

**Target (parameterized):**
```handlebars
<p>{{regulatoryBody.primary.name}} is a key stakeholder in marine pest management.</p>
```

**Templates to update:**
- [ ] WMS template (`#wms-template`)
- [ ] Email template (`#email-template`)
- [ ] ERP template (`#erp-template`)
- [ ] WHSMP template (`#whsmp-template`)
- [ ] SWMS template (`#swms-template`)

**Key replacements:**
| Current | Replacement |
|---------|-------------|
| DPIRD | `{{jurisdiction.regulatoryBodies.primary.name}}` |
| Fremantle Port Authority | `{{jurisdiction.regulatoryBodies.port.fullName}}` |
| (08) 9368 3657 | `{{jurisdiction.emergencyContacts.imsHotline.phone}}` |
| OEMP 6.1.2 | `{{jurisdiction.documentReferences.oemp.riskCategories}}` |

### 2.4 Scenario Logic Integration
**Priority: MEDIUM**

Update `scenarioLogic.js` to use jurisdiction-specific thresholds:

```javascript
// Updated ScenarioLogic.determine()
determine(data) {
    const config = JurisdictionConfig.get();
    const thresholds = config?.scenarioLogic?.thresholds || {
        groomingMax: 20,
        cleaningMin: 30,
        cleaningMax: 80,
        highRiskMin: 90
    };
    
    // Use thresholds.groomingMax instead of hardcoded 20
    if (fr <= thresholds.groomingMax && ...) { ... }
}
```

**Tasks:**
- [ ] Update `ScenarioLogic.determine()` to use config thresholds
- [ ] Update high risk trigger messages to use config text
- [ ] Add jurisdiction-specific warning messages
- [ ] Test scenario logic with each jurisdiction

### 2.5 Emergency Contacts Integration
**Priority: MEDIUM**

Update emergency contact sections in templates:

**Tasks:**
- [ ] Create emergency contacts template partial
- [ ] Dynamically render hospital contacts from config
- [ ] Dynamically render diving emergency contacts
- [ ] Dynamically render IMS/biosecurity hotline
- [ ] Update abbreviations table from config

---

## Phase 3: Template Refactoring (TODO)

### 3.1 Extract Template Partials
**Priority: MEDIUM**

Create reusable template partials for jurisdiction-dependent sections:

```html
<!-- Partial: Emergency Contacts -->
<script id="partial-emergency-contacts" type="text/x-handlebars-partial">
    <table class="emergency-contacts">
        <tr><td>General Emergency</td><td>{{jurisdiction.emergencyContacts.generalEmergency.phone}}</td></tr>
        <tr><td>{{jurisdiction.emergencyContacts.divingEmergency.name}}</td><td>{{jurisdiction.emergencyContacts.divingEmergency.phone}}</td></tr>
        ...
    </table>
</script>
```

**Partials to create:**
- [ ] Emergency contacts table
- [ ] Regulatory body references
- [ ] Approval process steps
- [ ] Abbreviations/glossary

### 3.2 Compliance Text Sections
**Priority: MEDIUM**

Create jurisdiction-switchable compliance text blocks:

**Tasks:**
- [ ] Replace inline regulatory text with config lookups
- [ ] Update "Regulatory Compliance" sections
- [ ] Update "High Risk" warning boxes
- [ ] Update IMS/biosecurity protocol text

### 3.3 Document Header/Footer
**Priority: LOW**

Update document headers to show jurisdiction:

```html
<div class="document-header">
    <span class="jurisdiction-badge">{{jurisdiction.flag}} {{jurisdiction.shortName}}</span>
</div>
```

---

## Phase 4: Testing & Validation (TODO)

### 4.1 Functional Testing
**Priority: HIGH**

Test each jurisdiction end-to-end:

| Test Case | AU-WA | NZ | SG | US-CA | JP |
|-----------|-------|----|----|-------|-----|
| Jurisdiction selector works | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Ports load correctly | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Scenario logic works | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| WMS generates correctly | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Email generates correctly | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| ERP generates correctly | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Emergency contacts correct | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Date format correct | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

### 4.2 Regulatory Review
**Priority: HIGH**

Have jurisdiction-specific documents reviewed:

- [ ] AU-WA: Verify against current DPIRD/FPA requirements
- [ ] NZ: Review against MPI/CRMS requirements
- [ ] SG: Review against MPA/NEA requirements
- [ ] US-CA: Review against CSLC/VIDA requirements
- [ ] JP: Review against MLIT requirements (consider translation)

### 4.3 User Acceptance Testing
**Priority: MEDIUM**

- [ ] Deploy to staging environment
- [ ] Internal testing with different scenarios
- [ ] Gather feedback on jurisdiction switching experience

---

## Phase 5: Polish & Documentation (TODO)

### 5.1 User Interface
**Priority: MEDIUM**

- [ ] Add jurisdiction flag/icon to header
- [ ] Improve jurisdiction selector styling
- [ ] Add jurisdiction-specific color themes (optional)
- [ ] Add "About this jurisdiction" info panel

### 5.2 User Documentation
**Priority: MEDIUM**

- [ ] Update README with multi-jurisdiction info
- [ ] Create user guide for jurisdiction selection
- [ ] Document jurisdiction-specific requirements
- [ ] Add FAQ section for international users

### 5.3 Developer Documentation
**Priority: LOW**

- [ ] Document configuration schema
- [ ] Create guide for adding new jurisdictions
- [ ] Document template parameterization patterns

---

## Implementation Priority Matrix

| Task | Priority | Effort | Impact | Phase |
|------|----------|--------|--------|-------|
| Add script includes | HIGH | Low | Required | 2.1 |
| Add jurisdiction selector | HIGH | Low | Required | 2.1 |
| Dynamic port dropdown | HIGH | Low | High | 2.2 |
| Template parameterization | HIGH | High | High | 2.3 |
| Scenario logic integration | MEDIUM | Medium | High | 2.4 |
| Emergency contacts | MEDIUM | Medium | Medium | 2.5 |
| Template partials | MEDIUM | Medium | Medium | 3.1 |
| Functional testing | HIGH | High | Required | 4.1 |
| Regulatory review | HIGH | Medium | Critical | 4.2 |
| UI polish | MEDIUM | Low | Nice-to-have | 5.1 |

---

## Quick Start Integration

To quickly integrate the jurisdiction system:

### Step 1: Add Scripts to index.html

Find the script section (before `</body>`) and add:

```html
<!-- Jurisdiction Configuration (add before app.js) -->
<script src="js/jurisdictions/config.js"></script>
<script src="js/jurisdictions/au-wa.js"></script>
<script src="js/jurisdictions/nz.js"></script>
<script src="js/jurisdictions/sg.js"></script>
<script src="js/jurisdictions/us-ca.js"></script>
<script src="js/jurisdictions/jp.js"></script>
<script src="js/jurisdictions/index.js"></script>
```

### Step 2: Add Selector Container

Add this near the top of the form:

```html
<div id="jurisdiction-selector-container" class="form-section jurisdiction-selector-section">
    <h2>🌍 Operating Jurisdiction</h2>
    <div id="jurisdiction-selector"></div>
</div>
```

### Step 3: Initialize Selector

In `app.js` `init()` method, add:

```javascript
// After Templates.init()
if (typeof createJurisdictionSelector !== 'undefined') {
    createJurisdictionSelector('jurisdiction-selector');
}
```

### Step 4: Use Config in Templates

Update `prepareTemplateData()` in `app.js`:

```javascript
prepareTemplateData(formData) {
    const jurisdiction = JurisdictionConfig.get();
    // ... existing code ...
    
    return {
        ...formData,
        ...determination,
        jurisdiction,  // Add this line
        // ... rest of return object
    };
}
```

---

## Adding New Jurisdictions

To add a new jurisdiction (e.g., UK, UAE):

1. Create config file: `/js/jurisdictions/xx.js`
2. Follow the schema from existing configs
3. Add script include to `index.html`
4. Test with all document templates
5. Have regulatory requirements verified

**Minimum config requirements:**
- `id`, `name`, `flag`
- `regulatoryBodies` with at least `primary`
- `ports` array
- `emergencyContacts` with essential contacts
- `scenarioLogic.thresholds`
- `complianceText` for major sections

---

## Risk & Considerations

### Regulatory Accuracy
⚠️ **Critical:** Regulatory information must be verified with actual regulatory bodies before commercial use. The research is based on publicly available information and may not reflect current requirements.

### Language Support
⚠️ Japan config includes Japanese text for key terms. Full document translation would require additional work.

### State/Regional Variations
⚠️ US regulations vary significantly by state. The US-CA config is specific to California. Other states would need separate configs.

### Ongoing Maintenance
⚠️ Regulations change. A process for monitoring and updating configs is recommended.

---

## Estimated Effort

| Phase | Estimated Time |
|-------|---------------|
| Phase 1 (Complete) | 4-6 hours |
| Phase 2: Integration | 8-12 hours |
| Phase 3: Templates | 4-6 hours |
| Phase 4: Testing | 4-8 hours |
| Phase 5: Polish | 2-4 hours |
| **Total** | **22-36 hours** |

---

## Next Steps

1. ✅ Complete Phase 1 (Configuration files created)
2. 🔲 Begin Phase 2.1 - Add scripts and selector to HTML
3. 🔲 Test jurisdiction switching functionality
4. 🔲 Begin template parameterization (Phase 2.3)

---

*Document prepared for Franmarine Underwater Services*
*Last updated: January 2026*

