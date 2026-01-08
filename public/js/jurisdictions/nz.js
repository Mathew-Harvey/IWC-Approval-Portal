/**
 * New Zealand Jurisdiction Configuration
 * 
 * Regulatory Framework:
 * - MPI (Ministry for Primary Industries) - Primary biosecurity regulator
 * - Maritime New Zealand - Maritime safety
 * - Craft Risk Management Standard (CRMS) - effective May 2018
 * - Biosecurity Act 1993
 * - HSNO Act 1996 (Hazardous Substances and New Organisms)
 * 
 * Reference: https://www.mpi.govt.nz/dmsdocument/4092/direct
 */

const NZ_CONFIG = {
    // Basic Info
    id: 'NZ',
    name: 'New Zealand',
    shortName: 'New Zealand',
    flag: '🇳🇿',
    region: 'Asia-Pacific',
    timezone: 'Pacific/Auckland',
    currency: 'NZD',

    // Formatting
    formatting: {
        dateLocale: 'en-NZ',
        dateFormat: 'DD/MM/YYYY',
        phoneFormat: '(0X) XXX XXXX',
        phoneCountryCode: '+64'
    },

    // Regulatory Bodies
    regulatoryBodies: {
        primary: {
            name: 'MPI',
            fullName: 'Ministry for Primary Industries',
            role: 'Biosecurity and biofouling management',
            email: 'info@mpi.govt.nz',
            phone: '0800 00 83 33',
            website: 'https://www.mpi.govt.nz'
        },
        maritime: {
            name: 'Maritime NZ',
            fullName: 'Maritime New Zealand',
            role: 'Maritime safety and regulation',
            email: 'enquiries@maritimenz.govt.nz',
            phone: '+64 4 473 0111',
            emergencyPhone: '+64 4 577 8030',
            website: 'https://www.maritimenz.govt.nz'
        },
        biosecurity: {
            name: 'MPI Biosecurity',
            fullName: 'MPI Biosecurity New Zealand',
            role: 'Border biosecurity',
            phone: '0800 80 99 66',
            website: 'https://www.biosecurity.govt.nz'
        },
        environmental: {
            name: 'DOC',
            fullName: 'Department of Conservation',
            role: 'Marine conservation',
            phone: '0800 362 468',
            website: 'https://www.doc.govt.nz'
        }
    },

    // Key Regulations
    regulations: {
        primary: {
            name: 'Craft Risk Management Standard',
            shortName: 'CRMS',
            version: 'May 2018',
            description: 'Biofouling requirements for vessels entering NZ waters'
        },
        biosecurity: {
            name: 'Biosecurity Act 1993',
            shortName: 'Biosecurity Act'
        },
        hsno: {
            name: 'Hazardous Substances and New Organisms Act 1996',
            shortName: 'HSNO Act'
        },
        importHealth: {
            name: 'Import Health Standard for Vessel Biofouling',
            shortName: 'IHS Biofouling'
        }
    },

    // Document References (used in templates)
    documentReferences: {
        crms: {
            cleanHullRequirement: 'CRMS Section 3',
            arrivalNotice: 'CRMS Section 4',
            managementPlan: 'CRMS Section 5'
        },
        mpiGuidelines: {
            inWaterCleaning: 'MPI In-Water Cleaning Guidelines',
            reference: 'https://www.mpi.govt.nz/dmsdocument/4092/direct'
        },
        sapDocuments: {
            standard: 'Sampling and Analysis Plan – In-Water Hull Cleaning',
            under35m: 'Sampling and Analysis Plan – Vessels under 35m'
        }
    },

    // Ports
    ports: [
        { name: 'Auckland (Ports of Auckland)', code: 'NZAKL', lat: -36.8406, lng: 174.7617 },
        { name: 'Tauranga (Port of Tauranga)', code: 'NZTRG', lat: -37.6500, lng: 176.1667 },
        { name: 'Wellington (CentrePort)', code: 'NZWLG', lat: -41.2833, lng: 174.7833 },
        { name: 'Lyttelton (Lyttelton Port)', code: 'NZLYT', lat: -43.6000, lng: 172.7167 },
        { name: 'Dunedin (Port Otago)', code: 'NZDUD', lat: -45.8167, lng: 170.6333 },
        { name: 'Napier (Napier Port)', code: 'NZNPE', lat: -39.4833, lng: 176.9167 },
        { name: 'New Plymouth (Port Taranaki)', code: 'NZNPL', lat: -39.0500, lng: 174.0333 },
        { name: 'Nelson (Port Nelson)', code: 'NZNSN', lat: -41.2667, lng: 173.2833 },
        { name: 'Bluff (South Port)', code: 'NZBLU', lat: -46.6000, lng: 168.3500 },
        { name: 'Timaru (PrimePort)', code: 'NZTIU', lat: -44.3833, lng: 171.2500 }
    ],

    // Emergency Contacts
    emergencyContacts: {
        generalEmergency: { name: 'Emergency Services', phone: '111' },
        police: { name: 'Police', phone: '111' },
        ambulance: { name: 'Ambulance', phone: '111' },
        fire: { name: 'Fire', phone: '111' },
        
        divingEmergency: { 
            name: 'Slark Hyperbaric Unit (Auckland)', 
            phone: '+64 9 307 4949',
            available: '24/7',
            alternatePhone: '+64 21 251 8378'
        },
        poisonControl: { 
            name: 'National Poisons Centre', 
            phone: '0800 764 766' 
        },
        
        primaryHospital: { 
            name: 'Auckland City Hospital', 
            phone: '+64 9 367 0000',
            address: '2 Park Rd, Grafton, Auckland 1023'
        },
        secondaryHospital: { 
            name: 'Wellington Regional Hospital', 
            phone: '+64 4 385 5999',
            address: 'Riddiford St, Newtown, Wellington 6021'
        },
        hyperbaric: {
            name: 'Slark Hyperbaric Unit',
            phone: '+64 9 307 4949',
            address: 'Auckland City Hospital, 2 Park Rd, Grafton'
        },

        imsHotline: { 
            name: 'MPI Exotic Pest and Disease Hotline', 
            phone: '0800 80 99 66',
            instruction: 'Report any suspected non-indigenous marine species immediately'
        },
        maritimeEmergency: { 
            name: 'Maritime NZ Rescue Coordination', 
            phone: '+64 4 577 8030' 
        },
        coastGuard: { 
            name: 'Coastguard New Zealand', 
            phone: '*500 (mobile) or VHF Ch 16' 
        }
    },

    // Prohibited Biocides
    prohibitedBiocides: [
        'Tributyltin (TBT)',
        'Methoxychlor',
        'Dechlorane Plus',
        'UV-328',
        'Cybutryne (Irgarol 1051)'
    ],

    // Scenario Logic Configuration
    scenarioLogic: {
        // NZ uses Level of Fouling (LOF) scale, similar to FR
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
            additionalTriggers: []
        },

        highRiskTriggers: [
            { field: 'foulingRating', condition: 'gte', value: 90, message: 'LOF ≥90: Heavy fouling - requires MPI assessment' },
            { field: 'biofoulingOrigin', condition: 'in', value: ['international', 'unknown'], message: 'Non-domestic biofouling: Elevated biosecurity risk' },
            { field: 'afcCondition', condition: 'in', value: ['damaged', 'unknown'], message: 'AFC damaged/unknown: Requires assessment' },
            { field: 'afcType', condition: 'eq', value: 'unknown', message: 'AFC type unknown: Requires verification' }
        ],

        captureStandard: {
            filterMicron: 10,
            description: 'Capture and filtration through minimum 10-micron unit'
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
        crmsCompliance: true,
        arrivalNotification: true
    },

    // Approval Process Steps (NZ-specific)
    approvalProcess: [
        { step: 1, action: 'Submit Advanced Notice of Arrival with biofouling declaration', timing: 'Before arrival' },
        { step: 2, action: 'Provide evidence of CRMS compliance (clean hull/management plan)', timing: 'With arrival notice' },
        { step: 3, action: 'MPI reviews vessel documentation', timing: 'Review period' },
        { step: 4, action: 'Pre-clean inspection if required', timing: '≥24hrs before clean' },
        { step: 5, action: 'MPI clearance to proceed', timing: 'Before clean' },
        { step: 6, action: 'If non-indigenous species detected → report to MPI immediately', timing: 'During clean' },
        { step: 7, action: 'Proceed with approved cleaning methodology', timing: 'During clean' },
        { step: 8, action: 'Post-clean inspection', timing: 'After clean' },
        { step: 9, action: 'Final Report to MPI and Port Authority', timing: '≤14 business days' }
    ],

    // Email recipients
    notificationRecipients: {
        primary: [
            { name: 'MPI Biosecurity', email: 'info@mpi.govt.nz' }
        ],
        cc: [
            { name: 'Port Authority', email: 'varies-by-port' }
        ]
    },

    // Compliance text snippets
    complianceText: {
        regulatoryAlignment: 'The cleaning methodology aligns with MPI In-Water Cleaning Guidelines and supports the biosecurity objectives of the Craft Risk Management Standard (CRMS).',
        mpiRole: 'MPI is responsible for managing biosecurity risks associated with vessel biofouling. All suspected non-indigenous species must be reported immediately.',
        portCompliance: 'All planned operations will conform with port authority requirements and New Zealand maritime safety regulations.',
        highRiskNote: 'Vessels with heavy fouling (LOF≥90), non-domestic biofouling history, or damaged AFC require case-by-case assessment under MPI direction.',
        imsProtocol: 'Should suspected non-indigenous species be detected during operations, MPI will be notified immediately on 0800 80 99 66.',
        videoRequirement: 'Video recording of all cleaning activities is required for compliance verification and biosecurity documentation.',
        crmsCompliance: 'The vessel must demonstrate compliance with CRMS through evidence of hull cleaning within 30 days, continuous maintenance program, or approved biofouling management plan.',
        regionalBiofouling: "The vessel's operational history is confined to New Zealand waters, supporting alignment with domestic biosecurity requirements.",
        domesticBiofouling: "The vessel operates within New Zealand waters with documented biofouling management practices.",
        internationalBiofouling: "The vessel has arrived from international waters, requiring full CRMS compliance verification and elevated biosecurity controls."
    },

    // Abbreviations
    abbreviations: {
        'AFC': 'Anti-Fouling Coating',
        'AFS': 'Anti-Fouling System',
        'CRMS': 'Craft Risk Management Standard',
        'DOC': 'Department of Conservation',
        'ERP': 'Emergency Response Plan',
        'FR': 'Fouling Rating',
        'HSNO': 'Hazardous Substances and New Organisms',
        'IHS': 'Import Health Standard',
        'IMS': 'Invasive Marine Species',
        'IWC': 'In-Water Cleaning',
        'LOA': 'Length Overall',
        'LOF': 'Level of Fouling',
        'MPI': 'Ministry for Primary Industries',
        'NIS': 'Non-Indigenous Species',
        'PPE': 'Personal Protective Equipment',
        'SAP': 'Sampling and Analysis Plan',
        'SWMS': 'Safe Work Method Statement',
        'WMS': 'Work Method Statement'
    }
};

// Register with JurisdictionConfig
if (typeof JurisdictionConfig !== 'undefined') {
    JurisdictionConfig.register('NZ', NZ_CONFIG);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NZ_CONFIG;
}

