import Contact from '@/models/Contact';
import PoliceStation from '@/models/PoliceStation';
import TrafficViolation from '@/models/TrafficViolation';
import connectDB from './db';
import { sendInteractiveButtons, sendWhatsAppMessage, sendInteractiveList } from './whatsapp';
import { handleFormSubmission } from './chatbot-helpers';

interface ChatbotResponse {
    type: 'text' | 'buttons' | 'list';
    message?: string;
    bodyText?: string;
    buttonText?: string;
    buttons?: Array<{ id: string; title: string }>;
    sections?: Array<{
        title?: string;
        rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    language?: 'english' | 'hindi';
    /**
     * When true, the webhook will automatically send the service menu
     * after this response, signalling that a cycle has completed.
     */
    sendFollowUpMenu?: boolean;
    headerImageUrl?: string;
}

// Store user flow state in memory (in production, use Redis or database)
const userFlowState: Record<string, { step: string; data?: Record<string, unknown> }> = {};

/**
 * Process incoming message and generate appropriate response
 */
export async function processChatbotMessage(
    phoneNumber: string,
    incomingMessage: string,
    interactiveId?: string
): Promise<ChatbotResponse> {
    await connectDB();

    // Check if this is an interactive response
    if (interactiveId) {
        return await handleInteractiveResponse(phoneNumber, interactiveId);
    }

    // ── LANGUAGE GATE (must come first) ──────────────────────────────────────
    // Before doing anything else, check whether the user has picked a language.
    // This ensures that even "hi" / "hello" / "menu" from a brand-new user
    // will always show the language selection prompt.
    const normalizedMessage = incomingMessage.toLowerCase().trim();

    // Allow language-keyword shortcuts at any point (before gate check so they
    // can still switch language by typing "english" / "hindi").
    const languageSelection = detectLanguageSelection(normalizedMessage);
    if (languageSelection) {
        await Contact.findOneAndUpdate(
            { phoneNumber },
            { language: languageSelection },
            { upsert: true }
        );
        return await showDisclaimerAndContacts(phoneNumber, languageSelection);
    }

    // Fetch the contact once; re-used below.
    const contact = await Contact.findOne({ phoneNumber });
    const userLanguage = contact?.language;

    const greetingKeywords = ['hi', 'hello', 'hii', 'hey', 'start', 'test', 'johar', 'joh', 'jauhar'];
    const isGreeting = greetingKeywords.some(kw => normalizedMessage.includes(kw));
    
    // If no language is set yet, or user typed a greeting, show the welcome + language selection prompt.
    if (!userLanguage || isGreeting) {
        if (userFlowState[phoneNumber]) {
            delete userFlowState[phoneNumber];
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const logoUrl = baseUrl ? `${baseUrl}/hazaribagh%20police%20logo.png` : undefined;

        return {
            type: 'buttons',
            headerImageUrl: logoUrl,
            bodyText: `*Welcome to Hazaribagh Police Official WhatsApp Chatbot*\n*हजारीबाग पुलिस आधिकारिक व्हाट्सएप चैटबॉट में आपका स्वागत है*\n\n🚨 *Important Contacts / महत्वपूर्ण नंबर:*\n📞 Emergency / आपातकाल: 112\n📞 District Control Room Hazaribagh: 06546264159 / 8002529348\n📞 Cyber Crime Helpline / साइबर अपराध: 1930\n\nPlease select your official language:\nकृपया अपनी आधिकारिक भाषा चुनें:`,
            buttons: [
                { id: 'lang_english', title: 'English' },
                { id: 'lang_hindi', title: 'हिंदी' },
            ],
        };
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Check for exit/menu keywords to break any loop (only for users who
    // already have a language selected).
    const exitKeywords = ['menu', 'cancel', 'exit', 'stop', 'main menu', 'help', 'menue'];
    if (exitKeywords.includes(normalizedMessage)) {
        // Clear any existing flow state
        if (userFlowState[phoneNumber]) {
            delete userFlowState[phoneNumber];
        }
        return getServiceMenu(userLanguage);
    }

    // Check if user is in a form flow (waiting for input)
    if (userFlowState[phoneNumber]?.step) {
        const result = await handleFormSubmission(phoneNumber, incomingMessage, userFlowState[phoneNumber]);

        if (result.success) {
            // Clear flow state on success
            delete userFlowState[phoneNumber];

            return {
                type: 'text',
                message: result.message,
                language: result.language,
                sendFollowUpMenu: result.sendFollowUpMenu,
            };
        } else {
            return {
                type: 'buttons',
                bodyText: result.message,
                buttons: [{ id: 'menu', title: result.language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language: result.language,
                sendFollowUpMenu: result.sendFollowUpMenu,
            };
        }
    }

    // Show service menu for any other message
    return getServiceMenu(userLanguage);
}

/**
 * Handle interactive button/list responses
 */
async function handleInteractiveResponse(
    phoneNumber: string,
    interactiveId: string
): Promise<ChatbotResponse> {
    await connectDB();

    if (interactiveId === 'menu' || interactiveId === 'main_menu') {
        if (userFlowState[phoneNumber]) {
            delete userFlowState[phoneNumber];
        }
    }

    // Language selection
    if (interactiveId === 'lang_english' || interactiveId === 'lang_hindi') {
        const language = interactiveId === 'lang_english' ? 'english' : 'hindi';

        await Contact.findOneAndUpdate(
            { phoneNumber },
            { language },
            { upsert: true }
        );

        return await showDisclaimerAndContacts(phoneNumber, language);
    }

    // Main service selection
    if (interactiveId.startsWith('service_')) {
        const contact = await Contact.findOne({ phoneNumber });
        const language = contact?.language || 'english';
        return await handleServiceSelection(phoneNumber, interactiveId, language);
    }

    // Sub-service selections
    if (interactiveId.startsWith('sub_')) {
        const contact = await Contact.findOne({ phoneNumber });
        const language = contact?.language || 'english';
        return await handleSubServiceSelection(phoneNumber, interactiveId, language);
    }

    // Default: show service menu
    const contact = await Contact.findOne({ phoneNumber });
    return getServiceMenu(contact?.language || 'english');
}

/**
 * Show disclaimer and police contacts after language selection
 */
async function showDisclaimerAndContacts(
    phoneNumber: string,
    language: 'english' | 'hindi'
): Promise<ChatbotResponse> {
    const stations = await PoliceStation.find({ isActive: true }).sort({ name: 1 }).limit(60);

    let message = '';

    if (language === 'english') {
        message = `✅ *You have selected English language.*\n\nWe will provide you with information about Hazaribagh Police services in this language.\n\n`;
        message += `⚠️ *BEWARE:* Beware of unauthorized WhatsApp chatbots asking you to share your personal details, click on links, or download apps. These can be scams to defraud you. If you receive such communication, please report immediately on *1930*.\n\n`;
        message += `📋 *Disclaimer:* This WhatsApp Chatbot is only for Hazaribagh Police which is made to provide you services and resolve your queries related to Hazaribagh Police. This is a query-based information system. For urgent matters, please visit the nearest police station or call *112* or call District Control Room on *8002529348*. Please find contact numbers of police stations and other important offices below.\n\n`;
        message += `📞 *Police Station Contact Numbers:*\n\n`;

        stations.forEach((station, index) => {
            message += `${index + 1}. ${station.name} - ${station.contactNumber}\n`;
        });

        message += `\n\nPlease select a service from the menu below.`;
        message += `\n\n_Powered by DigiCraft Innovation Pvt. Ltd._`;
    } else {
        message = `✅ *आपने हिंदी भाषा का चयन किया है।*\n\nहम आपको इस भाषा में हजारीबाग पुलिस सेवाओं के बारे में जानकारी प्रदान करेंगे।\n\n`;
        message += `⚠️ *सावधान:* अनधिकृत व्हाट्सएप चैटबॉट से सावधान रहें जो आपसे व्यक्तिगत विवरण साझा करने, लिंक पर क्लिक करने या ऐप डाउनलोड करने को कहें। ये धोखाधड़ी के लिए घोटाले हो सकते हैं। यदि आपको ऐसा संदेश मिले, तो कृपया तुरंत *1930* पर रिपोर्ट करें।\n\n`;
        message += `📋 *अस्वीकरण:* यह व्हाट्सएप चैटबॉट केवल हजारीबाग पुलिस के लिए है, जो आपको सेवाएं प्रदान करने और हजारीबाग पुलिस से संबंधित आपके प्रश्नों का समाधान करने के लिए बनाया गया है। यह प्रश्न-आधारित सूचना प्रणाली है। *तत्काल* मामलों के लिए निकटतम पुलिस स्टेशन पर जाएं या *112* पर कॉल करें या जिला नियंत्रण कक्ष *8002529348* पर कॉल करें। नीचे पुलिस स्टेशनों और अन्य महत्वपूर्ण कार्यालयों के संपर्क नंबर देखें।\n\n`;
        message += `📞 *पुलिस स्टेशन संपर्क नंबर:*\n\n`;

        stations.forEach((station, index) => {
            message += `${index + 1}. ${station.nameHindi} - ${station.contactNumber}\n`;
        });

        message += `\n\nकृपया नीचे दिए गए मेनू से एक सेवा चुनें।`;
        message += `\n\n_Powered by DigiCraft Innovation Pvt. Ltd._`;
    }

    // Send disclaimer and contacts, then return service menu
    await sendWhatsAppMessage({ to: phoneNumber, text: message });

    // Return service menu
    return getServiceMenu(language);
}

/**
 * Get main service menu
 */
function getServiceMenu(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'list',
            bodyText: '*Select a Police Service*\n\nPlease choose from the options below:\n\n_Powered by DigiCraft Innovation Pvt. Ltd._',
            buttonText: 'View Services',
            sections: [
                {
                    rows: [
                        { id: 'service_passport', title: 'Passport Issues', description: 'Passport verification issues' },
                        { id: 'service_character', title: 'Character Verification', description: 'Character verification issues' },
                        { id: 'service_location', title: 'Location Service', description: 'Station locations & find PS' },
                        { id: 'service_lost_phone', title: 'Lost Mobile Phone', description: 'Report lost phone' },
                        { id: 'service_traffic', title: 'Traffic Issues', description: 'Traffic related queries' },
                        { id: 'service_cyber', title: 'Cyber Crime', description: 'Cyber crime reporting' },
                        { id: 'service_information', title: 'Information', description: 'Share actionable information' },
                        { id: 'service_suggestion', title: 'Suggestion', description: 'Suggestion related to police services' },
                        { id: 'service_change_lang', title: 'Change Language', description: 'Switch to Hindi' },
                    ],
                },
            ],
        };
    } else {
        return {
            type: 'list',
            bodyText: '*पुलिस सेवा चुनें*\n\nकृपया नीचे दिए गए विकल्पों में से चुनें:\n\n_Powered by DigiCraft Innovation Pvt. Ltd._',
            buttonText: 'सेवाएं देखें',
            sections: [
                {
                    rows: [
                        { id: 'service_passport', title: 'पासपोर्ट समस्याएं', description: 'पासपोर्ट सत्यापन समस्याएं' },
                        { id: 'service_character', title: 'चरित्र सत्यापन', description: 'चरित्र सत्यापन समस्याएं' },
                        { id: 'service_location', title: 'स्थान सेवा', description: 'स्टेशन स्थान व थाना खोजें' },
                        { id: 'service_lost_phone', title: 'खोया मोबाइल फोन', description: 'खोया फोन रिपोर्ट करें' },
                        { id: 'service_traffic', title: 'यातायात समस्याएं', description: 'यातायात संबंधी प्रश्न' },
                        { id: 'service_cyber', title: 'साइबर अपराध', description: 'साइबर अपराध रिपोर्टिंग' },
                        { id: 'service_information', title: 'सूचना', description: 'कार्रवाई योग्य सूचना साझा करें' },
                        { id: 'service_suggestion', title: 'सुझाव', description: 'पुलिस सेवाओं से संबंधित सुझाव' },
                        { id: 'service_change_lang', title: 'भाषा बदलें', description: 'अंग्रेजी में स्विच करें' },
                    ],
                },
            ],
        };
    }
}

/**
 * Handle main service selection
 */
async function handleServiceSelection(
    phoneNumber: string,
    serviceId: string,
    language: 'english' | 'hindi'
): Promise<ChatbotResponse> {
    // Language change
    if (serviceId === 'service_change_lang') {
        return {
            type: 'buttons',
            bodyText: language === 'english'
                ? 'Switch to Hindi?\n\nहिंदी में बदलें?'
                : 'Switch to English?\n\nअंग्रेजी में बदलें?',
            buttons: [
                {
                    id: language === 'english' ? 'lang_hindi' : 'lang_english',
                    title: language === 'english' ? 'हिंदी' : 'English'
                },
            ],
        };
    }

    // Show sub-menus for each service
    switch (serviceId) {
        case 'service_passport':
            return getPassportSubMenu(language);
        case 'service_character':
            return getCharacterSubMenu(language);
        case 'service_location':
            return getLocationSubMenu(language);
        case 'service_lost_phone':
            return getLostPhoneSubMenu(language);
        case 'service_traffic':
            return getTrafficSubMenu(language);
        case 'service_cyber':
            return getCyberSubMenu(language);
        case 'service_information':
            return getInformationSubMenu(language);
        case 'service_suggestion':
            userFlowState[phoneNumber] = { step: 'suggestion_form' };
            return getSuggestionForm(language);
        default:
            return getServiceMenu(language);
    }
}

/**
 * Passport sub-menu
 */
function getPassportSubMenu(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'list',
            bodyText: '*Passport Related Issues*\n\nSelect your issue:',
            buttonText: 'Select Issue',
            sections: [
                {
                    title: 'Options',
                    rows: [
                        { id: 'sub_passport_delay', title: 'Delay in Verification', description: 'Police verification is delayed' },
                        { id: 'sub_passport_other', title: 'Other Issues', description: 'Other passport related issues' },
                    ],
                },
                {
                    title: 'Navigation',
                    rows: [
                        { id: 'menu', title: '↩ Main Menu', description: 'Return to main service menu' },
                    ],
                },
            ],
        };
    } else {
        return {
            type: 'list',
            bodyText: '*पासपोर्ट संबंधी समस्याएं*\n\nअपनी समस्या चुनें:',
            buttonText: 'समस्या चुनें',
            sections: [
                {
                    title: 'विकल्प',
                    rows: [
                        { id: 'sub_passport_delay', title: 'सत्यापन में देरी', description: 'पुलिस सत्यापन में देरी हो रही है' },
                        { id: 'sub_passport_other', title: 'अन्य समस्याएं', description: 'अन्य पासपोर्ट संबंधी समस्याएं' },
                    ],
                },
                {
                    title: 'नेविगेशन',
                    rows: [
                        { id: 'menu', title: '↩ मुख्य मेनू', description: 'मुख्य सेवा मेनू पर वापस जाएं' },
                    ],
                },
            ],
        };
    }
}

/**
 * Character verification sub-menu
 */
function getCharacterSubMenu(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'list',
            bodyText: '*Character Verification Issues*\n\nSelect your issue:',
            buttonText: 'Select Issue',
            sections: [
                {
                    title: 'Options',
                    rows: [
                        { id: 'sub_character_delay', title: 'Delay in Verification', description: 'Police verification is delayed' },
                        { id: 'sub_character_other', title: 'Other Issues', description: 'Other verification issues' },
                    ],
                },
                {
                    title: 'Navigation',
                    rows: [
                        { id: 'menu', title: '↩ Main Menu', description: 'Return to main service menu' },
                    ],
                },
            ],
        };
    } else {
        return {
            type: 'list',
            bodyText: '*चरित्र सत्यापन समस्याएं*\n\nअपनी समस्या चुनें:',
            buttonText: 'समस्या चुनें',
            sections: [
                {
                    title: 'विकल्प',
                    rows: [
                        { id: 'sub_character_delay', title: 'सत्यापन में देरी', description: 'पुलिस सत्यापन में देरी हो रही है' },
                        { id: 'sub_character_other', title: 'अन्य समस्याएं', description: 'अन्य सत्यापन समस्याएं' },
                    ],
                },
                {
                    title: 'नेविगेशन',
                    rows: [
                        { id: 'menu', title: '↩ मुख्य मेनू', description: 'मुख्य सेवा मेनू पर वापस जाएं' },
                    ],
                },
            ],
        };
    }
}

/**
 * Location-based services (PDF Section D): GPS nearest PS or submit place details.
 */
function getLocationSubMenu(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'list',
            bodyText:
                '*Location-based services*\n\nYou can find police station locations in Hazaribagh district on Google Maps using coordinates published by the district. Choose an option below:',
            buttonText: 'Select Option',
            sections: [
                {
                    title: 'Options',
                    rows: [
                        {
                            id: 'sub_location_gps',
                            title: 'Nearest PS (GPS)',
                            description: 'Share location to find nearest station',
                        },
                        {
                            id: 'sub_location_find_station',
                            title: 'Find my Police Station',
                            description: 'Submit name, address & place name',
                        },
                    ],
                },
                {
                    title: 'Navigation',
                    rows: [{ id: 'menu', title: '↩ Main Menu', description: 'Return to main service menu' }],
                },
            ],
        };
    }
    return {
        type: 'list',
        bodyText:
            '*स्थान आधारित सेवाएं*\n\nहजारीबाग जिले में पुलिस स्टेशनों के स्थान जिला द्वारा जारी निर्देशांक से Google Maps पर देखे जा सकते हैं। नीचे एक विकल्प चुनें:',
        buttonText: 'विकल्प चुनें',
        sections: [
            {
                title: 'विकल्प',
                rows: [
                    {
                        id: 'sub_location_gps',
                        title: 'निकटतम थाना (GPS)',
                        description: 'स्थान साझा कर निकटतम स्टेशन खोजें',
                    },
                    {
                        id: 'sub_location_find_station',
                        title: 'मेरा पुलिस स्टेशन खोजें',
                        description: 'नाम, पता व स्थान का नाम भेजें',
                    },
                ],
            },
            {
                title: 'नेविगेशन',
                rows: [{ id: 'menu', title: '↩ मुख्य मेनू', description: 'मुख्य सेवा मेनू पर वापस जाएं' }],
            },
        ],
    };
}

/**
 * Location service - request user's location then find nearest station
 */
async function getLocationService(phoneNumber: string, language: 'english' | 'hindi'): Promise<ChatbotResponse> {
    userFlowState[phoneNumber] = { step: 'awaiting_location' };

    // Send location request button
    const { sendLocationRequest } = await import('./whatsapp');

    const bodyText = language === 'english'
        ? `📍 *Find Your Nearest Police Station (GPS)*\n\nGo to https://maps.google.com and use published grid references to open any station. To find the *closest* station to you, share your live location using the button below.\n\nYour location is used only to find the nearest station in Hazaribagh district.`
        : `📍 *अपना निकटतम पुलिस स्टेशन (GPS)*\n\nhttps://maps.google.com पर जाकर प्रकाशित निर्देशांक से कोई भी स्टेशन खोल सकते हैं। *अपने निकटतम* स्टेशन के लिए नीचे दिए बटन से अपना लाइव स्थान साझा करें।\n\nआपका स्थान केवल हजारीबाग जिले में निकटतम स्टेशन खोजने के लिए उपयोग किया जाएगा।`;

    await sendLocationRequest({
        to: phoneNumber,
        bodyText,
    });

    // Return a confirmation that button was sent
    return {
        type: 'text',
        message: language === 'english'
            ? '📍 Please click the "Send Location" button above to share your location.'
            : '📍 कृपया अपना स्थान साझा करने के लिए ऊपर "स्थान भेजें" बटन पर क्लिक करें।',
        language,
        // No followUpMenu here — we're still waiting for the user's location pin
    };
}

/**
 * Lost phone sub-menu
 */
function getLostPhoneSubMenu(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'list',
            bodyText: '*Lost Mobile Phone*\n\nSelect your option:',
            buttonText: 'Select Option',
            sections: [
                {
                    title: 'Options',
                    rows: [
                        { id: 'sub_lost_mobile', title: 'Report Lost Phone', description: 'Visit CEIR Portal to report' },
                        { id: 'sub_lost_mobile_not_satisfied', title: 'Not Satisfied', description: 'Not satisfied with police action' },
                    ],
                },
                {
                    title: 'Navigation',
                    rows: [
                        { id: 'menu', title: '↩ Main Menu', description: 'Return to main service menu' },
                    ],
                },
            ],
        };
    } else {
        return {
            type: 'list',
            bodyText: '*खोया मोबाइल फोन*\n\nअपना विकल्प चुनें:',
            buttonText: 'विकल्प चुनें',
            sections: [
                {
                    title: 'विकल्प',
                    rows: [
                        { id: 'sub_lost_mobile', title: 'खोया फोन रिपोर्ट करें', description: 'CEIR पोर्टल पर रिपोर्ट करें' },
                        { id: 'sub_lost_mobile_not_satisfied', title: 'संतुष्ट नहीं', description: 'पुलिस कार्रवाई से संतुष्ट नहीं' },
                    ],
                },
                {
                    title: 'नेविगेशन',
                    rows: [
                        { id: 'menu', title: '↩ मुख्य मेनू', description: 'मुख्य सेवा मेनू पर वापस जाएं' },
                    ],
                },
            ],
        };
    }
}

/**
 * Traffic sub-menu
 */
function getTrafficSubMenu(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'list',
            bodyText: '*Traffic Related Issues*\n\nSelect your query:',
            buttonText: 'Select Query',
            sections: [
                {
                    title: 'Options',
                    rows: [
                        { id: 'sub_traffic_rules', title: 'Rules & Penalties', description: 'Know about violations & fines' },
                        { id: 'sub_traffic_jam', title: 'Report Traffic Jam', description: 'Report traffic congestion' },
                        { id: 'sub_traffic_challan', title: 'Traffic Challan Issues', description: 'Challan related queries' },
                        { id: 'sub_traffic_other', title: 'Other Issues', description: 'Other traffic issues' },
                    ],
                },
                {
                    title: 'Navigation',
                    rows: [
                        { id: 'menu', title: '↩ Main Menu', description: 'Return to main service menu' },
                    ],
                },
            ],
        };
    } else {
        return {
            type: 'list',
            bodyText: '*यातायात संबंधी समस्याएं*\n\nअपना प्रश्न चुनें:',
            buttonText: 'प्रश्न चुनें',
            sections: [
                {
                    title: 'विकल्प',
                    rows: [
                        { id: 'sub_traffic_rules', title: 'यातायात नियम/जुर्माना', description: 'उल्लंघन और जुर्माने के बारे में जानें' },
                        { id: 'sub_traffic_jam', title: 'ट्रैफ़िक जाम रिपोर्ट', description: 'यातायात भीड़ की रिपोर्ट करें' },
                        { id: 'sub_traffic_challan', title: 'ट्रैफ़िक चालान मुद्दे', description: 'चालान संबंधी प्रश्न' },
                        { id: 'sub_traffic_other', title: 'अन्य समस्याएं', description: 'अन्य यातायात समस्याएं' },
                    ],
                },
                {
                    title: 'नेविगेशन',
                    rows: [
                        { id: 'menu', title: '↩ मुख्य मेनू', description: 'मुख्य सेवा मेनू पर वापस जाएं' },
                    ],
                },
            ],
        };
    }
}

/**
 * Cyber sub-menu
 */
function getCyberSubMenu(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'list',
            bodyText: '*Cyber Crime*\n\nSelect your issue:',
            buttonText: 'Select Issue',
            sections: [
                {
                    title: 'Options',
                    rows: [
                        { id: 'sub_cyber', title: 'Report Cyber Crime', description: 'Visit cybercrime.gov.in to report' },
                        { id: 'sub_cyber_other', title: 'Other Issues', description: 'Other cyber-related issues' },
                    ],
                },
                {
                    title: 'Navigation',
                    rows: [
                        { id: 'menu', title: '↩ Main Menu', description: 'Return to main service menu' },
                    ],
                },
            ],
        };
    } else {
        return {
            type: 'list',
            bodyText: '*साइबर अपराध*\n\nअपनी समस्या चुनें:',
            buttonText: 'समस्या चुनें',
            sections: [
                {
                    title: 'विकल्प',
                    rows: [
                        { id: 'sub_cyber', title: 'साइबर अपराध रिपोर्ट', description: 'cybercrime.gov.in पर रिपोर्ट करें' },
                        { id: 'sub_cyber_other', title: 'अन्य समस्याएं', description: 'अन्य साइबर संबंधी मुद्दे' },
                    ],
                },
                {
                    title: 'नेविगेशन',
                    rows: [
                        { id: 'menu', title: '↩ मुख्य मेनू', description: 'मुख्य सेवा मेनू पर वापस जाएं' },
                    ],
                },
            ],
        };
    }
}

/**
 * Information sub-menu
 */
function getInformationSubMenu(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'list',
            bodyText: '*Information*\n\nSelect the type of information you want to share:',
            buttonText: 'Select Type',
            sections: [
                {
                    title: 'Options',
                    rows: [
                        { id: 'sub_info_extortion', title: 'Extortion related information', description: 'अड़ेबाजी से संबंधित जानकारी' },
                        { id: 'sub_info_misbehavior', title: 'Harassment related information', description: 'छेड़खानी से संबंधित जानकारी' },
                        { id: 'sub_info_drugs', title: 'Drug / intoxication related information', description: 'नशाखोरी/ड्रग्स से संबंधित जानकारी' },
                        { id: 'sub_info_absconders', title: 'Absconding criminals related information', description: 'फरार अपराधियों से संबंधित जानकारी' },
                        { id: 'sub_info_illegal', title: 'Other illegal activities related information', description: 'अन्य अवैध गतिविधियों से संबंधित जानकारी' },
                        { id: 'sub_info_other', title: 'Any other information', description: 'कोई अन्य सूचना' },
                    ],
                },
                {
                    title: 'Navigation',
                    rows: [{ id: 'menu', title: '↩ Main Menu', description: 'Return to main service menu' }],
                },
            ],
        };
    }

    return {
        type: 'list',
        bodyText: '*सूचना*\n\nआप किस प्रकार की सूचना साझा करना चाहते हैं, चुनें:',
        buttonText: 'प्रकार चुनें',
        sections: [
            {
                title: 'विकल्प',
                rows: [
                    { id: 'sub_info_extortion', title: 'अड़ेबाजी से संबंधित जानकारी', description: 'अड़ेबाजी संबंधी सूचना दें' },
                    { id: 'sub_info_misbehavior', title: 'छेड़खानी से संबंधित जानकारी', description: 'छेड़खानी संबंधी सूचना दें' },
                    { id: 'sub_info_drugs', title: 'नशाखोरी/ड्रग्स से संबंधित जानकारी', description: 'नशाखोरी/ड्रग्स की सूचना दें' },
                    { id: 'sub_info_absconders', title: 'फरार अपराधियों से संबंधित जानकारी', description: 'फरार अपराधियों की सूचना दें' },
                    { id: 'sub_info_illegal', title: 'अन्य अवैध गतिविधियों से संबंधित जानकारी', description: 'अवैध गतिविधियों की सूचना दें' },
                    { id: 'sub_info_other', title: 'कोई अन्य सूचना', description: 'अन्य महत्वपूर्ण सूचना दें' },
                ],
            },
            {
                title: 'नेविगेशन',
                rows: [{ id: 'menu', title: '↩ मुख्य मेनू', description: 'मुख्य सेवा मेनू पर वापस जाएं' }],
            },
        ],
    };
}

/**
 * Suggestion form
 */
/**
 * Suggestion/Review form
 */
function getSuggestionForm(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'buttons',
            bodyText: `💡 *Suggestion*\n\nIf you have any suggestion related to the police, please reply (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Your Suggestion\n\n*Example:*\nRahul Kumar\nSunil Kumar\nWard 3, Sadar, Hazaribagh\n9876543210\nSadar P.S.\nMore community outreach programmes in rural areas.\n\nPlease reply with all details.`,
            buttons: [{ id: 'menu', title: 'Main Menu' }],
            language,
        };
    } else {
        return {
            type: 'buttons',
            bodyText: `💡 *सुझाव*\n\nयदि आपके पास पुलिस से संबंधित कोई सुझाव है, कृपया प्रति पंक्ति एक विवरण भेजें:\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* आपका सुझाव\n\n*उदाहरण:*\nराहुल कुमार\nसुनील कुमार\nवार्ड 3, सदर, हजारीबाग\n9876543210\nसदर थाना\nग्रामीण क्षेत्रों में अधिक जन-संपर्क कार्यक्रम चाहिए।\n\nकृपया सभी विवरण भेजें।`,
            buttons: [{ id: 'menu', title: 'मुख्य मेनू' }],
            language,
        };
    }
}

/**
 * Handle sub-service selections
 */
async function handleSubServiceSelection(
    phoneNumber: string,
    subServiceId: string,
    language: 'english' | 'hindi'
): Promise<ChatbotResponse> {
    // Set flow state for form collection
    userFlowState[phoneNumber] = { step: subServiceId };

    // GPS nearest PS (overrides step to awaiting_location inside getLocationService)
    if (subServiceId === 'sub_location_gps') {
        return await getLocationService(phoneNumber, language);
    }

    // Handle traffic rules separately (it returns ChatbotResponse)
    if (subServiceId === 'sub_traffic_rules') {
        return await getTrafficRulesInfo(language);
    }

    // Handle "Report Lost Mobile" — redirect to CEIR portal, do NOT collect a form
    if (subServiceId === 'sub_lost_mobile') {
        // Clear flow state so no form submission is expected
        delete userFlowState[phoneNumber];

        const ceirMessage = language === 'english'
            ? `📱 *Report Lost Mobile Phone*\n\nTo report a lost mobile phone please visit *www.ceir.gov.in*. We will get your request from there and inform you as soon as your mobile is found.\n\n🔗 *CEIR Portal:* https://www.ceir.gov.in\n\nOn the CEIR portal you can block your lost/stolen phone, track status, and unblock when recovered.\n\n⚠️ _Lost mobile reporting is not done through this chatbot — please use the CEIR portal directly._`
            : `📱 *खोया मोबाइल फोन रिपोर्ट*\n\nखोए मोबाइल की रिपोर्ट के लिए कृपया *www.ceir.gov.in* पर जाएं। वहां से आपका अनुरोध प्राप्त होगा और मोबाइल मिलने पर सूचित किया जाएगा।\n\n🔗 *CEIR पोर्टल:* https://www.ceir.gov.in\n\n⚠️ _इस चैटबॉट से सीधे रिपोर्ट दर्ज नहीं होती — कृपया CEIR पोर्टल का उपयोग करें।_`;

        return {
            type: 'buttons',
            bodyText: ceirMessage,
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
            sendFollowUpMenu: false,
        };
    }

    // Handle "Report Cyber Crime" — redirect to cybercrime.gov.in / helpline 1930, do NOT collect a form
    if (subServiceId === 'sub_cyber') {
        // Clear flow state so no form submission is expected
        delete userFlowState[phoneNumber];

        const cyberMessage = language === 'english'
            ? `💻 *Report Cyber Crime*\n\nTo learn about types of cyber fraud, visit:\n🔗 https://cybercrime.gov.in/Webform/Accept.aspx — open *"Learn about cyber-crimes"*.\n\nTo report: call *1930* or visit the Cyber Police Station.\n📞 *Cyber Police Station:* 9430165939\n📍 *Location:* https://www.google.com/maps?q=23.997447,85.364978\n\n🔗 *National portal:* https://cybercrime.gov.in\n\n⚠️ _Cyber crime reporting is not completed inside this chatbot — use 1930, the portal, or visit Cyber PS._`
            : `💻 *साइबर अपराध रिपोर्ट*\n\nसाइबर धोखाधड़ी के प्रकार जानने के लिए:\n🔗 https://cybercrime.gov.in/Webform/Accept.aspx — *"Learn about cyber-crimes"* खोलें।\n\nरिपोर्ट के लिए: *1930* पर कॉल करें या साइबर पुलिस स्टेशन जाएं।\n📞 *साइबर पुलिस स्टेशन:* 9430165939\n📍 *स्थान:* https://www.google.com/maps?q=23.997447,85.364978\n\n🔗 *राष्ट्रीय पोर्टल:* https://cybercrime.gov.in\n\n⚠️ _इस चैटबॉट के अंदर पूरी रिपोर्ट दर्ज नहीं होती — 1930, पोर्टल या साइबर थाना का उपयोग करें।_`;

        return {
            type: 'buttons',
            bodyText: cyberMessage,
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
            sendFollowUpMenu: false,
        };
    }

    // Show appropriate form based on sub-service
    const formMessages: Record<string, { english: string; hindi: string }> = {
        sub_passport_delay: {
            english: `📝 *Passport — Delay in Police Verification*\n\nPlease provide (one per line):\n\n*Line 1:* Name of Applicant\n*Line 2:* Passport Application Number\n*Line 3:* Remarks\n\n*Example:*\nRahul Kumar\nAB1234567\nVerification pending since 2 months\n\nPlease reply with all details.`,
            hindi: `📝 *पासपोर्ट — पुलिस सत्यापन में देरी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* पासपोर्ट आवेदन संख्या\n*पंक्ति 3:* टिप्पणी\n\n*उदाहरण:*\nराहुल कुमार\nAB1234567\n2 महीने से सत्यापन लंबित\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_passport_other: {
            english: `📝 *Passport — Other Issues*\n\nPlease provide (one per line):\n\n*Line 1:* Name of Applicant\n*Line 2:* Passport Application Number\n*Line 3:* Report issue\n\n*Example:*\nPriya Sharma\nCD9876543\nDocument submission issue at the PSK\n\nPlease reply with details.`,
            hindi: `📝 *पासपोर्ट — अन्य समस्याएं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* पासपोर्ट आवेदन संख्या\n*पंक्ति 3:* समस्या विवरण\n\n*उदाहरण:*\nप्रिया शर्मा\nCD9876543\nपीएसके पर दस्तावेज जमा करने में समस्या\n\nकृपया विवरण के साथ उत्तर दें।`,
        },
        sub_character_delay: {
            english: `📝 *Character Verification — Delay*\n\nPlease provide (one per line):\n\n*Line 1:* Name of Applicant\n*Line 2:* Character Verification Application Number\n*Line 3:* Remarks\n\n*Example:*\nSunil Verma\nCH12345\nVerification is delayed by 15 days\n\nPlease reply with all details.`,
            hindi: `📝 *चरित्र सत्यापन — देरी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* चरित्र सत्यापन आवेदन संख्या\n*पंक्ति 3:* टिप्पणी\n\n*उदाहरण:*\nसुनील वर्मा\nCH12345\nसत्यापन 15 दिनों से लंबित है\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_character_other: {
            english: `📝 *Character Verification — Other Issues*\n\nPlease provide (one per line):\n\n*Line 1:* Name of Applicant\n*Line 2:* Character Application Number\n*Line 3:* Report issue\n\n*Example:*\nSunil Verma\nCH12345\nName is misspelled in the application\n\nPlease reply with details.`,
            hindi: `📝 *चरित्र सत्यापन — अन्य समस्याएं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* चरित्र आवेदन संख्या\n*पंक्ति 3:* समस्या विवरण\n\n*उदाहरण:*\nसुनील वर्मा\nCH12345\nआवेदन में नाम की वर्तनी गलत है\n\nकृपया विवरण के साथ उत्तर दें।`,
        },
        sub_petition_not_visited: {
            english: `📝 *Police Did Not Visit - Petition*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Issue Details\n\n*Example:*\nAmit Singh\nRakesh Singh\nWard 5, Hazaribagh\n9876543210\nHazaribagh Sadar Thana\nPolice did not visit regarding my petition filed 5 days ago\n\nPlease reply with all details.`,
            hindi: `📝 *पुलिस नहीं आई - याचिका*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nअमित सिंह\nराकेश सिंह\nवार्ड 5, हजारीबाग\n9876543210\nहजारीबाग सदर थाना\n5 दिन पहले दायर याचिका के संबंध में पुलिस नहीं आई\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_petition_not_satisfied: {
            english: `📝 *Not Satisfied with Police Response*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Police Station\n*Line 6:* Reason for Dissatisfaction\n\n*Example:*\nVikash Yadav\nSuresh Yadav\nBarkagaon, Hazaribagh\n9876543211\nBarkagaon Thana\nThe investigation was closed without taking my statement\n\nPlease reply with all details.`,
            hindi: `📝 *पुलिस की प्रतिक्रिया से संतुष्ट नहीं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* पुलिस स्टेशन\n*पंक्ति 6:* असंतोष का कारण\n\n*उदाहरण:*\nविकाश यादव\nसुरेश यादव\nबरकागांव, हजारीबाग\n9876543211\nबरकागांव थाना\nमेरा बयान लिए बिना जांच बंद कर दी गई\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_petition_other: {
            english: `📝 *Other Petition Issues*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Police Station\n*Line 6:* Issue Details\n\n*Example:*\nNeha Kumari\nManoj Prasad\nKorra, Hazaribagh\n9876543212\nKorra P.S.\nNeed an update on the status of my petition\n\nPlease reply with all details.`,
            hindi: `📝 *अन्य याचिका समस्याएं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* पुलिस स्टेशन\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nनेहा कुमारी\nमनोज प्रसाद\nकोर्रा, हजारीबाग\n9876543212\nकोर्रा थाना\nमुझे अपनी याचिका की स्थिति का अपडेट चाहिए\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_location_find_station: {
            english: `📍 *Find my Police Station*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Report your place name\n\n*Example:*\nAmit Singh\nRakesh Singh\nPelawal area, Hazaribagh\n9876543210\nNear Pelawal OP main road\n\nPlease reply with all details.`,
            hindi: `📍 *मेरा पुलिस स्टेशन खोजें*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* अपने स्थान का नाम लिखें\n\n*उदाहरण:*\nअमित सिंह\nराकेश सिंह\nपेलावल क्षेत्र, हजारीबाग\n9876543210\nपेलावल ओपी मुख्य सड़क के पास\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_traffic_jam: {
            english: `🚦 *Report Traffic Jam*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Traffic Jam Location\n*Line 4:* Remarks\n\n*Example:*\nRajeev Kumar\n9876543213\nTower Chowk\nHeavy traffic congestion for the last hour\n\nPlease reply with all details.`,
            hindi: `🚦 *ट्रैफ़िक जाम रिपोर्ट*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* ट्रैफ़िक जाम का स्थान\n*पंक्ति 4:* टिप्पणी\n\n*उदाहरण:*\nराजीव कुमार\n9876543213\nटावर चौक\nपिछले एक घंटे से भारी ट्रैफ़िक जाम है\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_traffic_challan: {
            english: `🚦 *Traffic Challan Issues*\n\nYou can submit challan online at *https://echallan.parivahan.gov.in* or visit Traffic Police Station.\n📞 Traffic Police Station: *9939257628*\n📍 https://www.google.com/maps?q=23.998764,85.365657\n\nTo report other challan-related issues, reply (one per line):\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Challan Number\n*Line 6:* Report issue\n\n*Example:*\nSanjay Gupta\nRamesh Gupta\nSadar, Hazaribagh\n9876543214\nJH12345678\nI was wearing a helmet but still received a challan\n\nPlease reply with all details.`,
            hindi: `🚦 *ट्रैफ़िक चालान मुद्दे*\n\nचालान ऑनलाइन *https://echallan.parivahan.gov.in* पर जमा करें या ट्रैफ़िक पुलिस स्टेशन जाएं।\n📞 ट्रैफ़िक पुलिस स्टेशन: *9939257628*\n📍 https://www.google.com/maps?q=23.998764,85.365657\n\nअन्य चालान संबंधी समस्या के लिए (प्रति पंक्ति एक):\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* चालान नंबर\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nसंजय गुप्ता\nरमेश गुप्ता\nसदर, हजारीबाग\n9876543214\nJH12345678\nहेलमेट पहनने के बावजूद चालान कट गया\n\nकृपया सभी विवरण भेजें।`,
        },
        sub_traffic_other: {
            english: `🚦 *Other Traffic Issues*\n\nPlease provide (one per line):\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Report issue\n\n*Example:*\nPooja Dey\nAmit Dey\nCharhi, Hazaribagh\n9876543215\nO/C Traffic / Sadar P.S.\nTraffic light not working at Bajrangbali Chowk\n\nPlease reply with all details.`,
            hindi: `🚦 *अन्य यातायात समस्याएं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nपूजा डे\nअमित डे\nचरही, हजारीबाग\n9876543215\nO/C ट्रैफिक / सदर थाना\nबजरंगबली चौक पर ट्रैफिक लाइट खराब है\n\nकृपया सभी विवरण भेजें।`,
        },
        // sub_lost_mobile is handled separately above — redirects to CEIR portal
        sub_lost_mobile_not_satisfied: {
            english: `📱 *Not Satisfied with Police Action*\n\nIf you're not satisfied with police action on your lost mobile, please reply with:\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Lost Mobile Number\n*Line 6:* Concerned Police Station\n\n*Example:*\nSanjay Sharma\nRahul Sharma\nSadar, Hazaribagh\n9876543210\n9876543211\nHazaribagh Sadar Thana\n\nPlease reply with all details.`,
            hindi: `📱 *पुलिस कार्रवाई से संतुष्ट नहीं*\n\nयदि आप पुलिस कार्रवाई से संतुष्ट नहीं हैं, तो कृपया निम्नलिखित के साथ उत्तर दें:\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* खोया मोबाइल नंबर\n*पंक्ति 6:* संबंधित पुलिस स्टेशन\n\n*उदाहरण:*\nसंजय शर्मा\nराहुल शर्मा\nसदर, हजारीबाग\n9876543210\n9876543211\nहजारीबाग सदर थाना\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        // sub_cyber is handled separately above — redirects to cybercrime.gov.in / helpline 1930
        sub_cyber_other: {
            english: `💻 *Other Cyber Issues*\n\nIf you have other cyber-related issues, please reply with:\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Report issue\n\n*Example:*\nKamal Roy\nBijay Roy\nSadar, Hazaribagh\n9876543210\nCyber P.S.\nQuery regarding social media account hack\n\nPlease reply with details.`,
            hindi: `💻 *अन्य साइबर मुद्दे*\n\nयदि आपके पास अन्य साइबर संबंधी मुद्दे हैं, तो कृपया उत्तर दें:\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nकमल रॉय\nबिजय रॉय\nसदर, हजारीबाग\n9876543210\nसाइबर पीएस\nसोशल मीडिया अकाउंट हैक के संबंध में प्रश्न\n\nकृपया विवरण के साथ उत्तर दें।`,
        },
        sub_info_extortion: {
            english: `ℹ️ *Extortion Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Information details\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *अड़ेबाजी से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* सूचना का विवरण\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_misbehavior: {
            english: `ℹ️ *Harassment Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Information details\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *छेड़खानी से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* सूचना का विवरण\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_drugs: {
            english: `ℹ️ *Drug / Intoxication Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Information details\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *नशाखोरी/ड्रग्स से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* सूचना का विवरण\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_absconders: {
            english: `ℹ️ *Absconding Criminals Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Information details\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *फरार अपराधियों से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* सूचना का विवरण\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_illegal: {
            english: `ℹ️ *Other Illegal Activities Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Information details\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *अन्य अवैध गतिविधियों से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* सूचना का विवरण\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_other: {
            english: `ℹ️ *Any Other Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Information details\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *कोई अन्य सूचना*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* सूचना का विवरण\n\nकृपया पूरी जानकारी भेजें।`,
        },
    };

    const message = formMessages[subServiceId];
    if (!message) {
        return getServiceMenu(language);
    }

    return {
        type: 'buttons',
        bodyText: message[language],
        buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
        language,
    };
}

/**
 * Get traffic rules and penalties from database
 */
async function getTrafficRulesInfo(language: 'english' | 'hindi'): Promise<ChatbotResponse> {
    const violations = await TrafficViolation.find({ isActive: true }).sort({ section: 1 });

    let message = '';

    if (language === 'english') {
        message = `🚦 *Traffic Rules & Penalties*\n\n`;
        
        message += `*Most Common Violations & Fines:*\n`;
        message += `1. Without Helmet (Sec 194D) - ₹1,000\n`;
        message += `2. Without Seat Belt (Sec 194B) - ₹1,000\n`;
        message += `3. Without License (Sec 181) - ₹5,000\n`;
        message += `4. Without Insurance (Sec 196) - ₹2,000\n`;
        message += `5. Over-speeding (Sec 183) - ₹1,000 to ₹2,000\n`;
        message += `6. Drunk Driving (Sec 185) - ₹10,000\n\n`;

        if (violations && violations.length > 0) {
            message += `*Other Motor Vehicle Act Violations:*\n\n`;
            violations.forEach((v) => {
                message += `• *${v.crime}*\n`;
                message += `   Section: ${v.section}\n`;
                message += `   Penalty: ₹${v.penalty.toLocaleString()}\n\n`;
            });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        message += `\n📞 Traffic Police Station (O/C Traffic): 9939257628\n`;
        message += `📍 Location: https://www.google.com/maps?q=23.998764,85.365657\n\n`;
        message += `_Common offences & penalties: Motor Vehicles (Amendment) Act, 2019 — also amended by Jharkhand Government (effective dates as notified)._\n\n`;
        message += `*Important Acts & Laws (Click to View):*\n`;
        message += `• Central Motor Vehicle Act, 1988:\n  🔗 ${baseUrl}/Moter%20Vehical/CENTRAL%20MOTOR%20VEHICLE%20ACT%201988.pdf\n`;
        message += `• Jharkhand MV (Amendment) Rules, 2021:\n  🔗 ${baseUrl}/Moter%20Vehical/Jharkhand_Motor_Vehicle_(amendment)Rule%2C2021.pdf\n`;
        message += `• Motor Vehicle Driving Regulation 2017:\n  🔗 ${baseUrl}/Moter%20Vehical/MOTOR%20VEHICLE%20DRIVING%20REGULATION%202017.pdf\n`;
        message += `• Road Safety Question Bank:\n  🔗 ${baseUrl}/Moter%20Vehical/ROAD%20SAFETY%20QUESTION%20BANK.pdf\n`;
        message += `• Road Safety Signage & Signs:\n  🔗 ${baseUrl}/Moter%20Vehical/ROAD%20SAFETY%20SIGNAGE%20AND%20SIGNS.pdf\n`;
    } else {
        message = `🚦 *यातायात नियम और जुर्माना*\n\n`;
        
        message += `*सबसे आम उल्लंघन और जुर्माना:*\n`;
        message += `1. बिना हेलमेट के (धारा 194D) - ₹1,000\n`;
        message += `2. बिना सीट बेल्ट के (धारा 194B) - ₹1,000\n`;
        message += `3. बिना लाइसेंस के (धारा 181) - ₹5,000\n`;
        message += `4. बिना बीमा के (धारा 196) - ₹2,000\n`;
        message += `5. ओवर-स्पीडिंग (धारा 183) - ₹1,000 से ₹2,000\n`;
        message += `6. शराब पीकर गाड़ी चलाना (धारा 185) - ₹10,000\n\n`;

        if (violations && violations.length > 0) {
            message += `*अन्य मोटर वाहन अधिनियम उल्लंघन:*\n\n`;
            violations.forEach((v) => {
                message += `• *${v.crimeHindi}*\n`;
                message += `   धारा: ${v.section}\n`;
                message += `   जुर्माना: ₹${v.penalty.toLocaleString()}\n\n`;
            });
        }

        const baseUrlHi = process.env.NEXT_PUBLIC_BASE_URL || '';
        message += `\n📞 ट्रैफ़िक पुलिस स्टेशन (O/C ट्रैफिक): 9939257628\n`;
        message += `📍 स्थान: https://www.google.com/maps?q=23.998764,85.365657\n\n`;
        message += `_सामान्य अपराध व दंड: मोटर वाहन (संशोधन) अधिनियम, 2019 — झारखंड सरकार द्वारा अधिसूचित संशोधन लागू।_\n\n`;
        message += `*महत्वपूर्ण अधिनियम और कानून (देखने के लिए क्लिक करें):*\n`;
        message += `• केंद्रीय मोटर वाहन अधिनियम, 1988:\n  🔗 ${baseUrlHi}/Moter%20Vehical/CENTRAL%20MOTOR%20VEHICLE%20ACT%201988.pdf\n`;
        message += `• झारखंड मोटर वाहन (संशोधन) नियम, 2021:\n  🔗 ${baseUrlHi}/Moter%20Vehical/Jharkhand_Motor_Vehicle_(amendment)Rule%2C2021.pdf\n`;
        message += `• मोटर वाहन ड्राइविंग विनियम 2017:\n  🔗 ${baseUrlHi}/Moter%20Vehical/MOTOR%20VEHICLE%20DRIVING%20REGULATION%202017.pdf\n`;
        message += `• सड़क सुरक्षा प्रश्न बैंक:\n  🔗 ${baseUrlHi}/Moter%20Vehical/ROAD%20SAFETY%20QUESTION%20BANK.pdf\n`;
        message += `• सड़क सुरक्षा चिह्न और संकेत:\n  🔗 ${baseUrlHi}/Moter%20Vehical/ROAD%20SAFETY%20SIGNAGE%20AND%20SIGNS.pdf\n`;
    }

    return {
        type: 'text',
        message,
        language,
        sendFollowUpMenu: true,  // traffic rules is a read-only info page → cycle ends
    };
}

/**
 * Send chatbot response to WhatsApp
 */
export async function sendChatbotResponse(
    phoneNumber: string,
    response: ChatbotResponse
) {
    if (response.type === 'buttons' && response.bodyText && response.buttons) {
        return await sendInteractiveButtons({
            to: phoneNumber,
            bodyText: response.bodyText,
            buttons: response.buttons,
            headerImgUrl: response.headerImageUrl,
        });
    } else if (response.type === 'list' && response.bodyText && response.buttonText && response.sections) {
        return await sendInteractiveList({
            to: phoneNumber,
            bodyText: response.bodyText,
            buttonText: response.buttonText,
            sections: response.sections,
        });
    } else if (response.type === 'text' && response.message) {
        return await sendWhatsAppMessage({
            to: phoneNumber,
            text: response.message,
        });
    }
}

/**
 * Look up a contact's language preference and send the service menu to them.
 * Called by the webhook after a terminal response to close the cycle and return
 * the user to the main service selection list automatically.
 */
export async function getContactLanguageAndSendMenu(phoneNumber: string): Promise<void> {
    await connectDB();
    const contact = await Contact.findOne({ phoneNumber });
    const language = contact?.language || 'english';
    const menu = getServiceMenu(language);
    await sendChatbotResponse(phoneNumber, menu);
}

/**
 * Detect if user is typing language selection keywords
 */
function detectLanguageSelection(message: string): 'english' | 'hindi' | null {
    const englishKeywords = ['english', 'eng'];
    const hindiKeywords = ['hindi', 'हिंदी', 'हिन्दी'];

    if (englishKeywords.some(keyword => message.includes(keyword))) {
        return 'english';
    }

    if (hindiKeywords.some(keyword => message.includes(keyword))) {
        return 'hindi';
    }

    return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Handle location message and find nearest police station
 */
export async function handleLocationMessage(
    phoneNumber: string,
    latitude: number,
    longitude: number
): Promise<ChatbotResponse> {
    await connectDB();

    const contact = await Contact.findOne({ phoneNumber });
    const language = contact?.language || 'english';

    // Clear location flow state
    delete userFlowState[phoneNumber];

    // Get all police stations
    const stations = await PoliceStation.find({ isActive: true });

    // Calculate distances and find nearest
    const stationsWithDistance = stations.map(station => ({
        station,
        distance: calculateDistance(
            latitude,
            longitude,
            station.location.coordinates[1], // latitude
            station.location.coordinates[0]  // longitude
        ),
    }));

    // Filter stations within 10km range
    const nearbyStations = stationsWithDistance.filter(item => item.distance <= 10);

    // Sort by distance and get all nearby stations
    nearbyStations.sort((a, b) => a.distance - b.distance);
    const nearestStations = nearbyStations;

    // Build response message
    let message = '';

    if (nearestStations.length === 0) {
        if (language === 'english') {
            message = `📍 *No Police Station Found*\n\nIt seems you are currently outside the 10KM range of Hazaribagh Police Stations. Please try again when you are within the district, or call *112* for emergencies.`;
        } else {
            message = `📍 *कोई पुलिस स्टेशन नहीं मिला*\n\nऐसा लगता है कि आप वर्तमान में हजारीबाग पुलिस स्टेशनों की 10 किमी की सीमा से बाहर हैं। कृपया जिले में होने पर पुनः प्रयास करें, या आपातकालीन स्थिति के लिए *112* पर कॉल करें।`;
        }
        return {
            type: 'text',
            message,
            language,
            sendFollowUpMenu: true,
        };
    }

    if (language === 'english') {
        message = `📍 *Nearby Police Stations (sorted by distance)*\n\n`;

        nearestStations.forEach((item) => {
            const { station, distance } = item;
            const mapLink = `https://www.google.com/maps?q=${station.location.coordinates[1]},${station.location.coordinates[0]}`;
            message += `*${station.name}*\n`;
            message += `   📞 ${station.contactNumber}\n`;
            message += `   📏 Distance: ${distance.toFixed(2)} km\n`;
            message += `   📍 Location: ${mapLink}\n`;
            if (station.inchargeName) {
                message += `   👮 Incharge: ${station.inchargeName}\n`;
            }
            message += `\n`;
        });
    } else {
        message = `📍 *आपके निकट के पुलिस स्टेशन (दूरी के अनुसार)*\n\n`;

        nearestStations.forEach((item) => {
            const { station, distance } = item;
            const mapLink = `https://www.google.com/maps?q=${station.location.coordinates[1]},${station.location.coordinates[0]}`;
            message += `*${station.nameHindi}*\n`;
            message += `   📞 ${station.contactNumber}\n`;
            message += `   📏 दूरी: ${distance.toFixed(2)} किमी\n`;
            message += `   📍 स्थान: ${mapLink}\n`;
            if (station.inchargeNameHindi) {
                message += `   👮 प्रभारी: ${station.inchargeNameHindi}\n`;
            }
            message += `\n`;
        });
    }

    return {
        type: 'text',
        message,
        language,
        sendFollowUpMenu: true,  // location result is terminal → cycle ends
    };
}
