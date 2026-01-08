/**
 * Australia - Western Australia Jurisdiction Configuration
 * 
 * Regulatory Framework:
 * - DPIRD (Department of Primary Industries and Regional Development)
 * - Fremantle Port Authority (FPA)
 * - Australian Anti-fouling and In-water Cleaning Guidelines (Exposure Draft 2024)
 * - FPA Operations Environmental Management Plan (OEMP)
 */

const AU_WA_CONFIG = {
    // Basic Info
    id: 'AU-WA',
    name: 'Australia - Western Australia',
    shortName: 'Western Australia',
    flag: '🇦🇺',
    region: 'Asia-Pacific',
    timezone: 'Australia/Perth',
    currency: 'AUD',

    // Formatting
    formatting: {
        dateLocale: 'en-AU',
        dateFormat: 'DD/MM/YYYY',
        phoneFormat: '(0X) XXXX XXXX',
        phoneCountryCode: '+61'
    },

    // Regulatory Bodies
    regulatoryBodies: {
        primary: {
            name: 'DPIRD',
            fullName: 'Department of Primary Industries and Regional Development',
            role: 'Biosecurity and IMS management',
            email: 'biosecurity@dpird.wa.gov.au',
            phone: '(08) 9368 3657',
            website: 'https://www.dpird.wa.gov.au'
        },
        port: {
            name: 'FPA',
            fullName: 'Fremantle Port Authority',
            role: 'Port operations and approvals',
            email: 'enquiries@fremantleports.com.au',
            phone: '(08) 9430 3555',
            emergencyPhone: '(08) 9430 3555',
            website: 'https://www.fremantleports.com.au'
        },
        biosecurity: {
            name: 'DAFF',
            fullName: 'Department of Agriculture, Fisheries and Forestry',
            role: 'Federal biosecurity',
            phone: '1800 900 090',
            website: 'https://www.agriculture.gov.au'
        },
        maritime: {
            name: 'AMSA',
            fullName: 'Australian Maritime Safety Authority',
            role: 'Maritime safety',
            phone: '1800 627 484',
            website: 'https://www.amsa.gov.au'
        }
    },

    // Key Regulations
    regulations: {
        primary: {
            name: 'Australian Anti-fouling and In-water Cleaning Guidelines',
            version: 'Exposure Draft 2024',
            shortName: 'IWHC Guidelines 2024'
        },
        portOEMP: {
            name: 'Fremantle Port Authority Operations Environmental Management Plan',
            shortName: 'FPA OEMP',
            sections: {
                riskCategories: '6.1.2',
                biosecurityAssessment: '6.1.3-6.1.4',
                samplingProtocols: '7.2',
                afcRequirements: '6.4.2'
            }
        }
    },

    // Document References (used in templates)
    documentReferences: {
        exposureDraft: {
            requiredOutcomes: 'Section 2.2',
            applicationOfStandards: 'Section 2.3',
            decisionSupportTools: 'Section 2.4',
            hullGrooming: 'Section 2.3.2',
            hullCleaning: 'Section 2.3.1',
            propellerPolish: 'Section 2.3.3',
            nicheAreas: 'Section 2.3.4',
            regionalBiofouling: 'Section 2.3.5'
        },
        oemp: {
            riskCategories: 'OEMP 6.1.2',
            highRisk: 'OEMP 6.1.2',
            afcUnknown: 'OEMP 6.4.2'
        },
        sapDocuments: {
            standard: 'QAP00129aFUS-001 – In-Water Hull Cleaning Sampling and Analysis Plan (SAP)',
            under35m: 'QAP00129FUS-002 – In-Water Hull Cleaning Sampling and Analysis Plan (SAP) – Vessels under 35m'
        }
    },

    // Ports
    ports: [
        { name: 'Fremantle Inner Harbour', code: 'AUFRE', lat: -32.0569, lng: 115.7439 },
        { name: 'Rous Head Harbour', code: 'AURH', lat: -32.0333, lng: 115.7333 },
        { name: 'Australian Marine Complex (AMC), Henderson', code: 'AUAMC', lat: -32.1500, lng: 115.7667 },
        { name: 'Kwinana Bulk Terminal', code: 'AUKWI', lat: -32.2333, lng: 115.7667 },
        { name: 'Cockburn Sound', code: 'AUCS', lat: -32.1667, lng: 115.7500 }
    ],

    // Emergency Contacts
    emergencyContacts: {
        generalEmergency: { name: 'Emergency Services', phone: '000' },
        police: { name: 'Police', phone: '000' },
        ambulance: { name: 'Ambulance', phone: '000' },
        fire: { name: 'Fire', phone: '000' },
        
        divingEmergency: { 
            name: 'Diving Emergency Service (DES)', 
            phone: '1800 088 200',
            available: '24/7'
        },
        poisonControl: { 
            name: 'Poisons Information Centre', 
            phone: '13 11 26' 
        },
        
        primaryHospital: { 
            name: 'Fremantle Hospital', 
            phone: '(08) 9431 3333',
            address: 'Alma Street, Fremantle WA 6160'
        },
        secondaryHospital: { 
            name: 'Fiona Stanley Hospital', 
            phone: '(08) 6152 2222',
            address: '11 Robin Warren Dr, Murdoch WA 6150'
        },
        hyperbaric: {
            name: 'Fiona Stanley Hospital Hyperbaric Unit',
            phone: '(08) 6152 2222',
            address: '11 Robin Warren Dr, Murdoch WA 6150'
        },

        imsHotline: { 
            name: 'DPIRD Marine Pest Hotline', 
            phone: '(08) 9368 3657',
            instruction: 'Report any suspected Invasive Marine Species immediately'
        },
        portEmergency: { 
            name: 'FPA Emergency', 
            phone: '(08) 9430 3555' 
        },
        coastGuard: { 
            name: 'Australian Volunteer Coast Guard', 
            phone: '(08) 9335 3310' 
        }
    },

    // Prohibited Biocides
    prohibitedBiocides: [
        'Tributyltin (TBT)',
        'Diuron',
        'Cybutryne (Irgarol 1051)',
        'Ziram',
        'Chlorothalonil'
    ],

    // Scenario Logic Configuration
    scenarioLogic: {
        // Fouling Rating thresholds
        thresholds: {
            groomingMax: 20,         // FR ≤20 = grooming eligible
            cleaningMin: 30,         // FR ≥30 = cleaning required
            cleaningMax: 80,         // FR ≤80 = standard cleaning
            highRiskMin: 90          // FR ≥90 = high risk
        },
        
        // Capture requirements by scenario
        captureRules: {
            hullGroomingNonBiocidal: false,  // FR≤20, non-biocidal AFC
            hullGroomingBiocidal: true,       // FR≤20, biocidal AFC
            hullCleaning: true,               // FR 30-80
            heavyFouling: true,               // FR >80
            nicheAreas: true,                 // Always
            propellerPolish: false,           // FR≤80, ≤5% cover
            propellerClean: true              // Elevated fouling
        },

        // SAP requirements
        sapRules: {
            followsCapture: true,  // SAP required whenever capture required
            additionalTriggers: [] // No additional SAP-only triggers in AU
        },

        // High risk triggers
        highRiskTriggers: [
            { field: 'foulingRating', condition: 'gte', value: 90, message: 'FR ≥90: Heavy fouling classified as high risk (OEMP 6.1.2)' },
            { field: 'biofoulingOrigin', condition: 'in', value: ['international', 'unknown'], message: 'Non-regional biofouling: Classified as high risk (OEMP 6.1.2)' },
            { field: 'afcCondition', condition: 'in', value: ['damaged', 'unknown'], message: 'AFC damaged/unknown: Classified as high risk (OEMP 6.1.2)' },
            { field: 'afcType', condition: 'eq', value: 'unknown', message: 'AFC type unknown: Classified as high risk (OEMP 6.4.2)' }
        ],

        // Capture standard
        captureStandard: {
            filterMicron: 10,
            description: 'Vacuum heads with removable scraper blades, filtered through 10-micron unit'
        }
    },

    // Features/Requirements specific to this jurisdiction
    features: {
        preCleanInspection: true,
        preCleanInspectionHours: 48,
        postCleanReport: true,
        postCleanReportDays: 20,
        videoRecording: true,
        imsReporting: true,
        sapRequired: true,
        afsCertificateRequired: true
    },

    // Approval Process Steps
    approvalProcess: [
        { step: 1, action: 'Submit notification package to FPA and DPIRD', timing: 'Before work' },
        { step: 2, action: 'DPIRD reviews vessel history, confirms acceptable risk', timing: 'Review period' },
        { step: 3, action: 'Pre-clean inspection by DPIRD-recognised inspector', timing: '≥48hrs before clean' },
        { step: 4, action: 'DPIRD clearance to proceed', timing: 'Before clean' },
        { step: 5, action: 'If IMS detected → site to DPIRD custody', timing: 'During clean' },
        { step: 6, action: 'If no IMS → proceed with clean', timing: 'During clean' },
        { step: 7, action: 'Post-clean inspection', timing: 'After clean' },
        { step: 8, action: 'Final Report to FPA and DPIRD', timing: '≤20 business days' }
    ],

    // Email recipients for notifications
    notificationRecipients: {
        primary: [
            { name: 'DPIRD Biosecurity', email: 'biosecurity@dpird.wa.gov.au' },
            { name: 'Fremantle Port Authority', email: 'enquiries@fremantleports.com.au' }
        ],
        cc: []
    },

    // Compliance text snippets for templates
    complianceText: {
        regulatoryAlignment: 'The cleaning methodology aligns with the Decision Support Tool outlined in Chapter 8 of the 2025 IWHC draft guidelines and supports the operational standards proposed by regulatory bodies.',
        dpirdRole: 'DPIRD is a key stakeholder in marine pest management. As such, all IMS risks must be addressed through inspection, sampling, and reporting.',
        portCompliance: 'All planned operations will conform with Fremantle Port Authority requirements, and approvals are expected to follow formal permit-to-operate processes.',
        highRiskNote: 'High risk vessels (FR≥90, non-regional biofouling, IMS suspected, AFC damaged/unknown/expired) are assessed case-by-case under DPIRD direction (OEMP 6.1.2).',
        imsProtocol: 'Should IMS be detected during operations, DPIRD will be notified immediately, and further works will be conducted under their discretion and authority.',
        videoRequirement: 'Helmet-mounted CCTV will be used to record all cleaning activities, with footage retained as part of job documentation.',
        regionalBiofouling: "The vessel's operational history is confined to regional waters, supporting alignment with WA state practices regarding biosecurity risk and AFC cleanliness assessments.",
        domesticBiofouling: "While the vessel's operational history is largely confined to domestic waters, visits to other states require elevated biosecurity controls as outlined in this WMS.",
        internationalBiofouling: "The vessel has operated in international waters, requiring full biosecurity assessment and elevated controls as outlined in this WMS."
    },

    // Abbreviations for glossary
    abbreviations: {
        'AFC': 'Anti-Fouling Coating',
        'AFS': 'Anti-Fouling System',
        'ALARP': 'As Low As Reasonably Possible',
        'DAFF': 'Department of Agriculture, Forestry and Fisheries',
        'DPIRD': 'Department of Primary Industries and Regional Development',
        'ERP': 'Emergency Response Plan',
        'FPA': 'Fremantle Port Authority',
        'FR': 'Fouling Rating',
        'FUS': 'Franmarine Underwater Services',
        'IMS': 'Invasive Marine Species',
        'IWC': 'In-Water Cleaning',
        'JHEA': 'Job Hazard and Environmental Analysis',
        'LOA': 'Length Overall',
        'OEMP': 'Operations Environmental Management Plan',
        'PIC': 'Person in Charge',
        'PPE': 'Personal Protective Equipment',
        'SAP': 'Sampling and Analysis Plan',
        'SWMS': 'Safe Work Method Statement',
        'WHS': 'Work Health and Safety',
        'WHSMP': 'Work Health and Safety Management Plan',
        'WMS': 'Work Method Statement'
    }
};

// Register with JurisdictionConfig
if (typeof JurisdictionConfig !== 'undefined') {
    JurisdictionConfig.register('AU-WA', AU_WA_CONFIG);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AU_WA_CONFIG;
}

