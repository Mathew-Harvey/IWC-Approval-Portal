/**
 * United States - California Jurisdiction Configuration
 * 
 * Regulatory Framework:
 * - EPA (Environmental Protection Agency) - Federal environmental
 * - USCG (United States Coast Guard) - Federal maritime
 * - California State Lands Commission - State-level IWC guidelines
 * - California Dept of Fish & Wildlife - Invasive species
 * - VIDA (Vessel Incidental Discharge Act) 2018
 * 
 * Note: US regulations vary significantly by state. This config is for California,
 * which has among the strictest in-water cleaning requirements.
 * 
 * Reference: https://www.slc.ca.gov/wp-content/uploads/2018/08/PF2014_Collaborative-Georgiades.pdf
 */

const US_CA_CONFIG = {
    // Basic Info
    id: 'US-CA',
    name: 'United States - California',
    shortName: 'California',
    flag: '🇺🇸',
    region: 'Americas',
    timezone: 'America/Los_Angeles',
    currency: 'USD',

    // Formatting
    formatting: {
        dateLocale: 'en-US',
        dateFormat: 'MM/DD/YYYY',
        phoneFormat: '(XXX) XXX-XXXX',
        phoneCountryCode: '+1'
    },

    // Regulatory Bodies
    regulatoryBodies: {
        primary: {
            name: 'CSLC',
            fullName: 'California State Lands Commission',
            role: 'State-level in-water cleaning guidelines',
            email: 'cslc.commissionoffice@slc.ca.gov',
            phone: '(916) 574-1800',
            website: 'https://www.slc.ca.gov'
        },
        federal: {
            name: 'EPA',
            fullName: 'Environmental Protection Agency',
            role: 'Federal environmental regulation',
            phone: '(202) 564-4700',
            emergencyPhone: '1-800-424-9346',
            website: 'https://www.epa.gov'
        },
        coastGuard: {
            name: 'USCG',
            fullName: 'United States Coast Guard',
            role: 'Federal maritime safety and security',
            phone: '(202) 372-4411',
            emergencyPhone: 'VHF Ch 16',
            website: 'https://www.uscg.mil'
        },
        wildlife: {
            name: 'CDFW',
            fullName: 'California Department of Fish and Wildlife',
            role: 'Invasive species management',
            phone: '(916) 445-0411',
            invasiveHotline: '1-866-440-9530',
            website: 'https://wildlife.ca.gov'
        },
        waterBoard: {
            name: 'SWRCB',
            fullName: 'State Water Resources Control Board',
            role: 'Water quality regulation',
            phone: '(916) 341-5250',
            website: 'https://www.waterboards.ca.gov'
        }
    },

    // Key Regulations
    regulations: {
        federal: {
            name: 'Vessel Incidental Discharge Act',
            shortName: 'VIDA',
            year: 2018,
            description: 'Federal standards for vessel incidental discharges'
        },
        state: {
            name: 'California In-Water Cleaning Guidelines',
            shortName: 'CSLC Guidelines',
            description: 'Best management practices for in-water cleaning'
        },
        cleanWater: {
            name: 'Clean Water Act',
            shortName: 'CWA',
            description: 'Federal water quality standards'
        },
        invasiveSpecies: {
            name: 'California Invasive Species Management Program',
            shortName: 'ISMP'
        }
    },

    // Document References
    documentReferences: {
        cslc: {
            guidelines: 'California State Lands Commission In-Water Cleaning Perspectives',
            bestPractices: 'Best Management Practices for In-Water Hull Cleaning',
            reference: 'https://www.slc.ca.gov/wp-content/uploads/2018/08/PF2014_Collaborative-Georgiades.pdf'
        },
        vida: {
            standards: 'VIDA Hull Coating Discharge Standards',
            biofouling: 'VIDA Biofouling Discharge Requirements'
        },
        sapDocuments: {
            standard: 'Sampling and Analysis Plan – In-Water Hull Cleaning',
            under35m: 'Sampling and Analysis Plan – Vessels under 35m (115ft)'
        }
    },

    // Ports
    ports: [
        { name: 'Port of Los Angeles', code: 'USLAX', lat: 33.7406, lng: -118.2712 },
        { name: 'Port of Long Beach', code: 'USLGB', lat: 33.7540, lng: -118.2167 },
        { name: 'Port of San Diego', code: 'USSAN', lat: 32.6881, lng: -117.1533 },
        { name: 'Port of San Francisco', code: 'USSFO', lat: 37.8044, lng: -122.4679 },
        { name: 'Port of Oakland', code: 'USOAK', lat: 37.7952, lng: -122.2793 },
        { name: 'Port of Richmond', code: 'USRIC', lat: 37.9156, lng: -122.3580 },
        { name: 'Port Hueneme', code: 'USHUE', lat: 34.1480, lng: -119.2095 },
        { name: 'Port of Stockton', code: 'USSTO', lat: 37.9555, lng: -121.3500 },
        { name: 'Port of Sacramento', code: 'USSAC', lat: 38.5556, lng: -121.5140 },
        { name: 'Redwood City Port', code: 'USRWC', lat: 37.5072, lng: -122.2181 }
    ],

    // Emergency Contacts
    emergencyContacts: {
        generalEmergency: { name: 'Emergency Services', phone: '911' },
        police: { name: 'Police', phone: '911' },
        ambulance: { name: 'Ambulance', phone: '911' },
        fire: { name: 'Fire', phone: '911' },
        
        divingEmergency: { 
            name: 'Divers Alert Network (DAN)', 
            phone: '1-919-684-9111',
            available: '24/7',
            description: 'International diving emergency hotline'
        },
        poisonControl: { 
            name: 'Poison Control Center', 
            phone: '1-800-222-1222' 
        },
        
        // Los Angeles area hospitals
        primaryHospital: { 
            name: 'Catalina Hyperbaric Chamber',
            phone: '(310) 510-0234',
            address: 'Catalina Island, CA'
        },
        secondaryHospital: { 
            name: 'Long Beach Memorial Medical Center', 
            phone: '(562) 933-2000',
            address: '2801 Atlantic Ave, Long Beach, CA 90806'
        },
        hyperbaric: {
            name: 'USC Catalina Hyperbaric Chamber',
            phone: '(310) 510-0234',
            alternatePhone: '(213) 742-2770',
            address: 'Two Harbors, Catalina Island'
        },

        uscgEmergency: { 
            name: 'USCG Sector Los Angeles', 
            phone: '(310) 732-2043',
            vhf: 'VHF Channel 16'
        },
        epaEmergency: { 
            name: 'EPA National Response Center', 
            phone: '1-800-424-8802' 
        },
        invasiveSpecies: { 
            name: 'CDFW Invasive Species Hotline', 
            phone: '1-866-440-9530',
            instruction: 'Report suspected invasive species immediately'
        }
    },

    // Prohibited Biocides
    prohibitedBiocides: [
        'Tributyltin (TBT)',
        'Copper (exceeding TMDL limits in some areas)',
        'PFAS compounds',
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
        
        // California emphasizes capture for all cleaning
        captureRules: {
            hullGroomingNonBiocidal: true,  // CA encourages capture even for grooming
            hullGroomingBiocidal: true,
            hullCleaning: true,
            heavyFouling: true,
            nicheAreas: true,
            propellerPolish: true,  // CA encourages capture for all operations
            propellerClean: true
        },

        sapRules: {
            followsCapture: true,
            additionalTriggers: ['copperAFC']  // Additional sampling for copper AFC
        },

        highRiskTriggers: [
            { field: 'foulingRating', condition: 'gte', value: 90, message: 'FR ≥90: Heavy fouling - potential invasive species concern' },
            { field: 'biofoulingOrigin', condition: 'in', value: ['international', 'unknown'], message: 'Non-domestic biofouling: Elevated invasive species risk' },
            { field: 'afcCondition', condition: 'in', value: ['damaged', 'unknown'], message: 'AFC damaged/unknown: Requires water quality assessment' }
        ],

        captureStandard: {
            filterMicron: 10,
            description: 'Best management practices require capture with no visible debris discharge. Filtration to 10-micron recommended.'
        }
    },

    // Features/Requirements
    features: {
        preCleanInspection: true,
        preCleanInspectionHours: 24,
        postCleanReport: true,
        postCleanReportDays: 30,
        videoRecording: true,
        imsReporting: true,
        sapRequired: true,
        afsCertificateRequired: true,
        vidaCompliance: true,
        statePermit: true,
        captureEncouraged: true,  // CA strongly encourages capture for all IWC
        noVisibleDebris: true     // Zero visible debris discharge
    },

    // Approval Process Steps
    approvalProcess: [
        { step: 1, action: 'Verify VIDA compliance requirements', timing: 'Before work' },
        { step: 2, action: 'Confirm port/harbor authority requirements', timing: '7 days before' },
        { step: 3, action: 'Submit IWC work plan to port authority', timing: '48hrs before' },
        { step: 4, action: 'Obtain any required local permits', timing: 'Before work' },
        { step: 5, action: 'Pre-clean inspection and documentation', timing: 'Before clean' },
        { step: 6, action: 'Conduct cleaning with BMPs - no visible debris', timing: 'During clean' },
        { step: 7, action: 'If invasive species suspected → report to CDFW', timing: 'Immediately' },
        { step: 8, action: 'Proper disposal of captured waste', timing: 'After clean' },
        { step: 9, action: 'Post-clean inspection and documentation', timing: 'After clean' },
        { step: 10, action: 'Submit completion report', timing: '≤30 days' }
    ],

    // Email recipients
    notificationRecipients: {
        primary: [
            { name: 'Port Authority', email: 'varies-by-port' }
        ],
        cc: [
            { name: 'Harbor Master', email: 'varies-by-port' }
        ]
    },

    // Compliance text snippets
    complianceText: {
        regulatoryAlignment: 'The cleaning methodology aligns with California State Lands Commission Best Management Practices and VIDA federal discharge standards.',
        federalCompliance: 'All operations comply with VIDA (Vessel Incidental Discharge Act) requirements for hull coating leachate and biofouling management.',
        stateCompliance: 'Operations follow California in-water cleaning BMPs with emphasis on debris capture and invasive species prevention.',
        captureRequirement: 'California strongly encourages capture of all debris during in-water cleaning operations. No visible debris discharge is the operational standard.',
        highRiskNote: 'Vessels with heavy fouling (FR≥90), international biofouling, or damaged AFC require enhanced water quality monitoring.',
        invasiveProtocol: 'Suspected invasive species must be reported immediately to California Department of Fish and Wildlife at 1-866-440-9530.',
        videoRequirement: 'Video documentation of all cleaning activities is recommended for compliance verification.',
        wasteDisposal: 'All captured biofouling waste must be disposed of properly at approved facilities. No discharge to waters of the state.',
        copperNote: 'Areas with copper TMDLs may have additional restrictions on cleaning of copper-based AFC vessels.',
        regionalBiofouling: "The vessel's operational history is confined to US Pacific Coast waters.",
        internationalBiofouling: "The vessel has arrived from international waters, requiring full biofouling assessment and enhanced BMPs."
    },

    // Abbreviations
    abbreviations: {
        'AFC': 'Anti-Fouling Coating',
        'AFS': 'Anti-Fouling System',
        'BMP': 'Best Management Practice',
        'CDFW': 'California Department of Fish and Wildlife',
        'CSLC': 'California State Lands Commission',
        'CWA': 'Clean Water Act',
        'DAN': 'Divers Alert Network',
        'EPA': 'Environmental Protection Agency',
        'ERP': 'Emergency Response Plan',
        'FR': 'Fouling Rating',
        'IWC': 'In-Water Cleaning',
        'LOA': 'Length Overall',
        'NPDES': 'National Pollutant Discharge Elimination System',
        'PPE': 'Personal Protective Equipment',
        'SAP': 'Sampling and Analysis Plan',
        'SWRCB': 'State Water Resources Control Board',
        'TMDL': 'Total Maximum Daily Load',
        'USCG': 'United States Coast Guard',
        'VIDA': 'Vessel Incidental Discharge Act',
        'WMS': 'Work Method Statement'
    }
};

// Register with JurisdictionConfig
if (typeof JurisdictionConfig !== 'undefined') {
    JurisdictionConfig.register('US-CA', US_CA_CONFIG);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = US_CA_CONFIG;
}

