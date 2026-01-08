/**
 * Scenario Logic Module
 * Determines cleaning requirements based on AFC type, FR rating, and scope
 * References: Exposure Draft 2024, OEMP sections 6.1.2, 7.1.1
 */

const ScenarioLogic = {
    /**
     * Determine the cleaning scenario and requirements
     * @param {Object} data - Form data
     * @returns {Object} - Scenario determination
     */
    determine(data) {
        const fr = parseInt(data.foulingRating) || 0;
        const afcType = data.afcType;
        const biofoulingOrigin = data.biofoulingOrigin;
        const afcCondition = data.afcCondition;
        const noProhibitedBiocides = data.noProhibitedBiocides;
        const scopeHull = data.scopeHull;
        const scopeNicheAreas = data.scopeNicheAreas;
        const scopePropeller = data.scopePropeller;
        const foulingCover = data.foulingCover;

        // Determine risk level (OEMP 6.1.2)
        let riskLevel = 'low';
        let warnings = [];

        // High risk triggers
        if (fr >= 90) {
            riskLevel = 'high';
            warnings.push('FR ≥90: Heavy fouling classified as high risk (OEMP 6.1.2)');
        }
        if (biofoulingOrigin === 'international' || biofoulingOrigin === 'unknown') {
            riskLevel = 'high';
            warnings.push('Non-regional biofouling: Classified as high risk (OEMP 6.1.2)');
        }
        if (afcCondition === 'damaged' || afcCondition === 'unknown') {
            riskLevel = 'high';
            warnings.push('AFC damaged/unknown: Classified as high risk (OEMP 6.1.2)');
        }
        if (afcType === 'unknown') {
            riskLevel = 'high';
            warnings.push('AFC type unknown: Classified as high risk (OEMP 6.4.2)');
        }
        if (!noProhibitedBiocides) {
            riskLevel = 'high';
            warnings.push('Prohibited biocides not confirmed absent: Cannot proceed');
        }

        // Moderate risk
        if (riskLevel !== 'high') {
            if (fr >= 30 && fr <= 80) {
                riskLevel = 'moderate';
            }
            if (foulingCover === '16-40' || foulingCover === '41-100') {
                riskLevel = 'moderate';
            }
        }

        // Determine scenario and requirements
        let scenario = '';
        let captureRequired = false;
        let sapRequired = false;
        let cleaningPathway = '';

        if (riskLevel === 'high') {
            scenario = 'High Risk - Case by Case';
            captureRequired = true;
            sapRequired = true;
            cleaningPathway = 'High Risk (DPIRD-led assessment)';
        } else if (scopePropeller && !scopeHull && !scopeNicheAreas) {
            // Propeller only (Exposure Draft 2.3.3)
            if (fr <= 80 && (foulingCover === '0' || foulingCover === '1-5')) {
                scenario = 'Propeller Polish (FR≤80, ≤5% cover)';
                captureRequired = false;
                sapRequired = false;
                cleaningPathway = 'Propeller Polishing';
            } else {
                scenario = 'Propeller Cleaning (elevated fouling)';
                captureRequired = true;
                sapRequired = true;
                cleaningPathway = 'Full Capture Cleaning';
            }
        } else if (scopeNicheAreas) {
            // Niche areas always require capture (Exposure Draft 2.3.4)
            scenario = 'Niche Area Cleaning';
            captureRequired = true;
            sapRequired = true;
            cleaningPathway = 'Niche Area Cleaning';
        } else if (scopeHull) {
            // Hull cleaning scenarios
            if (fr <= 20 && afcType === 'non-biocidal' && afcCondition === 'sound') {
                // Hull grooming without capture (Exposure Draft 2.3.2)
                scenario = 'Hull Grooming (FR≤20, non-biocidal AFC)';
                captureRequired = false;
                sapRequired = false;
                cleaningPathway = 'Hull Grooming';
            } else if (fr <= 20 && afcType === 'biocidal') {
                // Biocidal AFC requires capture even for grooming
                scenario = 'Hull Grooming with Capture (biocidal AFC)';
                captureRequired = true;
                sapRequired = true;
                cleaningPathway = 'Hull Cleaning with Capture';
            } else if (fr >= 30 && fr <= 80) {
                // Hull cleaning with capture (Exposure Draft 2.3.1)
                scenario = 'Hull Cleaning (FR 30-80)';
                captureRequired = true;
                sapRequired = true;
                cleaningPathway = 'Hull Cleaning with Capture';
            } else if (fr > 80) {
                scenario = 'Hull Cleaning (Heavy Fouling)';
                captureRequired = true;
                sapRequired = true;
                cleaningPathway = 'Hull Cleaning with Capture';
            }
        }

        // Regional biofouling pathway check (Exposure Draft 2.3.5)
        if ((biofoulingOrigin === 'regional' || biofoulingOrigin === 'domestic') && riskLevel !== 'high') {
            if (!captureRequired) {
                cleaningPathway = 'Regional Biofouling';
            }
        }

        return {
            scenario,
            captureRequired,
            sapRequired,
            riskLevel,
            cleaningPathway,
            warnings,
            highRisk: riskLevel === 'high'
        };
    },

    /**
     * Get checklist items based on cleaning pathway
     * @param {Object} data - Form data
     * @param {Object} determination - Scenario determination
     * @returns {Array} - Checklist items
     */
    getChecklist(data, determination) {
        const baseChecklist = [
            {
                timing: 'Prior to in-water clean',
                criteria: 'Vessel has valid anti-fouling system (AFS) certificate',
                status: data.afcProductName ? 'Confirmed' : 'To be confirmed',
                statusClass: data.afcProductName ? 'confirmed' : 'pending'
            },
            {
                timing: 'Prior to in-water clean',
                criteria: 'Vessel AFC does not contain diuron, cybutryne, ziram, tributyltin or chlorathonil',
                status: data.noProhibitedBiocides ? 'Confirmed' : 'Not confirmed',
                statusClass: data.noProhibitedBiocides ? 'confirmed' : 'incomplete'
            },
            {
                timing: 'Prior to in-water clean',
                criteria: 'Vessel AFC is within service life',
                status: data.afcCondition === 'sound' ? 'Confirmed' : 'To be verified',
                statusClass: data.afcCondition === 'sound' ? 'confirmed' : 'pending'
            },
            {
                timing: 'Prior to in-water clean',
                criteria: 'A pre-clean inspection report to satisfy the documentation requirements',
                status: 'To be completed',
                statusClass: 'pending'
            },
            {
                timing: 'Prior to in-water clean',
                criteria: 'Evidence that identified cleaning method is appropriate',
                status: 'Confirmed',
                statusClass: 'confirmed'
            },
            {
                timing: 'Prior to in-water clean',
                criteria: 'In-water cleaning operator holds all approvals',
                status: 'In process',
                statusClass: 'pending'
            }
        ];

        // Add pathway-specific items
        if (determination.captureRequired) {
            baseChecklist.push({
                timing: 'During clean',
                criteria: 'Capture standard is met',
                status: 'To be verified',
                statusClass: 'pending'
            });
            baseChecklist.push({
                timing: 'During clean',
                criteria: 'Biosecurity standard is met',
                status: 'To be verified',
                statusClass: 'pending'
            });
        }

        if (determination.sapRequired) {
            baseChecklist.push({
                timing: 'During clean',
                criteria: 'Chemical contamination standard is met',
                status: 'To be verified',
                statusClass: 'pending'
            });
        }

        baseChecklist.push({
            timing: 'After clean',
            criteria: 'Post clean inspection report is completed',
            status: 'To be completed',
            statusClass: 'pending'
        });

        baseChecklist.push({
            timing: 'After clean',
            criteria: 'In-water cleaning operator retains documents',
            status: 'To be completed',
            statusClass: 'pending'
        });

        return baseChecklist;
    },

    /**
     * Get fouling type text based on FR rating
     * @param {number} fr - Fouling rating
     * @returns {string} - Fouling type description
     */
    getFoulingTypeText(fr) {
        if (fr <= 20) return 'microfouling';
        if (fr <= 30) return 'moderate soft macrofouling';
        if (fr <= 80) return 'moderate hard macrofouling';
        return 'heavy hard macrofouling';
    },

    /**
     * Get SAP document reference based on vessel size
     * @param {number} loa - Length overall
     * @returns {string} - SAP document reference
     */
    getSapDocument(loa) {
        if (loa && loa < 35) {
            return 'QAP00129FUS-002 – In-Water Hull Cleaning Sampling and Analysis Plan (SAP) – Vessels under 35m';
        }
        return 'QAP00129aFUS-001 – In-Water Hull Cleaning Sampling and Analysis Plan (SAP)';
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ScenarioLogic = ScenarioLogic;
}

