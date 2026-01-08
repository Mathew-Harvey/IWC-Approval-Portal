/**
 * Japan Jurisdiction Configuration
 * 
 * Regulatory Framework:
 * - MLIT (Ministry of Land, Infrastructure, Transport and Tourism) - Maritime administration
 * - JCG (Japan Coast Guard) - Maritime safety and security
 * - MOE (Ministry of the Environment) - Environmental protection
 * - METI (Ministry of Economy, Trade and Industry) - Chemical substances
 * - Port and Harbor Act
 * - Chemical Substances Control Law (CSCL)
 * 
 * Note: Japan traditionally prefers dry-dock cleaning but in-water cleaning
 * acceptance is growing. Port-specific requirements apply.
 */

const JP_CONFIG = {
    // Basic Info
    id: 'JP',
    name: 'Japan',
    shortName: 'Japan',
    flag: '🇯🇵',
    region: 'Asia-Pacific',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',

    // Formatting
    formatting: {
        dateLocale: 'ja-JP',
        dateFormat: 'YYYY/MM/DD',  // Japanese format
        dateFormatAlt: 'DD/MM/YYYY',  // For English documents
        phoneFormat: '(0X) XXXX-XXXX',
        phoneCountryCode: '+81'
    },

    // Regulatory Bodies
    regulatoryBodies: {
        primary: {
            name: 'MLIT',
            fullName: 'Ministry of Land, Infrastructure, Transport and Tourism',
            nameJapanese: '国土交通省',
            role: 'Maritime administration and port management',
            email: 'hqt-kaiji-renraku@mlit.go.jp',
            phone: '+81 3-5253-8111',
            website: 'https://www.mlit.go.jp'
        },
        coastGuard: {
            name: 'JCG',
            fullName: 'Japan Coast Guard',
            nameJapanese: '海上保安庁',
            role: 'Maritime safety and security',
            emergencyPhone: '118',
            phone: '+81 3-3591-6361',
            website: 'https://www.kaiho.mlit.go.jp'
        },
        environment: {
            name: 'MOE',
            fullName: 'Ministry of the Environment',
            nameJapanese: '環境省',
            role: 'Environmental protection',
            phone: '+81 3-3581-3351',
            website: 'https://www.env.go.jp'
        },
        chemicals: {
            name: 'METI',
            fullName: 'Ministry of Economy, Trade and Industry',
            nameJapanese: '経済産業省',
            role: 'Chemical substances control (CSCL)',
            phone: '+81 3-3501-1511',
            website: 'https://www.meti.go.jp'
        }
    },

    // Key Regulations
    regulations: {
        port: {
            name: 'Port and Harbor Act',
            nameJapanese: '港湾法',
            description: 'Regulation of port operations'
        },
        maritime: {
            name: 'Maritime Traffic Safety Law',
            nameJapanese: '海上交通安全法'
        },
        chemical: {
            name: 'Chemical Substances Control Law',
            shortName: 'CSCL',
            nameJapanese: '化学物質審査規制法',
            description: 'Control of specified chemical substances'
        },
        environment: {
            name: 'Water Pollution Prevention Act',
            nameJapanese: '水質汚濁防止法'
        }
    },

    // Document References
    documentReferences: {
        portAuthority: {
            workPermit: 'Port Work Permit Application',
            underwaterWork: 'Underwater Work Notification'
        },
        cscl: {
            classI: 'Class I Specified Chemical Substances',
            prohibitedSubstances: 'CSCL Prohibited Substances List'
        },
        sapDocuments: {
            standard: 'Sampling and Analysis Plan – In-Water Hull Cleaning',
            under35m: 'Sampling and Analysis Plan – Vessels under 35m'
        }
    },

    // Ports
    ports: [
        { name: 'Port of Tokyo', code: 'JPTYO', lat: 35.6333, lng: 139.7667, nameJapanese: '東京港' },
        { name: 'Port of Yokohama', code: 'JPYOK', lat: 35.4556, lng: 139.6389, nameJapanese: '横浜港' },
        { name: 'Port of Kawasaki', code: 'JPKAW', lat: 35.5167, lng: 139.7667, nameJapanese: '川崎港' },
        { name: 'Port of Chiba', code: 'JPCHB', lat: 35.6000, lng: 140.1000, nameJapanese: '千葉港' },
        { name: 'Port of Nagoya', code: 'JPNGO', lat: 35.0833, lng: 136.8833, nameJapanese: '名古屋港' },
        { name: 'Port of Osaka', code: 'JPOSA', lat: 34.6500, lng: 135.4333, nameJapanese: '大阪港' },
        { name: 'Port of Kobe', code: 'JPUKB', lat: 34.6833, lng: 135.2000, nameJapanese: '神戸港' },
        { name: 'Port of Hakata (Fukuoka)', code: 'JPHKT', lat: 33.6000, lng: 130.4000, nameJapanese: '博多港' },
        { name: 'Port of Kitakyushu', code: 'JPKKJ', lat: 33.9500, lng: 130.9333, nameJapanese: '北九州港' },
        { name: 'Kure Shipyard', code: 'JPKRE', lat: 34.2333, lng: 132.5667, nameJapanese: '呉造船所' },
        { name: 'Port of Yokosuka', code: 'JPYSK', lat: 35.2833, lng: 139.6667, nameJapanese: '横須賀港' },
        { name: 'Sasebo', code: 'JPSSB', lat: 33.1667, lng: 129.7167, nameJapanese: '佐世保港' }
    ],

    // Emergency Contacts
    emergencyContacts: {
        generalEmergency: { name: 'Police', phone: '110' },
        police: { name: 'Police (警察)', phone: '110' },
        ambulance: { name: 'Fire/Ambulance (消防)', phone: '119' },
        fire: { name: 'Fire/Ambulance (消防)', phone: '119' },
        coastGuard: { name: 'Japan Coast Guard (海上保安庁)', phone: '118' },
        
        divingEmergency: { 
            name: 'Japan Hyperbaric Medical Society',
            nameJapanese: '日本高気圧環境・潜水医学会', 
            phone: 'Contact via nearest hospital',
            available: 'Hospital-based',
            description: 'Hyperbaric facilities are hospital-based in Japan'
        },
        poisonControl: { 
            name: 'Japan Poison Information Center', 
            phone: '+81 29-852-9999',
            osaka: '+81 72-727-2499'
        },
        
        primaryHospital: { 
            name: 'Tokyo Medical Center',
            nameJapanese: '東京医療センター', 
            phone: '+81 3-3411-0111',
            address: 'Meguro, Tokyo'
        },
        secondaryHospital: { 
            name: 'Yokohama City University Hospital',
            nameJapanese: '横浜市立大学附属病院', 
            phone: '+81 45-787-2800',
            address: 'Yokohama'
        },
        hyperbaric: {
            name: 'Japan Maritime Self-Defense Force Hospital',
            nameJapanese: '海上自衛隊病院',
            phone: 'Via Japan Coast Guard 118',
            note: 'Military hyperbaric facilities available for emergencies'
        },

        jcgEmergency: { 
            name: 'Japan Coast Guard Emergency', 
            phone: '118',
            instruction: 'For maritime emergencies'
        },
        portAuthority: { 
            name: 'Port Authority', 
            phone: 'Varies by port',
            instruction: 'Contact specific port authority'
        }
    },

    // Prohibited Biocides (CSCL Class I Specified Chemical Substances)
    prohibitedBiocides: [
        'Tributyltin (TBT)',
        'Methoxychlor',
        'Dechlorane Plus',
        'UV-328',
        'POPs under Stockholm Convention'
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
            hullGroomingNonBiocidal: true,  // Japan typically requires capture
            hullGroomingBiocidal: true,
            hullCleaning: true,
            heavyFouling: true,
            nicheAreas: true,
            propellerPolish: true,
            propellerClean: true
        },

        sapRules: {
            followsCapture: true,
            additionalTriggers: []
        },

        highRiskTriggers: [
            { field: 'foulingRating', condition: 'gte', value: 90, message: 'FR ≥90: Heavy fouling - port authority assessment required' },
            { field: 'biofoulingOrigin', condition: 'in', value: ['international', 'unknown'], message: 'International biofouling: Environmental assessment required' },
            { field: 'afcCondition', condition: 'in', value: ['damaged', 'unknown'], message: 'AFC damaged/unknown: CSCL compliance verification required' }
        ],

        captureStandard: {
            filterMicron: 10,
            description: 'Full capture with filtration. Waste disposal through licensed industrial waste contractors.'
        }
    },

    // Features/Requirements
    features: {
        preCleanInspection: true,
        preCleanInspectionHours: 48,
        postCleanReport: true,
        postCleanReportDays: 14,
        videoRecording: true,
        imsReporting: true,
        sapRequired: true,
        afsCertificateRequired: true,
        portAuthorityPermit: true,
        jcgNotification: true,
        licensedWasteDisposal: true,
        japaneseDocumentation: true  // Documents may need Japanese translation
    },

    // Approval Process Steps
    approvalProcess: [
        { step: 1, action: 'Submit underwater work application to Port Authority', timing: 'Min 7 days before', japanese: '港湾局に水中作業申請書を提出' },
        { step: 2, action: 'Notify Japan Coast Guard of diving operations', timing: '72hrs before', japanese: '海上保安庁に潜水作業を届出' },
        { step: 3, action: 'Port Authority reviews and approves', timing: 'Review period', japanese: '港湾局が審査・承認' },
        { step: 4, action: 'Pre-clean inspection and documentation', timing: '≥48hrs before clean', japanese: '事前検査と文書化' },
        { step: 5, action: 'Proceed with approved cleaning methodology', timing: 'During clean', japanese: '承認された方法で清掃実施' },
        { step: 6, action: 'Waste collection by licensed contractor', timing: 'After clean', japanese: '許可業者による廃棄物回収' },
        { step: 7, action: 'Post-clean inspection', timing: 'After clean', japanese: '作業後検査' },
        { step: 8, action: 'Submit completion report to Port Authority', timing: '≤14 days', japanese: '港湾局に完了報告書を提出' }
    ],

    // Email recipients
    notificationRecipients: {
        primary: [
            { name: 'Port Authority', email: 'varies-by-port' }
        ],
        cc: [
            { name: 'Japan Coast Guard (Regional)', email: 'varies-by-region' }
        ]
    },

    // Compliance text snippets
    complianceText: {
        regulatoryAlignment: 'The cleaning methodology aligns with Japanese port regulations and environmental protection requirements under the Water Pollution Prevention Act.',
        portAuthorityRole: 'All underwater work within port limits requires prior approval from the relevant Port Authority. Work permits must be obtained.',
        jcgNotification: 'Japan Coast Guard must be notified of all diving operations. Contact JCG on 118 for emergencies.',
        csclCompliance: 'Anti-fouling coatings must not contain Class I Specified Chemical Substances as defined under CSCL.',
        wasteDisposal: 'All biofouling waste must be disposed through licensed industrial waste management contractors (産業廃棄物処理業者).',
        highRiskNote: 'Vessels with heavy fouling or international biofouling history require port authority assessment before cleaning approval.',
        videoRequirement: 'Video documentation of all cleaning activities is required for compliance verification.',
        languageNote: 'Documentation may be required in Japanese. English translations should be accompanied by Japanese versions.',
        regionalBiofouling: "The vessel's operational history is confined to Japanese waters.",
        internationalBiofouling: "The vessel has arrived from international waters, requiring full environmental and biosecurity assessment."
    },

    // Abbreviations (with Japanese)
    abbreviations: {
        'AFC': 'Anti-Fouling Coating (防汚塗料)',
        'AFS': 'Anti-Fouling System',
        'CSCL': 'Chemical Substances Control Law (化審法)',
        'ERP': 'Emergency Response Plan',
        'FR': 'Fouling Rating',
        'IWC': 'In-Water Cleaning (水中船体清掃)',
        'JCG': 'Japan Coast Guard (海上保安庁)',
        'LOA': 'Length Overall',
        'METI': 'Ministry of Economy, Trade and Industry (経済産業省)',
        'MLIT': 'Ministry of Land, Infrastructure, Transport and Tourism (国土交通省)',
        'MOE': 'Ministry of the Environment (環境省)',
        'PPE': 'Personal Protective Equipment',
        'SAP': 'Sampling and Analysis Plan',
        'WMS': 'Work Method Statement'
    },

    // Additional Japan-specific fields
    additionalRequirements: {
        languageSupport: {
            primaryLanguage: 'Japanese',
            secondaryLanguage: 'English',
            documentTranslation: 'May be required for official submissions'
        },
        businessCulture: {
            advanceNotice: 'Advance notice and relationship building with port authorities recommended',
            formalProcesses: 'Formal written applications preferred over informal communication'
        }
    }
};

// Register with JurisdictionConfig
if (typeof JurisdictionConfig !== 'undefined') {
    JurisdictionConfig.register('JP', JP_CONFIG);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JP_CONFIG;
}

