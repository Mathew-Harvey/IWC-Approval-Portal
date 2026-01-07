/**
 * Singapore Jurisdiction Configuration
 * 
 * Regulatory Framework:
 * - MPA (Maritime and Port Authority of Singapore) - Primary maritime regulator
 * - NEA (National Environment Agency) - Environmental regulation
 * - PUB (Public Utilities Board / National Water Agency) - Trade effluent
 * - Sewerage and Drainage Act
 * - Trade Effluent Regulations
 */

const SG_CONFIG = {
    // Basic Info
    id: 'SG',
    name: 'Singapore',
    shortName: 'Singapore',
    flag: '🇸🇬',
    region: 'Asia-Pacific',
    timezone: 'Asia/Singapore',
    currency: 'SGD',

    // Formatting
    formatting: {
        dateLocale: 'en-SG',
        dateFormat: 'DD/MM/YYYY',
        phoneFormat: 'XXXX XXXX',
        phoneCountryCode: '+65'
    },

    // Regulatory Bodies
    regulatoryBodies: {
        primary: {
            name: 'MPA',
            fullName: 'Maritime and Port Authority of Singapore',
            role: 'Maritime regulation and port operations',
            email: 'qsm@mpa.gov.sg',
            phone: '+65 6226 5539',
            emergencyPhone: '+65 6226 5539',
            website: 'https://www.mpa.gov.sg'
        },
        environmental: {
            name: 'NEA',
            fullName: 'National Environment Agency',
            role: 'Environmental protection and pollution control',
            email: 'contact_nea@nea.gov.sg',
            phone: '+65 6225 5632',
            website: 'https://www.nea.gov.sg'
        },
        water: {
            name: 'PUB',
            fullName: 'Public Utilities Board (National Water Agency)',
            role: 'Trade effluent discharge regulation',
            phone: '1800 284 6600',
            website: 'https://www.pub.gov.sg'
        },
        safety: {
            name: 'MOM',
            fullName: 'Ministry of Manpower',
            role: 'Workplace safety and health',
            phone: '+65 6438 5122',
            website: 'https://www.mom.gov.sg'
        }
    },

    // Key Regulations
    regulations: {
        primary: {
            name: 'MPA Port Regulations',
            shortName: 'MPA Regulations',
            description: 'Maritime operations within Singapore port limits'
        },
        environmental: {
            name: 'Environmental Protection and Management Act',
            shortName: 'EPMA'
        },
        tradeEffluent: {
            name: 'Sewerage and Drainage (Trade Effluent) Regulations',
            shortName: 'Trade Effluent Regulations'
        },
        safety: {
            name: 'Workplace Safety and Health Act',
            shortName: 'WSH Act'
        }
    },

    // Document References
    documentReferences: {
        mpa: {
            portOperations: 'MPA Vessel Operations Guidelines',
            underwaterWork: 'MPA Underwater Work Permit Requirements',
            safetyZone: 'MPA Safety Zone Establishment'
        },
        pub: {
            tradeEffluent: 'PUB Written Approval Requirements',
            wasteDisposal: 'Trade Effluent Discharge Standards'
        },
        sapDocuments: {
            standard: 'Sampling and Analysis Plan – In-Water Hull Cleaning',
            under35m: 'Sampling and Analysis Plan – Vessels under 35m'
        }
    },

    // Ports
    ports: [
        { name: 'PSA Pasir Panjang Terminal', code: 'SGPPT', lat: 1.2667, lng: 103.7833 },
        { name: 'PSA Tanjong Pagar Terminal', code: 'SGTPT', lat: 1.2667, lng: 103.8333 },
        { name: 'PSA Keppel Terminal', code: 'SGKPT', lat: 1.2667, lng: 103.8500 },
        { name: 'PSA Brani Terminal', code: 'SGBRT', lat: 1.2583, lng: 103.8333 },
        { name: 'Jurong Port', code: 'SGJUP', lat: 1.3167, lng: 103.7167 },
        { name: 'Sembawang Shipyard', code: 'SGSEM', lat: 1.4500, lng: 103.8167 },
        { name: 'Keppel Shipyard (Tuas)', code: 'SGKSY', lat: 1.2833, lng: 103.6500 },
        { name: 'Marina Bay Cruise Centre', code: 'SGMBC', lat: 1.2700, lng: 103.8600 },
        { name: 'Singapore Cruise Centre (HarbourFront)', code: 'SGSCC', lat: 1.2650, lng: 103.8200 },
        { name: 'Loyang Offshore Supply Base', code: 'SGLOS', lat: 1.3667, lng: 103.9833 }
    ],

    // Emergency Contacts
    emergencyContacts: {
        generalEmergency: { name: 'Emergency Services', phone: '999' },
        police: { name: 'Police', phone: '999' },
        ambulance: { name: 'Ambulance / SCDF', phone: '995' },
        fire: { name: 'Fire / SCDF', phone: '995' },
        
        divingEmergency: { 
            name: 'SGH Hyperbaric & Diving Medicine Centre', 
            phone: '+65 6321 4267',
            available: '24/7',
            address: 'Singapore General Hospital'
        },
        poisonControl: { 
            name: 'Drug & Poison Information Centre', 
            phone: '+65 6423 9119' 
        },
        
        primaryHospital: { 
            name: 'Singapore General Hospital', 
            phone: '+65 6222 3322',
            address: 'Outram Road, Singapore 169608'
        },
        secondaryHospital: { 
            name: 'Changi General Hospital', 
            phone: '+65 6788 8833',
            address: '2 Simei Street 3, Singapore 529889'
        },
        hyperbaric: {
            name: 'SGH Hyperbaric & Diving Medicine Centre',
            phone: '+65 6321 4267',
            address: 'Singapore General Hospital, Outram Road'
        },

        portEmergency: { 
            name: 'MPA 24-Hour Operations', 
            phone: '+65 6226 5539',
            instruction: 'For all port-related emergencies and incidents'
        },
        neaHotline: { 
            name: 'NEA Hotline', 
            phone: '+65 6225 5632' 
        },
        coastGuard: { 
            name: 'Police Coast Guard', 
            phone: '+65 6547 5555' 
        }
    },

    // Prohibited Biocides
    prohibitedBiocides: [
        'Tributyltin (TBT)',
        'PFOA (Perfluorooctanoic acid)',
        'PFOS (Perfluorooctanesulfonic acid)',
        'Cybutryne (Irgarol 1051)'
    ],

    // Scenario Logic Configuration
    scenarioLogic: {
        thresholds: {
            groomingMax: 20,
            cleaningMin: 30,
            cleaningMax: 80,
            highRiskMin: 90
        },
        
        captureRules: {
            hullGroomingNonBiocidal: false,
            hullGroomingBiocidal: true,
            hullCleaning: true,
            heavyFouling: true,
            nicheAreas: true,
            propellerPolish: false,
            propellerClean: true
        },

        sapRules: {
            followsCapture: true,
            additionalTriggers: ['tradeEffluent']  // SAP required for PUB compliance
        },

        highRiskTriggers: [
            { field: 'foulingRating', condition: 'gte', value: 90, message: 'FR ≥90: Heavy fouling - requires MPA assessment' },
            { field: 'biofoulingOrigin', condition: 'in', value: ['international', 'unknown'], message: 'Non-regional biofouling: Elevated environmental controls' },
            { field: 'afcCondition', condition: 'in', value: ['damaged', 'unknown'], message: 'AFC damaged/unknown: Requires verification' }
        ],

        captureStandard: {
            filterMicron: 10,
            description: 'Full capture system with filtration to meet PUB trade effluent standards'
        }
    },

    // Features/Requirements
    features: {
        preCleanInspection: true,
        preCleanInspectionHours: 24,
        postCleanReport: true,
        postCleanReportDays: 14,
        videoRecording: true,
        imsReporting: true,
        sapRequired: true,
        afsCertificateRequired: true,
        pubWrittenApproval: true,
        mpaUnderwaterPermit: true,
        tradeEffluentCompliance: true
    },

    // Approval Process Steps
    approvalProcess: [
        { step: 1, action: 'Submit underwater work permit application to MPA', timing: 'Min 7 days before' },
        { step: 2, action: 'Obtain PUB Written Approval for trade effluent (if applicable)', timing: 'Before work' },
        { step: 3, action: 'Coordinate with port/terminal operator', timing: '48hrs before' },
        { step: 4, action: 'MPA reviews and issues permit', timing: 'Review period' },
        { step: 5, action: 'Establish safety zone as per MPA requirements', timing: 'Before clean' },
        { step: 6, action: 'Proceed with approved cleaning methodology', timing: 'During clean' },
        { step: 7, action: 'Waste collection by licensed contractor', timing: 'After clean' },
        { step: 8, action: 'Post-clean inspection', timing: 'After clean' },
        { step: 9, action: 'Submit completion report to MPA', timing: '≤14 days' }
    ],

    // Email recipients
    notificationRecipients: {
        primary: [
            { name: 'MPA Operations', email: 'qsm@mpa.gov.sg' }
        ],
        cc: [
            { name: 'Port/Terminal Operator', email: 'varies-by-location' }
        ]
    },

    // Compliance text snippets
    complianceText: {
        regulatoryAlignment: 'The cleaning methodology aligns with MPA port regulations and NEA environmental protection requirements.',
        mpaRole: 'MPA is responsible for regulating all underwater work within Singapore port limits. Underwater work permits must be obtained prior to operations.',
        portCompliance: 'All planned operations will conform with MPA requirements and port/terminal operator protocols. Safety zones will be established as required.',
        highRiskNote: 'Vessels with heavy fouling (FR≥90) or non-compliant AFC require case-by-case assessment under MPA direction.',
        pubCompliance: 'Trade effluent discharge must comply with PUB regulations. All captured waste will be disposed through licensed waste collectors.',
        videoRequirement: 'Video recording of all cleaning activities is required for MPA compliance verification.',
        safetyZone: 'A safety zone will be established around the vessel during diving operations in accordance with MPA requirements.',
        wasteDisposal: 'All biofouling waste and contaminated water will be collected and disposed through NEA-licensed industrial waste collectors.',
        regionalBiofouling: "The vessel's operational history is confined to regional waters, supporting alignment with Singapore port biosecurity requirements.",
        internationalBiofouling: "The vessel has arrived from international waters, requiring full biosecurity verification and elevated environmental controls."
    },

    // Abbreviations
    abbreviations: {
        'AFC': 'Anti-Fouling Coating',
        'AFS': 'Anti-Fouling System',
        'ERP': 'Emergency Response Plan',
        'FR': 'Fouling Rating',
        'IWC': 'In-Water Cleaning',
        'LOA': 'Length Overall',
        'MOM': 'Ministry of Manpower',
        'MPA': 'Maritime and Port Authority',
        'NEA': 'National Environment Agency',
        'PPE': 'Personal Protective Equipment',
        'PSA': 'Port of Singapore Authority',
        'PUB': 'Public Utilities Board',
        'SAP': 'Sampling and Analysis Plan',
        'SCDF': 'Singapore Civil Defence Force',
        'SGH': 'Singapore General Hospital',
        'WMS': 'Work Method Statement',
        'WSH': 'Workplace Safety and Health'
    }
};

// Register with JurisdictionConfig
if (typeof JurisdictionConfig !== 'undefined') {
    JurisdictionConfig.register('SG', SG_CONFIG);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SG_CONFIG;
}

