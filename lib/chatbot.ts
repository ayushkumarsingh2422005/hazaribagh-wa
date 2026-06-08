import Contact from '@/models/Contact';
import PoliceStation from '@/models/PoliceStation';
import TrafficViolation from '@/models/TrafficViolation';
import connectDB from './db';
import { sendInteractiveButtons, sendWhatsAppMessage, sendInteractiveList } from './whatsapp';
import { handleFormSubmission, saveComplaint } from './chatbot-helpers';
import { buildMyActivitiesMessage } from './my-activities';
import {
    formatDisclaimerStationPhones,
    formatGpsStationPhoneLines,
} from './police-station-phones';
import {
    getActivePoliceOfficesForChatbot,
    getPoliceOfficeByKey,
    parseOfficeInteractiveId,
    type ChatbotPoliceOffice,
} from './police-offices';

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

/** Active stations eligible for the chatbot "associated PS" interactive list (dashboard checkbox). */
async function getActivePoliceStations(): Promise<Array<{ name: string; nameHindi: string }>> {
    const stations = await PoliceStation.find({
        isActive: true,
        $nor: [{ showInAssociatedPsList: false }],
    })
        .sort({ displayOrder: 1, name: 1 })
        .select('name nameHindi');
    return stations.map((s) => ({ name: s.name, nameHindi: s.nameHindi }));
}

async function saveDeferredComplaintWithStation(
    phoneNumber: string,
    language: 'english' | 'hindi',
    stationValue: string
): Promise<ChatbotResponse> {
    const deferred = userFlowState[phoneNumber]?.data || {};
    const complaintType = String(deferred.complaintType || '');
    const complaintData = (deferred.complaintData as Record<string, unknown> | undefined) || {};
    try {
        const complaintId = await saveComplaint(phoneNumber, complaintType, {
            ...complaintData,
            policeStation: stationValue,
        });
        const isMissingPerson = complaintType === 'sub_missing_person';
        const isInformation = complaintType.startsWith('sub_info_');
        const isLostMobileNotSatisfied = complaintType === 'sub_lost_mobile_not_satisfied';
        const hideComplaintId =
            isLostMobileNotSatisfied ||
            complaintType === 'sub_traffic_jam' ||
            complaintType === 'sub_traffic_challan' ||
            complaintType === 'sub_traffic_other';
        delete userFlowState[phoneNumber];

        const message = isInformation
            ? buildInformationSubmissionThankYou(language)
            : isMissingPerson
              ? buildMissingPersonComplaintSuccess(language)
              : buildComplaintSuccess(language, complaintId, {
                    hideComplaintId,
                });

        return {
            type: 'text',
            message,
            language,
            sendFollowUpMenu: true,
        };
    } catch (error) {
        console.error('Error saving complaint after police station selection:', error);
        delete userFlowState[phoneNumber];
        return {
            type: 'buttons',
            bodyText: language === 'english'
                ? `❌ *Error*\n\nSorry, there was an error saving your complaint. Please try again from menu.`
                : `❌ *त्रुटि*\n\nक्षमा करें, शिकायत सहेजने में त्रुटि हुई। कृपया मेनू से पुनः प्रयास करें।`,
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
        };
    }
}

function buildStationSelectionListResponse(
    language: 'english' | 'hindi',
    stations: Array<{ name: string; nameHindi: string }>,
    page: number
): ChatbotResponse {
    if (stations.length === 0) {
        return {
            type: 'buttons',
            bodyText:
                language === 'english'
                    ? `🏢 *Select Concerned Police Station*\n\nNo stations are enabled for this list right now. You can continue without choosing a station, or open the main menu.`
                    : `🏢 *संबंधित पुलिस स्टेशन चुनें*\n\nइस सूची के लिए अभी कोई स्टेशन सक्षम नहीं है। आप बिना स्टेशन चुने आगे बढ़ सकते हैं या मुख्य मेनू खोलें।`,
            buttons: [
                {
                    id: 'station_pick_unknown',
                    title: language === 'english' ? 'Not sure / Unknown' : 'स्टेशन पता नहीं',
                },
                { id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
            ],
            language,
        };
    }

    // WhatsApp interactive list allows max 10 rows total across sections.
    // We keep room for action rows (unknown + prev/next), so station rows per page must stay <= 7.
    const PAGE_SIZE = 7;
    const totalPages = Math.max(1, Math.ceil(stations.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(0, page), totalPages - 1);
    const start = safePage * PAGE_SIZE;
    const pageStations = stations.slice(start, start + PAGE_SIZE);

    const safeTitle = (value: string, max = 24) =>
        value.length > max ? `${value.slice(0, max - 1)}…` : value;
    const safeDesc = (value: string, max = 72) =>
        value.length > max ? `${value.slice(0, max - 1)}…` : value;

    const rows = pageStations.map((s, idx) => {
        const absoluteIndex = start + idx;
        const fullName = language === 'english' ? s.name : s.nameHindi;
        return {
            id: `station_pick_${absoluteIndex}`,
            title: safeTitle(fullName),
            description: safeDesc(fullName),
        };
    });

    const navRows: Array<{ id: string; title: string; description?: string }> = [
        {
            id: 'station_pick_unknown',
            title: language === 'english' ? safeTitle('Not sure / Unknown') : safeTitle('स्टेशन पता नहीं'),
            description: language === 'english' ? 'Proceed without station name' : 'बिना स्टेशन नाम के आगे बढ़ें',
        },
    ];
    if (safePage > 0) {
        navRows.push({
            id: `station_page_${safePage - 1}`,
            title: safeTitle(language === 'english' ? '⬅ Previous' : '⬅ पिछला'),
            description: language === 'english' ? 'View previous stations' : 'पिछले स्टेशन देखें',
        });
    }
    if (safePage < totalPages - 1) {
        navRows.push({
            id: `station_page_${safePage + 1}`,
            title: safeTitle(language === 'english' ? 'Next ➡' : 'अगला ➡'),
            description: language === 'english' ? 'View more stations' : 'और स्टेशन देखें',
        });
    }

    return {
        type: 'list',
        bodyText: language === 'english'
            ? `🏢 *Select Concerned Police Station*\n\nChoose from the list below. (${safePage + 1}/${totalPages})`
            : `🏢 *संबंधित पुलिस स्टेशन चुनें*\n\nनीचे सूची से चुनें। (${safePage + 1}/${totalPages})`,
        buttonText: language === 'english' ? 'Choose Station' : 'स्टेशन चुनें',
        sections: [
            { title: language === 'english' ? 'Stations' : 'पुलिस स्टेशन', rows },
            { title: language === 'english' ? 'Actions' : 'कार्रवाई', rows: navRows },
        ],
        language,
    };
}

function buildHarassmentPhotoPrompt(language: 'english' | 'hindi'): ChatbotResponse {
    return {
        type: 'buttons',
        bodyText:
            language === 'english'
                ? `📷 *Harasser photo*\n\nPlease send a **clear photo** of the harasser if available.\n\nIf you have no photo, tap *No photo / Skip* to submit your information.`
                : `📷 *छेड़खानी करने वाले की फोटो*\n\nयदि उपलब्ध हो तो छेड़खानी करने वाले की **स्पष्ट फोटो** भेजें।\n\nफोटो न हो तो *फोटो नहीं / आगे* चुनें।`,
        buttons: [
            { id: 'harassment_photo_skip', title: language === 'english' ? 'No photo / Skip' : 'फोटो नहीं / आगे' },
            { id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
        ],
        language,
    };
}

async function finalizeInfoComplaint(
    phoneNumber: string,
    language: 'english' | 'hindi',
    complaintType: string,
    complaintData: Record<string, unknown>
): Promise<ChatbotResponse> {
    try {
        await saveComplaint(phoneNumber, complaintType, complaintData);
        await clearFlowState(phoneNumber);
        return {
            type: 'text',
            message: buildInformationSubmissionThankYou(language),
            language,
            sendFollowUpMenu: true,
        };
    } catch (error) {
        console.error('Error saving information complaint:', error);
        await clearFlowState(phoneNumber);
        return {
            type: 'buttons',
            bodyText:
                language === 'english'
                    ? `❌ *Error*\n\nSorry, there was an error saving your information. Please try again from menu.`
                    : `❌ *त्रुटि*\n\nक्षमा करें, सूचना सहेजने में त्रुटि हुई। कृपया मेनू से पुनः प्रयास करें।`,
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
        };
    }
}

function buildMissingPersonPhotoPrompt(language: 'english' | 'hindi'): ChatbotResponse {
    return {
        type: 'buttons',
        bodyText:
            language === 'english'
                ? `📷 *Missing person photo*\n\nPlease send a **recent, clear photo** of the missing person (face visible if possible).\n\nIf you do not have a photo, tap *No photo / Skip* — you can still continue.`
                : `📷 *लापता व्यक्ति की फोटो*\n\nकृपया लापता व्यक्ति की **हाल की स्पष्ट फोटो** भेजें (संभव हो तो चेहरा दिखे)।\n\nफोटो न हो तो *फोटो नहीं / आगे* चुनें — आप बिना फोटो भी आगे बढ़ सकते हैं।`,
        buttons: [
            { id: 'missing_photo_skip', title: language === 'english' ? 'No photo / Skip' : 'फोटो नहीं / आगे' },
            { id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
        ],
        language,
    };
}

function buildInformationSubmissionThankYou(language: 'english' | 'hindi'): string {
    return language === 'english'
        ? `✅ *Thank you*\n\nYour information has been received. Hazaribagh Police appreciates your cooperation.`
        : `✅ *धन्यवाद*\n\nआपकी सूचना प्राप्त हो गई है। हजारीबाग पुलिस आपके सहयोग के लिए धन्यवाद।`;
}

function buildComplaintSuccess(
    language: 'english' | 'hindi',
    complaintId: string | null,
    options?: { hideComplaintId?: boolean }
): string {
    const idLine =
        !options?.hideComplaintId && complaintId
            ? language === 'english'
                ? `\n\n🆔 *Complaint ID: ${complaintId}*\n_Please save this ID to track your complaint._`
                : `\n\n🆔 *शिकायत आईडी: ${complaintId}*\n_इस आईडी को सुरक्षित रखें, आपकी शिकायत ट्रैक करने के काम आएगी।_`
            : '';
    return language === 'english'
        ? `✅ *Complaint Registered Successfully*\n\nYour complaint has been registered. Our team will review it and take appropriate action.${idLine}\n\nYou will be contacted soon. Thank you for your patience.`
        : `✅ *शिकायत सफलतापूर्वक दर्ज*\n\nआपकी शिकायत दर्ज कर ली गई है। हमारी टीम इसकी समीक्षा करेगी और उचित कार्रवाई करेगी।${idLine}\n\nजल्द ही आपसे संपर्क किया जाएगा। आपके धैर्य के लिए धन्यवाद।`;
}

function buildMissingPersonComplaintSuccess(language: 'english' | 'hindi'): string {
    return language === 'english'
        ? `✅ *Missing Person Information Submitted*\n\nYour complaint has been recorded informally. You are requested to visit the concerned police station and register the complaint formally.`
        : `✅ *लापता व्यक्ति संबंधी सूचना दर्ज*\n\nअनौपचारिक रूप से आपकी शिकायत दर्ज कर लिया गया है परंतु आपसे अनुरोध है कि औपचारिक रूप से थाने में जा कर शिकायत दर्ज कराए।`;
}

async function finalizeMissingPersonComplaint(
    phoneNumber: string,
    language: 'english' | 'hindi',
    complaintData: Record<string, unknown>
): Promise<ChatbotResponse> {
    try {
        await saveComplaint(phoneNumber, 'sub_missing_person', complaintData);
        delete userFlowState[phoneNumber];
        return {
            type: 'text',
            message: buildMissingPersonComplaintSuccess(language),
            language,
            sendFollowUpMenu: true,
        };
    } catch (error) {
        console.error('Error saving missing person complaint:', error);
        delete userFlowState[phoneNumber];
        return {
            type: 'buttons',
            bodyText:
                language === 'english'
                    ? `❌ *Error*\n\nSorry, there was an error saving your report. Please try again from menu.`
                    : `❌ *त्रुटि*\n\nक्षमा करें, रिपोर्ट सहेजने में त्रुटि हुई। कृपया मेनू से पुनः प्रयास करें।`,
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
        };
    }
}

// In-memory cache; flowSession on Contact is the source of truth across requests.
const userFlowState: Record<string, { step: string; data?: Record<string, unknown> }> = {};

type FlowState = { step: string; data?: Record<string, unknown> };

async function getFlowState(phoneNumber: string): Promise<FlowState | undefined> {
    if (userFlowState[phoneNumber]?.step) {
        return userFlowState[phoneNumber];
    }
    const contact = await Contact.findOne({ phoneNumber }).select('flowSession').lean();
    const session = contact?.flowSession as FlowState | undefined;
    if (session?.step) {
        userFlowState[phoneNumber] = session;
        return session;
    }
    return undefined;
}

async function setFlowState(phoneNumber: string, state: FlowState): Promise<void> {
    userFlowState[phoneNumber] = state;
    await Contact.findOneAndUpdate({ phoneNumber }, { flowSession: state });
}

async function clearFlowState(phoneNumber: string): Promise<void> {
    delete userFlowState[phoneNumber];
    await Contact.findOneAndUpdate({ phoneNumber }, { $unset: { flowSession: '' } });
}

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

    const greetingKeywords = new Set(['hi', 'hello', 'hii', 'hey', 'start', 'test', 'johar', 'joh', 'jauhar']);
    const messageTokens = normalizedMessage.split(/\s+/).filter(Boolean);
    const isGreeting = messageTokens.some(token => greetingKeywords.has(token));
    
    // If no language is set yet, or user typed a greeting (only when not already in a flow),
    // show the welcome + language selection prompt.
    if (!userLanguage || (isGreeting && !userFlowState[phoneNumber])) {
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
        await clearFlowState(phoneNumber);
        return getServiceMenu(userLanguage);
    }

    // Check if user is in a form flow (waiting for input)
    if (userFlowState[phoneNumber]?.step) {
        if (userFlowState[phoneNumber].step === 'awaiting_police_station_selection') {
            const language = userLanguage || 'english';
            const stations = await getActivePoliceStations();
            const page = Number(userFlowState[phoneNumber].data?.stationPage || 0);
            return buildStationSelectionListResponse(language, stations, Number.isNaN(page) ? 0 : page);
        }

        if (userFlowState[phoneNumber].step === 'awaiting_info_location') {
            const language = userLanguage || 'english';
            const optional = Boolean(userFlowState[phoneNumber].data?.locationOptional);
            const complaintType = String(userFlowState[phoneNumber].data?.complaintType || '');
            const isHarassment = complaintType === 'sub_info_misbehavior';
            return {
                type: 'buttons',
                bodyText: isHarassment
                    ? language === 'english'
                        ? `📍 *Harassment location pending*\n\nPlease share the *location of the harassment incident* using the location button.`
                        : `📍 *छेड़खानी का स्थान लंबित*\n\nकृपया स्थान बटन से *छेड़खानी की घटना का स्थान* साझा करें।`
                    : optional
                      ? language === 'english'
                          ? `📍 *Optional location*\n\nShare a location pin if possible, or tap *Skip location* to submit without GPS.`
                          : `📍 *वैकल्पिक स्थान*\n\nयदि संभव हो स्थान साझा करें, या *स्थान छोड़ें* से GPS के बिना जमा करें।`
                      : language === 'english'
                        ? `📍 *Location Pending*\n\nPlease share the location using the button below.`
                        : `📍 *लोकेशन लंबित*\n\nकृपया नीचे दिए बटन से स्थान साझा करें।`,
                buttons: optional
                    ? [
                          { id: 'info_location_skip', title: language === 'english' ? 'Skip location' : 'स्थान छोड़ें' },
                          { id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
                      ]
                    : [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language,
            };
        }

        if (userFlowState[phoneNumber].step === 'awaiting_harassment_photo') {
            const language = userLanguage || 'english';
            return {
                type: 'buttons',
                bodyText:
                    language === 'english'
                        ? `📷 *Please send a photo*\n\nSend a clear photo of the harasser if available.\n\nIf you have no photo, tap *No photo / Skip*.`
                        : `📷 *कृपया फोटो भेजें*\n\nयदि उपलब्ध हो तो छेड़खानी करने वाले की स्पष्ट फोटो भेजें।\n\nफोटो न हो तो *फोटो नहीं / आगे* चुनें।`,
                buttons: [
                    { id: 'harassment_photo_skip', title: language === 'english' ? 'No photo / Skip' : 'फोटो नहीं / आगे' },
                    { id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
                ],
                language,
            };
        }

        if (userFlowState[phoneNumber].step === 'awaiting_missing_person_photo') {
            const language = userLanguage || 'english';
            return {
                type: 'buttons',
                bodyText:
                    language === 'english'
                        ? `📷 *Please send a photo*\n\nTap **📎** and choose **Gallery** or **Camera** to send an image of the missing person.\n\nIf you have no photo, tap *No photo / Skip*.`
                        : `📷 *कृपया फोटो भेजें*\n\n**📎** से गैलरी या कैमरा से लापता व्यक्ति की तस्वीर भेजें।\n\nफोटो न हो तो *फोटो नहीं / आगे* चुनें।`,
                buttons: [
                    { id: 'missing_photo_skip', title: language === 'english' ? 'No photo / Skip' : 'फोटो नहीं / आगे' },
                    { id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
                ],
                language,
            };
        }

        const result = await handleFormSubmission(phoneNumber, incomingMessage, userFlowState[phoneNumber]);

        if (result.success) {
            if (result.awaitStationSelection && result.deferredComplaintType && result.deferredComplaintData) {
                const stations = await getActivePoliceStations();
                userFlowState[phoneNumber] = {
                    step: 'awaiting_police_station_selection',
                    data: {
                        complaintType: result.deferredComplaintType,
                        complaintData: result.deferredComplaintData,
                        stationPage: 0,
                    },
                };
                return buildStationSelectionListResponse(result.language, stations, 0);
            }

            if (result.awaitMissingPersonPhoto && result.deferredComplaintType && result.deferredComplaintData) {
                userFlowState[phoneNumber] = {
                    step: 'awaiting_missing_person_photo',
                    data: {
                        complaintType: result.deferredComplaintType,
                        complaintData: result.deferredComplaintData,
                    },
                };
                return buildMissingPersonPhotoPrompt(result.language);
            }

            if (result.awaitLocation && result.deferredComplaintType && result.deferredComplaintData) {
                await setFlowState(phoneNumber, {
                    step: 'awaiting_info_location',
                    data: {
                        complaintType: result.deferredComplaintType,
                        complaintData: result.deferredComplaintData,
                        locationOptional: result.locationOptional ?? false,
                    },
                });

                const { sendLocationRequest } = await import('./whatsapp');
                const locationBody =
                    result.message ||
                    (result.language === 'english'
                        ? `📍 *Share Location*\n\nPlease share the location using the button below.`
                        : `📍 *स्थान साझा करें*\n\nकृपया नीचे दिए बटन से स्थान साझा करें।`);

                await sendLocationRequest({
                    to: phoneNumber,
                    bodyText: locationBody,
                });

                if (result.locationOptional) {
                    return {
                        type: 'buttons',
                        bodyText:
                            result.language === 'english'
                                ? '📍 Tap "Send Location" above if you can share a pin.\n\nOr tap *Skip location* to submit without GPS.'
                                : '📍 यदि संभव हो तो ऊपर "स्थान भेजें" दबाएं।\n\nGPS के बिना जमा करने के लिए *स्थान छोड़ें* चुनें।',
                        buttons: [
                            { id: 'info_location_skip', title: result.language === 'english' ? 'Skip location' : 'स्थान छोड़ें' },
                            { id: 'menu', title: result.language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
                        ],
                        language: result.language,
                    };
                }

                return {
                    type: 'text',
                    message:
                        result.language === 'english'
                            ? '📍 Please click the "Send Location" button above to share the incident location.'
                            : '📍 कृपया ऊपर "स्थान भेजें" बटन से घटना का स्थान साझा करें।',
                    language: result.language,
                };
            }

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

    if (interactiveId === 'info_location_skip') {
        const contact = await Contact.findOne({ phoneNumber });
        const language = contact?.language || 'english';
        const flowState = await getFlowState(phoneNumber);

        if (!flowState || flowState.step !== 'awaiting_info_location') {
            return {
                type: 'buttons',
                bodyText:
                    language === 'english'
                        ? 'This step has expired. Please start the Information flow again from the menu.'
                        : 'यह चरण समाप्त हो गया है। कृपया मेनू से सूचना प्रवाह फिर से शुरू करें।',
                buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language,
            };
        }

        const data = flowState.data || {};
        const complaintType = String(data.complaintType || '');
        const complaintData = (data.complaintData as Record<string, unknown>) || {};
        return finalizeInfoComplaint(phoneNumber, language, complaintType, complaintData);
    }

    if (interactiveId === 'harassment_photo_skip') {
        const contact = await Contact.findOne({ phoneNumber });
        const language = contact?.language || 'english';
        const flowState = await getFlowState(phoneNumber);

        if (!flowState || flowState.step !== 'awaiting_harassment_photo') {
            return {
                type: 'buttons',
                bodyText:
                    language === 'english'
                        ? 'This step has expired. Please start the Information flow again from the menu.'
                        : 'यह चरण समाप्त हो गया है। कृपया मेनू से सूचना प्रवाह फिर से शुरू करें।',
                buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language,
            };
        }

        const data = flowState.data || {};
        const complaintType = String(data.complaintType || 'sub_info_misbehavior');
        const complaintData = (data.complaintData as Record<string, unknown>) || {};
        return finalizeInfoComplaint(phoneNumber, language, complaintType, complaintData);
    }

    if (interactiveId === 'missing_photo_skip') {
        const contact = await Contact.findOne({ phoneNumber });
        const language = contact?.language || 'english';
        const flowState = userFlowState[phoneNumber];

        if (!flowState || flowState.step !== 'awaiting_missing_person_photo') {
            return {
                type: 'buttons',
                bodyText:
                    language === 'english'
                        ? 'This step has expired. Please start the Missing Person flow again from the menu.'
                        : 'यह चरण समाप्त हो गया है। कृपया मेनू से लापता व्यक्ति प्रवाह फिर से शुरू करें।',
                buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language,
            };
        }

        const data = flowState.data || {};
        const complaintData = (data.complaintData as Record<string, unknown>) || {};
        return finalizeMissingPersonComplaint(phoneNumber, language, complaintData);
    }

    // Actionable police station selection (no typing) with paging support
    if (interactiveId === 'station_pick_unknown' || interactiveId.startsWith('station_pick_') || interactiveId.startsWith('station_page_')) {
        const contact = await Contact.findOne({ phoneNumber });
        const language = contact?.language || 'english';
        const flowState = userFlowState[phoneNumber];

        if (!flowState || flowState.step !== 'awaiting_police_station_selection') {
            return {
                type: 'buttons',
                bodyText: language === 'english'
                    ? 'Station selection session expired. Please submit your complaint details again from menu.'
                    : 'स्टेशन चयन सेशन समाप्त हो गया है। कृपया मेनू से शिकायत विवरण फिर से भेजें।',
                buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language,
            };
        }

        const stations = await getActivePoliceStations();

        if (interactiveId === 'station_pick_unknown') {
            return await saveDeferredComplaintWithStation(phoneNumber, language, 'Not Known');
        }

        if (interactiveId.startsWith('station_page_')) {
            const nextPage = Number(interactiveId.replace('station_page_', ''));
            userFlowState[phoneNumber] = {
                ...flowState,
                data: {
                    ...(flowState.data || {}),
                    stationPage: Number.isNaN(nextPage) ? 0 : Math.max(0, nextPage),
                },
            };
            return buildStationSelectionListResponse(language, stations, Number.isNaN(nextPage) ? 0 : nextPage);
        }

        const pickedIndex = Number(interactiveId.replace('station_pick_', ''));
        if (Number.isNaN(pickedIndex) || pickedIndex < 0 || pickedIndex >= stations.length) {
            return {
                type: 'buttons',
                bodyText: language === 'english'
                    ? 'Invalid station selection. Please select again from the list.'
                    : 'अमान्य स्टेशन चयन। कृपया सूची से फिर चुनें।',
                buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language,
            };
        }

        return await saveDeferredComplaintWithStation(phoneNumber, language, stations[pickedIndex].name);
    }

    // Police office directory selection (Find my Police Station)
    if (interactiveId.startsWith('office_')) {
        const contact = await Contact.findOne({ phoneNumber });
        const language = contact?.language || 'english';
        return await handleOfficeSelection(interactiveId, language);
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
    const stations = await PoliceStation.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .limit(60);

    let message = '';

    if (language === 'english') {
        message = `✅ *You have selected English language.*\n\nWe will provide you with information about Hazaribagh Police services in this language.\n\n`;
        message += `⚠️ *BEWARE:* Beware of unauthorized WhatsApp chatbots asking you to share your personal details, click on links, or download apps. These can be scams to defraud you. If you receive such communication, please report immediately on *1930*.\n\n`;
        message += `📋 *Disclaimer:* This WhatsApp Chatbot is only for Hazaribagh Police which is made to provide you services and resolve your queries related to Hazaribagh Police. This is a query-based information system. For urgent matters, please visit the nearest police station or call *112* or call District Control Room on *8002529348*. Please find contact numbers of police stations and other important offices below.\n\n`;
        message += `📞 *Police Station Contact Numbers:*\n\n`;

        stations.forEach((station, index) => {
            message += `${index + 1}. ${station.name} - ${formatDisclaimerStationPhones(station, 'english')}\n`;
        });

        message += `\n\nPlease select a service from the menu below.`;
        message += `\n\n_Powered by DigiCraft Innovation Pvt. Ltd._`;
    } else {
        message = `✅ *आपने हिंदी भाषा का चयन किया है।*\n\nहम आपको हजारीबाग पुलिस सेवाओं के बारे में जानकारी इसी भाषा में प्रदान करेंगे।\n\n`;
        message += `⚠️ *सावधान:* अनाधिकृत व्हाट्सएप चैटबॉट से सावधान रहे जो आपसे आपकी व्यक्तिगत जानकारी साझा करने, लिंक पर क्लिक करने और एप डाउनलोड करने के लिये कह रहे है तो आप धोखाघडी के शिकार हो सकते है। यदि आपको ऐसा कोई संदेश प्राप्त होता है तो इसकी जानकारी आप *1930* पर कॉल कर सकते है।\n\n`;
        message += `📋 *अस्वीकरण:* यह व्हाट्सएप चैटबॉट केवल हजारीबाग पुलिस के लिए है, जो आपको सेवाएं प्रदान करने और हजारीबाग पुलिस से संबंधित आपके प्रश्नों का समाधान करने के लिए बनाया गया है। यह प्रश्न-आधारित सूचना प्रणाली है। *अति-आवश्यक* मामलों के लिए निकटतम पुलिस स्टेशन पर जाएं या *112* पर कॉल करें या जिला नियंत्रण कक्ष *8002529348* पर कॉल करें। नीचे पुलिस स्टेशनों और अन्य महत्वपूर्ण कार्यालयों के संपर्क नंबर देखें।\n\n`;
        message += `📞 *पुलिस स्टेशन संपर्क नंबर:*\n\n`;

        stations.forEach((station, index) => {
            message += `${index + 1}. ${station.nameHindi} - ${formatDisclaimerStationPhones(station, 'hindi')}\n`;
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
                        { id: 'service_missing_person', title: 'Missing Person', description: 'Report missing person details' },
                        { id: 'service_information', title: 'Information', description: 'Share actionable information' },
                        { id: 'service_suggestion', title: 'Suggestion', description: 'Suggestion related to police services' },
                        { id: 'service_my_activities', title: 'My Activities', description: 'Track complaints by Complaint ID' },
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
                        { id: 'service_passport', title: 'पासपोर्ट से संबंधित', description: 'पासपोर्ट सत्यापन समस्याएं' },
                        { id: 'service_character', title: 'चरित्र सत्यापन', description: 'चरित्र सत्यापन समस्याएं' },
                        { id: 'service_location', title: 'स्थान सेवा', description: 'स्टेशन स्थान व थाना खोजें' },
                        { id: 'service_lost_phone', title: 'खोया मोबाइल फोन', description: 'खोया फोन रिपोर्ट करें' },
                        { id: 'service_traffic', title: 'यातायात की समस्या', description: 'यातायात संबंधी प्रश्न' },
                        { id: 'service_missing_person', title: 'लापता व्यक्ति', description: 'लापता व्यक्ति की जानकारी दें' },
                        { id: 'service_information', title: 'सूचना', description: 'कार्रवाई योग्य सूचना साझा करें' },
                        { id: 'service_suggestion', title: 'सुझाव', description: 'पुलिस सेवाओं से संबंधित सुझाव' },
                        { id: 'service_my_activities', title: 'मेरी गतिविधियाँ', description: 'शिकायत आईडी से ट्रैक करें' },
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
        case 'service_missing_person':
            userFlowState[phoneNumber] = { step: 'sub_missing_person' };
            return getMissingPersonForm(language);
        case 'service_information':
            return getInformationSubMenu(language);
        case 'service_suggestion':
            userFlowState[phoneNumber] = { step: 'suggestion_form' };
            return getSuggestionForm(language);
        case 'service_my_activities': {
            const message = await buildMyActivitiesMessage(phoneNumber, language);
            return {
                type: 'text',
                message,
                language,
                sendFollowUpMenu: true,
            };
        }
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
                            title: 'Office Directory',
                            description: 'DSP / SDPO / CI office locations',
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
                        title: 'कार्यालय निर्देशिका',
                        description: 'DSP / SDPO / CI कार्यालय स्थान',
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
        ? `📍 *Nearest Police Station*\n\nShare your location using the button below to find the closest police station.`
        : `📍 *निकटतम पुलिस स्टेशन*\n\nनिकटतम थाना खोजने के लिए नीचे दिए बटन से अपना स्थान साझा करें।`;

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
                        { id: 'sub_traffic_other', title: 'अन्य समस्याएं', description: 'अन्य यातायात की समस्या' },
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

function getMissingPersonForm(language: 'english' | 'hindi'): ChatbotResponse {
    if (language === 'english') {
        return {
            type: 'buttons',
            bodyText: `🧾 *Missing Person Report*\n\nPlease provide the details below (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Police Station Name\n*Line 4:* Lost / Last Seen Address\n*Line 5:* Missing Person Details\n\n*Example:*\nAnita Kumari\n9876543210\nSadar P.S.\nLake Road area, near Tower Chowk, Hazaribagh\nMy younger brother (age 17) is missing since yesterday evening.\n\nAfter this, you may send a photo (optional). No police station list — type the station name on line 3.\n\nPlease reply with all details.`,
            buttons: [{ id: 'menu', title: 'Main Menu' }],
            language,
        };
    }

    return {
        type: 'buttons',
        bodyText: `🧾 *लापता व्यक्ति रिपोर्ट*\n\nकृपया नीचे दिए गए विवरण प्रति पंक्ति एक भेजें:\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* पुलिस स्टेशन का नाम\n*पंक्ति 4:* लापता / अंतिम बार देखा गया पता\n*पंक्ति 5:* लापता व्यक्ति का विवरण\n\n*उदाहरण:*\nअनीता कुमारी\n9876543210\nसदर थाना\nलेक रोड क्षेत्र, टावर चौक के पास, हजारीबाग\nमेरा छोटा भाई (उम्र 17 वर्ष) कल शाम से लापता है।\n\nइसके बाद फोटो (वैकल्पिक)। थाना सूची नहीं — पंक्ति 3 में नाम लिखें।\n\nकृपया सभी विवरण भेजें।`,
        buttons: [{ id: 'menu', title: 'मुख्य मेनू' }],
        language,
    };
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
                        { id: 'sub_info_adebazi', title: 'Adebazi Info', description: 'Share adebazi-related information' },
                        { id: 'sub_info_misbehavior', title: 'Harassment Info', description: 'Share harassment-related information' },
                        { id: 'sub_info_drugs', title: 'Drugs/Intoxication', description: 'Share drug/intoxication-related information' },
                        { id: 'sub_info_absconders', title: 'Absconders Info', description: 'Share information about absconding criminals' },
                        { id: 'sub_info_illegal', title: 'Illegal Liquor', description: 'Share information about illegal liquor' },
                        { id: 'sub_info_other', title: 'Other Information', description: 'Share any other actionable information' },
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
                    { id: 'sub_info_adebazi', title: 'अड्डेबाजी', description: 'अड्डेबाजी संबंधी सूचना दें' },
                    { id: 'sub_info_misbehavior', title: 'छेड़खानी से संबंधित', description: 'छेड़खानी संबंधी सूचना दें' },
                    { id: 'sub_info_drugs', title: 'नशाखोरी/ड्रग्स', description: 'नशाखोरी/ड्रग्स की सूचना दें' },
                    { id: 'sub_info_absconders', title: 'फरार अपराधी', description: 'फरार अपराधियों की सूचना दें' },
                    { id: 'sub_info_illegal', title: 'अवैध शराब', description: 'अवैध शराब संबंधी सूचना दें' },
                    { id: 'sub_info_other', title: 'अन्य सूचना', description: 'अन्य महत्वपूर्ण सूचना दें' },
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

    // Find my Police Station — show INSP / DSP office list, no form, no complaint
    if (subServiceId === 'sub_location_find_station') {
        delete userFlowState[phoneNumber];
        return await getOfficeDirectoryMenu(language);
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
            english: `📝 *Passport — Delay in Police Verification*\n\nPlease provide (one per line):\n\n*Line 1:* Name of Applicant\n*Line 2:* Passport Application Number\n*Line 3:* Locality / Village\n*Line 4:* Mobile Number\n*Line 5:* Police Station Name\n*Line 6:* Remarks\n\n*Example:*\nRahul Kumar\nAB1234567\nKatkamsandi\n9876543210\nSadar P.S.\nVerification pending since 2 months\n\nPlease reply with all details.`,
            hindi: `📝 *पासपोर्ट — पुलिस सत्यापन में देरी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* पासपोर्ट आवेदन संख्या\n*पंक्ति 3:* इलाका / गाँव\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* पुलिस स्टेशन का नाम\n*पंक्ति 6:* टिप्पणी\n\n*उदाहरण:*\nराहुल कुमार\nAB1234567\nकटकमसंडी\n9876543210\nसदर थाना\n2 महीने से सत्यापन लंबित\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_passport_other: {
            english: `📝 *Passport — Other Issues*\n\nPlease provide (one per line):\n\n*Line 1:* Name of Applicant\n*Line 2:* Passport Application Number\n*Line 3:* Locality / Village\n*Line 4:* Mobile Number\n*Line 5:* Police Station Name\n*Line 6:* Report issue\n\n*Example:*\nPriya Sharma\nCD9876543\nSadar\n9876543211\nSadar P.S.\nDocument submission issue at the PSK\n\nPlease reply with details.`,
            hindi: `📝 *पासपोर्ट — अन्य समस्याएं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* पासपोर्ट आवेदन संख्या\n*पंक्ति 3:* इलाका / गाँव\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* पुलिस स्टेशन का नाम\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nप्रिया शर्मा\nCD9876543\nसदर\n9876543211\nसदर थाना\nपीएसके पर दस्तावेज जमा करने में समस्या\n\nकृपया विवरण के साथ उत्तर दें।`,
        },
        sub_character_delay: {
            english: `📝 *Character Verification — Delay*\n\nPlease provide (one per line):\n\n*Line 1:* Name of Applicant\n*Line 2:* Character Verification Application Number\n*Line 3:* Locality / Village\n*Line 4:* Mobile Number\n*Line 5:* Police Station Name\n*Line 6:* Remarks\n\n*Example:*\nSunil Verma\nCH12345\nBarkagaon\n9876543212\nSadar P.S.\nVerification is delayed by 15 days\n\nPlease reply with all details.`,
            hindi: `📝 *चरित्र सत्यापन — देरी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* चरित्र सत्यापन आवेदन संख्या\n*पंक्ति 3:* इलाका / गाँव\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* पुलिस स्टेशन का नाम\n*पंक्ति 6:* टिप्पणी\n\n*उदाहरण:*\nसुनील वर्मा\nCH12345\nबरकागांव\n9876543212\nसदर थाना\nसत्यापन 15 दिनों से लंबित है\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_character_other: {
            english: `📝 *Character Verification — Other Issues*\n\nPlease provide (one per line):\n\n*Line 1:* Name of Applicant\n*Line 2:* Character Application Number\n*Line 3:* Locality / Village\n*Line 4:* Mobile Number\n*Line 5:* Police Station Name\n*Line 6:* Report issue\n\n*Example:*\nSunil Verma\nCH12345\nKatkamsandi\n9876543213\nSadar P.S.\nName is misspelled in the application\n\nPlease reply with details.`,
            hindi: `📝 *चरित्र सत्यापन — अन्य समस्याएं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* चरित्र आवेदन संख्या\n*पंक्ति 3:* इलाका / गाँव\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* पुलिस स्टेशन का नाम\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nसुनील वर्मा\nCH12345\nकटकमसंडी\n9876543213\nसदर थाना\nआवेदन में नाम की वर्तनी गलत है\n\nकृपया विवरण के साथ उत्तर दें।`,
        },
        sub_petition_not_visited: {
            english: `📝 *Police Did Not Visit - Petition*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Issue Details\n\nAfter this you will select the concerned police station from the list.\n\n*Example:*\nAmit Singh\nRakesh Singh\nWard 5, Hazaribagh\n9876543210\nPolice did not visit regarding my petition filed 5 days ago\n\nPlease reply with all details.`,
            hindi: `📝 *पुलिस नहीं आई - याचिका*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* समस्या विवरण\n\nइसके बाद आप सूची से संबंधित पुलिस स्टेशन चुनेंगे।\n\n*उदाहरण:*\nअमित सिंह\nराकेश सिंह\nवार्ड 5, हजारीबाग\n9876543210\n5 दिन पहले दायर याचिका के संबंध में पुलिस नहीं आई\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_petition_not_satisfied: {
            english: `📝 *Not Satisfied with Police Response*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Reason for Dissatisfaction\n\nAfter this you will select the concerned police station from the list.\n\n*Example:*\nVikash Yadav\nSuresh Yadav\nBarkagaon, Hazaribagh\n9876543211\nThe investigation was closed without taking my statement\n\nPlease reply with all details.`,
            hindi: `📝 *पुलिस की प्रतिक्रिया से संतुष्ट नहीं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* असंतोष का कारण\n\nइसके बाद आप सूची से संबंधित पुलिस स्टेशन चुनेंगे।\n\n*उदाहरण:*\nविकाश यादव\nसुरेश यादव\nबरकागांव, हजारीबाग\n9876543211\nमेरा बयान लिए बिना जांच बंद कर दी गई\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_petition_other: {
            english: `📝 *Other Petition Issues*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Issue Details\n\nAfter this you will select the concerned police station from the list.\n\n*Example:*\nNeha Kumari\nManoj Prasad\nKorra, Hazaribagh\n9876543212\nNeed an update on the status of my petition\n\nPlease reply with all details.`,
            hindi: `📝 *अन्य याचिका समस्याएं*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* समस्या विवरण\n\nइसके बाद आप सूची से संबंधित पुलिस स्टेशन चुनेंगे।\n\n*उदाहरण:*\nनेहा कुमारी\nमनोज प्रसाद\nकोर्रा, हजारीबाग\n9876543212\nमुझे अपनी याचिका की स्थिति का अपडेट चाहिए\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_traffic_jam: {
            english: `🚦 *Report Traffic Jam*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Traffic Jam Location\n*Line 4:* Police Station Name\n*Line 5:* Remarks\n\n*Example:*\nRajeev Kumar\n9876543213\nTower Chowk\nSadar P.S.\nHeavy traffic congestion for the last hour\n\nPlease reply with all details.`,
            hindi: `🚦 *ट्रैफ़िक जाम रिपोर्ट*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* ट्रैफ़िक जाम का स्थान\n*पंक्ति 4:* पुलिस स्टेशन का नाम\n*पंक्ति 5:* टिप्पणी\n\n*उदाहरण:*\nराजीव कुमार\n9876543213\nटावर चौक\nसदर थाना\nपिछले एक घंटे से भारी ट्रैफ़िक जाम है\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_traffic_challan: {
            english: `🚦 *Traffic Challan Issues*\n\nYou can submit challan online at *https://echallan.parivahan.gov.in* or visit Traffic Police Station.\n📞 Traffic Police Station: *9939257628*\n📍 https://www.google.com/maps?q=23.998764,85.365657\n\nTo report other challan-related issues, reply (one per line):\n\n*Line 1:* Name\n*Line 2:* Mobile Number\n*Line 3:* Challan Number\n*Line 4:* Police Station Name\n*Line 5:* Report issue\n\n*Example:*\nSanjay Gupta\n9876543214\nJH12345678\nTraffic P.S.\nI was wearing a helmet but still received a challan\n\nPlease reply with all details.`,
            hindi: `🚦 *ट्रैफ़िक चालान मुद्दे*\n\nचालान ऑनलाइन *https://echallan.parivahan.gov.in* पर जमा करें या ट्रैफ़िक पुलिस स्टेशन जाएं।\n📞 ट्रैफ़िक पुलिस स्टेशन: *9939257628*\n📍 https://www.google.com/maps?q=23.998764,85.365657\n\nअन्य चालान संबंधी समस्या के लिए (प्रति पंक्ति एक):\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* चालान नंबर\n*पंक्ति 4:* पुलिस स्टेशन का नाम\n*पंक्ति 5:* समस्या विवरण\n\n*उदाहरण:*\nसंजय गुप्ता\n9876543214\nJH12345678\nट्रैफिक थाना\nहेलमेट पहनने के बावजूद चालान कट गया\n\nकृपया सभी विवरण भेजें।`,
        },
        sub_traffic_other: {
            english: `🚦 *Other Traffic Issues*\n\nPlease provide (one per line):\n\n*Line 1:* Name\n*Line 2:* Mobile Number\n*Line 3:* Police Station Name\n*Line 4:* Report issue\n\n*Example:*\nPooja Dey\n9876543215\nSadar P.S.\nTraffic light not working at Bajrangbali Chowk\n\nPlease reply with all details.`,
            hindi: `🚦 *अन्य यातायात की समस्या*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* पुलिस स्टेशन का नाम\n*पंक्ति 4:* समस्या विवरण\n\n*उदाहरण:*\nपूजा डे\n9876543215\nसदर थाना\nबजरंगबली चौक पर ट्रैफिक लाइट खराब है\n\nकृपया सभी विवरण भेजें।`,
        },
        // sub_lost_mobile is handled separately above — redirects to CEIR portal
        sub_lost_mobile_not_satisfied: {
            english: `📱 *Not Satisfied with Police Action*\n\nIf you're not satisfied with police action on your lost mobile, please reply (one per line):\n\n*Line 1:* Name\n*Line 2:* Your Mobile Number\n*Line 3:* Lost Mobile Number\n*Line 4:* IMEI Number\n*Line 5:* Police Station Name\n\n*Example:*\nSanjay Sharma\n9876543210\n9876543211\n359123456789012\nSadar P.S.\n\nPlease reply with all details.`,
            hindi: `📱 *पुलिस कार्रवाई से संतुष्ट नहीं*\n\nयदि आप खोए मोबाइल पर पुलिस कार्रवाई से संतुष्ट नहीं हैं, कृपया प्रति पंक्ति एक विवरण भेजें:\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* आपका मोबाइल नंबर\n*पंक्ति 3:* खोया मोबाइल नंबर\n*पंक्ति 4:* IMEI नंबर\n*पंक्ति 5:* पुलिस स्टेशन का नाम\n\n*उदाहरण:*\nसंजय शर्मा\n9876543210\n9876543211\n359123456789012\nसदर थाना\n\nकृपया सभी विवरण के साथ उत्तर दें।`,
        },
        sub_missing_person: {
            english: `🧾 *Missing Person Report*\n\nPlease provide the details below (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Police Station Name\n*Line 4:* Lost / Last Seen Address\n*Line 5:* Missing Person Details\n\n*Example:*\nAnita Kumari\n9876543210\nSadar P.S.\nLake Road area, near Tower Chowk, Hazaribagh\nMy younger brother (age 17) is missing since yesterday evening.\n\nAfter your text, you may send a photo (optional).\n\nPlease reply with all details.`,
            hindi: `🧾 *लापता व्यक्ति रिपोर्ट*\n\nकृपया नीचे दिए गए विवरण प्रति पंक्ति एक भेजें:\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* पुलिस स्टेशन का नाम\n*पंक्ति 4:* लापता / अंतिम बार देखा गया पता\n*पंक्ति 5:* लापता व्यक्ति का विवरण\n\n*उदाहरण:*\nअनीता कुमारी\n9876543210\nसदर थाना\nलेक रोड क्षेत्र, टावर चौक के पास, हजारीबाग\nमेरा छोटा भाई (उम्र 17 वर्ष) कल शाम से लापता है।\n\nटेक्स्ट के बाद फोटो (वैकल्पिक) भेज सकते हैं।\n\nकृपया सभी विवरण भेजें।`,
        },
        // sub_cyber is handled separately above — redirects to cybercrime.gov.in / helpline 1930
        sub_cyber_other: {
            english: `💻 *Other Cyber Issues*\n\nIf you have other cyber-related issues, please reply with:\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Report issue\n\n*Example:*\nKamal Roy\nBijay Roy\nSadar, Hazaribagh\n9876543210\nCyber P.S.\nQuery regarding social media account hack\n\nPlease reply with details.`,
            hindi: `💻 *अन्य साइबर मुद्दे*\n\nयदि आपके पास अन्य साइबर संबंधी मुद्दे हैं, तो कृपया उत्तर दें:\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nकमल रॉय\nबिजय रॉय\nसदर, हजारीबाग\n9876543210\nसाइबर पीएस\nसोशल मीडिया अकाउंट हैक के संबंध में प्रश्न\n\nकृपया विवरण के साथ उत्तर दें।`,
        },
        sub_info_adebazi: {
            english: `ℹ️ *Adebazi Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Adebazi Details\n*Line 4:* Place of Adebazi\n*Line 5:* Police Station Name\n\n*Example:*\nRavi Kumar\n9876543210\nLocal youths gather and create nuisance daily\nKorra market area\nSadar P.S.\n\nYou may optionally share a location pin after this.\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *अड्डेबाजी से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* अड्डेबाजी का विवरण\n*पंक्ति 4:* अड्डेबाजी का स्थान\n*पंक्ति 5:* पुलिस स्टेशन का नाम\n\n*उदाहरण:*\nरवि कुमार\n9876543210\nस्थानीय युवक रोज उपद्रव करते हैं\nकोर्रा बाजार क्षेत्र\nसदर थाना\n\nइसके बाद वैकल्पिक रूप से स्थान साझा कर सकते हैं।\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_misbehavior: {
            english: `ℹ️ *Harassment Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Place Name\n*Line 4:* Police Station Name\n*Line 5:* Harassment Details\n\n*Example:*\nPooja Kumari\n9876543211\nBus stand, Sadar\nSadar P.S.\nSome boys harass school girls near the bus stand every morning.\n\nYou will then share the incident location pin and may send a photo of the harasser.\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *छेड़खानी से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* स्थान का नाम\n*पंक्ति 4:* पुलिस स्टेशन का नाम\n*पंक्ति 5:* छेड़खानी का विवरण\n\n*उदाहरण:*\nपूजा कुमारी\n9876543211\nबस स्टैंड, सदर\nसदर थाना\nसुबह बस स्टैंड पर कुछ लड़के स्कूल जाने वाली लड़कियों के साथ छेड़खानी करते हैं।\n\nइसके बाद घटना का स्थान पिन साझा करें और छेड़खानी करने वाले की फोटो (वैकल्पिक) भेज सकते हैं।\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_drugs: {
            english: `ℹ️ *Drug / Intoxication Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Place of Drugs/Intoxication Activity\n*Line 4:* Police Station Name\n*Line 5:* Details\n\n*Example:*\nAnil Verma\n9876543212\nOld warehouse area, Pelawal\nSadar P.S.\nPeople are selling and consuming drugs near the old warehouse at night.\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *नशाखोरी/ड्रग्स से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* नशाखोरी/ड्रग्स गतिविधि का स्थान\n*पंक्ति 4:* पुलिस स्टेशन का नाम\n*पंक्ति 5:* विवरण\n\n*उदाहरण:*\nअनिल वर्मा\n9876543212\nपेलावल, पुराने गोदाम क्षेत्र\nसदर थाना\nरात में पुराने गोदाम के पास ड्रग्स की बिक्री हो रही है।\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_absconders: {
            english: `ℹ️ *Absconding Criminals Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Absconder's Name\n*Line 4:* Case Details (if known)\n*Line 5:* Place Last Seen\n*Line 6:* Police Station Name\n\n*Example:*\nDeepak Singh\n9876543213\nRamesh Yadav\nWanted in theft case — FIR unknown\nBarhi bazaar area\nBarhi P.S.\n\nYou may optionally share the absconder's location pin after this.\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *फरार अपराधियों की सूचना*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* फरार अपराधी का नाम\n*पंक्ति 4:* मामले का विवरण (यदि ज्ञात हो)\n*पंक्ति 5:* अंतिम बार देखा गया स्थान\n*पंक्ति 6:* पुलिस स्टेशन का नाम\n\n*उदाहरण:*\nदीपक सिंह\n9876543213\nरमेश यादव\nचोरी के मामले में वांछित\nबरही बाजार क्षेत्र\nबरही थाना\n\nइसके बाद वैकल्पिक रूप से फरार अपराधी का स्थान साझा कर सकते हैं।\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_illegal: {
            english: `ℹ️ *Illegal Liquor Related Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Place of Illegal Liquor Activity\n*Line 4:* Police Station Name\n*Line 5:* Details\n\n*Example:*\nSunita Devi\n9876543214\nCanal road, Churchu\nChurchu P.S.\nIllegal liquor is being sold openly every evening near the canal road.\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *अवैध शराब से संबंधित जानकारी*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* अवैध शराब गतिविधि का स्थान\n*पंक्ति 4:* पुलिस स्टेशन का नाम\n*पंक्ति 5:* विवरण\n\n*उदाहरण:*\nसुनीता देवी\n9876543214\nनहर रोड, चर्चू\nचर्चू थाना\nहर शाम नहर रोड पर अवैध शराब की बिक्री हो रही है।\n\nकृपया पूरी जानकारी भेजें।`,
        },
        sub_info_other: {
            english: `ℹ️ *Any Other Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Mobile Number\n*Line 3:* Police Station Name\n*Line 4:* Information Details\n\n*Example:*\nNitesh Kumar\n9876543215\nSadar P.S.\nSuspicious people are moving around closed houses late at night.\n\nPlease reply with complete details.`,
            hindi: `ℹ️ *कोई अन्य सूचना*\n\nकृपया प्रदान करें (प्रति पंक्ति एक):\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* मोबाइल नंबर\n*पंक्ति 3:* पुलिस स्टेशन का नाम\n*पंक्ति 4:* सूचना का विवरण\n\n*उदाहरण:*\nनितेश कुमार\n9876543215\nसदर थाना\nरात में बंद घरों के आसपास संदिग्ध लोग घूमते दिख रहे हैं।\n\nकृपया पूरी जानकारी भेजें।`,
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

    // Information flow: GPS pin is saved with the report (no nearest-PS lookup).
    const flowState = await getFlowState(phoneNumber);
    if (flowState?.step === 'awaiting_info_location') {
        const deferred = flowState.data || {};
        const complaintType = String(deferred.complaintType || '');
        const complaintData = (deferred.complaintData as Record<string, unknown> | undefined) || {};

        if (!complaintType || !complaintType.startsWith('sub_info_')) {
            await clearFlowState(phoneNumber);
            return {
                type: 'buttons',
                bodyText:
                    language === 'english'
                        ? `❌ *Session Expired*\n\nPlease submit the information details again from the menu.`
                        : `❌ *सेशन समाप्त*\n\nकृपया मेनू से सूचना विवरण फिर से भेजें।`,
                buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language,
            };
        }

        try {
            const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
            const existingRemarks = String(complaintData.remarks || '');
            const enrichedData: Record<string, unknown> = {
                ...complaintData,
                location: `${latitude},${longitude}`,
                remarks: `${existingRemarks}\n\nIncident GPS: ${latitude},${longitude}\nMap: ${mapLink}`,
            };

            if (complaintType === 'sub_info_misbehavior') {
                await setFlowState(phoneNumber, {
                    step: 'awaiting_harassment_photo',
                    data: {
                        complaintType,
                        complaintData: enrichedData,
                    },
                });
                return buildHarassmentPhotoPrompt(language);
            }

            return finalizeInfoComplaint(phoneNumber, language, complaintType, enrichedData);
        } catch (error) {
            console.error('Error preparing info complaint after location:', error);
            await clearFlowState(phoneNumber);
            return {
                type: 'buttons',
                bodyText:
                    language === 'english'
                        ? `❌ *Error*\n\nSorry, something went wrong. Please try again from the menu.`
                        : `❌ *त्रुटि*\n\nक्षमा करें, कुछ गलत हो गया। कृपया मेनू से पुनः प्रयास करें।`,
                buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
                language,
            };
        }
    }

    // Nearest-police-station GPS service (not an information submission).
    delete userFlowState[phoneNumber];

    const stations = await PoliceStation.find({ isActive: true });

    if (stations.length === 0) {
        return {
            type: 'text',
            message:
                language === 'english'
                    ? `📍 *Nearest Police Station*\n\nNo active police stations are available right now. For emergencies, call *112*.`
                    : `📍 *निकटतम पुलिस स्टेशन*\n\nअभी कोई सक्रिय पुलिस स्टेशन उपलब्ध नहीं है। आपातकाल में *112* पर कॉल करें।`,
            language,
            sendFollowUpMenu: true,
        };
    }

    const nearest = stations
        .map((station) => ({
            station,
            distance: calculateDistance(
                latitude,
                longitude,
                station.location.coordinates[1],
                station.location.coordinates[0]
            ),
        }))
        .sort((a, b) => a.distance - b.distance)[0];

    const { station, distance } = nearest;
    const mapLink = `https://www.google.com/maps?q=${station.location.coordinates[1]},${station.location.coordinates[0]}`;

    let message = '';
    if (language === 'english') {
        message = `📍 *Nearest Police Station*\n\n*${station.name}*\n`;
        message += formatGpsStationPhoneLines(station, 'english');
        message += `📏 Distance: ${distance.toFixed(2)} km\n`;
        message += `📍 Location: ${mapLink}\n`;
        if (station.inchargeName) {
            message += `👮 Incharge: ${station.inchargeName}\n`;
        }
    } else {
        message = `📍 *निकटतम पुलिस स्टेशन*\n\n*${station.nameHindi}*\n`;
        message += formatGpsStationPhoneLines(station, 'hindi');
        message += `📏 दूरी: ${distance.toFixed(2)} किमी\n`;
        message += `📍 स्थान: ${mapLink}\n`;
        if (station.inchargeNameHindi) {
            message += `👮 प्रभारी: ${station.inchargeNameHindi}\n`;
        }
    }

    return {
        type: 'text',
        message,
        language,
        sendFollowUpMenu: true,
    };
}

/**
 * Inbound image during Missing Person flow: save file and register complaint.
 */
export async function handleMissingPersonImageMessage(
    phoneNumber: string,
    mediaId: string
): Promise<ChatbotResponse> {
    await connectDB();

    const contact = await Contact.findOne({ phoneNumber });
    const language = contact?.language || 'english';
    const flow = userFlowState[phoneNumber];

    if (!flow || flow.step !== 'awaiting_missing_person_photo') {
        return {
            type: 'buttons',
            bodyText:
                language === 'english'
                    ? '📷 We are not collecting a photo at this step. Open *Missing Person* from the menu to submit a full report.'
                    : '📷 अभी फोटो लेने का चरण नहीं है। पूरी रिपोर्ट के लिए मेनू से *लापता व्यक्ति* चुनें।',
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
        };
    }

    try {
        const { saveWhatsappImageToUploads } = await import('./whatsapp-media');
        const relativePath = await saveWhatsappImageToUploads(mediaId);
        const data = (flow.data || {}) as Record<string, unknown>;
        const prev = (data.complaintData as Record<string, unknown>) || {};
        const complaintData = { ...prev, missingPersonPhotoUrl: relativePath };

        return finalizeMissingPersonComplaint(phoneNumber, language, complaintData);
    } catch (err) {
        console.error('Missing person image save failed:', err);
        return {
            type: 'buttons',
            bodyText:
                language === 'english'
                    ? `❌ *Could not save the photo*\n\nPlease try sending the image again, or tap *No photo / Skip* to continue without a photo.`
                    : `❌ *फोटो सहेजी नहीं जा सकी*\n\nकृपया फोटो दोबारा भेजें, या *फोटो नहीं / आगे* से बिना फोटो जारी रखें।`,
            buttons: [
                { id: 'missing_photo_skip', title: language === 'english' ? 'No photo / Skip' : 'फोटो नहीं / आगे' },
                { id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
            ],
            language,
        };
    }
}

/**
 * Inbound image during harassment information flow: save harasser photo and register.
 */
export async function handleHarassmentPhotoMessage(
    phoneNumber: string,
    mediaId: string
): Promise<ChatbotResponse> {
    await connectDB();

    const contact = await Contact.findOne({ phoneNumber });
    const language = contact?.language || 'english';
    const flow = await getFlowState(phoneNumber);

    if (!flow || flow.step !== 'awaiting_harassment_photo') {
        return {
            type: 'buttons',
            bodyText:
                language === 'english'
                    ? '📷 We are not collecting a photo at this step. Open *Information → Harassment* from the menu to submit a report.'
                    : '📷 अभी फोटो लेने का चरण नहीं है। *सूचना → छेड़खानी* से रिपोर्ट भेजें।',
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
        };
    }

    try {
        const { saveWhatsappImageToUploads } = await import('./whatsapp-media');
        const relativePath = await saveWhatsappImageToUploads(mediaId);
        const data = (flow.data || {}) as Record<string, unknown>;
        const prev = (data.complaintData as Record<string, unknown>) || {};
        const complaintType = String(data.complaintType || 'sub_info_misbehavior');
        const complaintData = { ...prev, missingPersonPhotoUrl: relativePath };

        return finalizeInfoComplaint(phoneNumber, language, complaintType, complaintData);
    } catch (err) {
        console.error('Harassment photo save failed:', err);
        return {
            type: 'buttons',
            bodyText:
                language === 'english'
                    ? `❌ *Could not save the photo*\n\nPlease try sending the image again, or tap *No photo / Skip*.`
                    : `❌ *फोटो सहेजी नहीं जा सकी*\n\nकृपया फोटो दोबारा भेजें, या *फोटो नहीं / आगे* चुनें।`,
            buttons: [
                { id: 'harassment_photo_skip', title: language === 'english' ? 'No photo / Skip' : 'फोटो नहीं / आगे' },
                { id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' },
            ],
            language,
        };
    }
}

/** Route inbound photos to the active missing-person or harassment flow. */
export async function handleFlowPhotoMessage(
    phoneNumber: string,
    mediaId: string
): Promise<ChatbotResponse> {
    const flow = await getFlowState(phoneNumber);
    if (flow?.step === 'awaiting_harassment_photo') {
        return handleHarassmentPhotoMessage(phoneNumber, mediaId);
    }
    return handleMissingPersonImageMessage(phoneNumber, mediaId);
}

function buildOfficeDirectoryRows(
    offices: ChatbotPoliceOffice[],
    language: 'english' | 'hindi'
): Array<{ id: string; title: string; description: string }> {
    return offices.slice(0, 10).map((o) => ({
        id: o.id,
        title: language === 'english' ? o.name.slice(0, 24) : o.nameHindi.slice(0, 24),
        description: language === 'english' ? 'Tap to get location' : 'स्थान पाने के लिए चुनें',
    }));
}

async function getOfficeDirectoryMenu(language: 'english' | 'hindi'): Promise<ChatbotResponse> {
    const allOffices = await getActivePoliceOfficesForChatbot();

    if (allOffices.length === 0) {
        return {
            type: 'buttons',
            bodyText:
                language === 'english'
                    ? '🏢 *Police Office Directory*\n\nNo offices are configured yet. Please try again later or contact the district control room.'
                    : '🏢 *पुलिस कार्यालय निर्देशिका*\n\nअभी कोई कार्यालय कॉन्फ़िगर नहीं है। कृपया बाद में पुनः प्रयास करें या जिला नियंत्रण कक्ष से संपर्क करें।',
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
            sendFollowUpMenu: false,
        };
    }

    const dspOffices = allOffices.filter((o) => o.category === 'dsp');
    const ciOffices = allOffices.filter((o) => o.category === 'ci');

    return {
        type: 'list',
        bodyText: language === 'english'
            ? '🏢 *Police Office Directory*\n\nSelect a DSP / SDPO or CI office to get its Google Maps location.'
            : '🏢 *पुलिस कार्यालय निर्देशिका*\n\nDSP / SDPO या CI कार्यालय चुनें — Google Maps लिंक मिलेगा।',
        buttonText: language === 'english' ? 'Select Office' : 'कार्यालय चुनें',
        sections: [
            {
                title: language === 'english' ? 'DSP / SDPO Offices' : 'DSP / SDPO कार्यालय',
                rows: buildOfficeDirectoryRows(dspOffices, language),
            },
            {
                title: language === 'english' ? 'CI Offices' : 'CI कार्यालय',
                rows: buildOfficeDirectoryRows(ciOffices, language),
            },
            {
                title: language === 'english' ? 'Navigation' : 'नेविगेशन',
                rows: [{ id: 'menu', title: language === 'english' ? '↩ Main Menu' : '↩ मुख्य मेनू', description: '' }],
            },
        ],
        language,
        sendFollowUpMenu: false,
    };
}

function buildOfficeLocationMessage(office: ChatbotPoliceOffice, language: 'english' | 'hindi'): ChatbotResponse {
    const mapLink = `https://www.google.com/maps?q=${office.lat},${office.lng}`;
    const officeName = language === 'english' ? office.name : office.nameHindi;
    const addressLine =
        (language === 'english' ? office.address : office.addressHindi) || '';
    const phoneLine = office.phone
        ? language === 'english'
            ? `📞 Contact: ${office.phone}\n`
            : `📞 संपर्क: ${office.phone}\n`
        : '';
    const addressBlock = addressLine ? `${addressLine}\n\n` : '';

    return {
        type: 'buttons',
        bodyText: language === 'english'
            ? `🏢 *${officeName}*\n\n${addressBlock}${phoneLine}📍 Location:\n${mapLink}`
            : `🏢 *${officeName}*\n\n${addressBlock}${phoneLine}📍 स्थान:\n${mapLink}`,
        buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
        language,
        sendFollowUpMenu: false,
    };
}

async function handleOfficeSelection(officeId: string, language: 'english' | 'hindi'): Promise<ChatbotResponse> {
    const officeKey = parseOfficeInteractiveId(officeId);
    if (!officeKey) {
        return {
            type: 'buttons',
            bodyText: language === 'english'
                ? '❌ Invalid selection. Please choose from the list.'
                : '❌ अमान्य चयन। कृपया सूची से चुनें।',
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
            sendFollowUpMenu: false,
        };
    }

    const office = await getPoliceOfficeByKey(officeKey);
    if (!office) {
        return {
            type: 'buttons',
            bodyText: language === 'english'
                ? '❌ This office is no longer available. Please open the directory again from the menu.'
                : '❌ यह कार्यालय अब उपलब्ध नहीं है। कृपया मेनू से निर्देशिका फिर खोलें।',
            buttons: [{ id: 'menu', title: language === 'english' ? 'Main Menu' : 'मुख्य मेनू' }],
            language,
            sendFollowUpMenu: false,
        };
    }

    return buildOfficeLocationMessage(office, language);
}
