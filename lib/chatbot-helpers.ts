import Complaint from '@/models/Complaint';
import Contact from '@/models/Contact';
import RawComplaint from '@/models/RawComplaint';

/**
 * Validate form input based on complaint type
 */
export function validateFormInput(
    formType: string,
    userInput: string,
    language: 'english' | 'hindi'
): { isValid: boolean; errorMessage?: string; data?: Record<string, unknown> } {
    const lines = userInput.trim().split('\n').map(line => line.trim()).filter(line => line);

    // Passport delay validation (PDF: Applicant name, Application No., Remarks)
    if (formType === 'sub_passport_delay') {
        if (lines.length < 3) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Name of Applicant\n*Line 2:* Passport Application Number\n*Line 3:* Remarks\n\n*Example:*\nRahul Kumar\nAB1234567\nVerification pending for 2 months\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* पासपोर्ट आवेदन संख्या\n*पंक्ति 3:* टिप्पणी\n\n*उदाहरण:*\nराहुल कुमार\nAB1234567\n2 महीने से सत्यापन लंबित\n\nकृपया पुनः प्रयास करें।`,
            };
        }

        return {
            isValid: true,
            data: {
                name: lines[0],
                applicationNumber: lines[1],
                remarks: lines.slice(2).join('\n'),
            },
        };
    }

    // Passport other issues (PDF: Applicant name, Application No., Report issue)
    if (formType === 'sub_passport_other') {
        if (lines.length < 3) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Name of Applicant\n*Line 2:* Passport Application Number\n*Line 3:* Report issue\n\n*Example:*\nPriya Sharma\nCD9876543\nDocument submission issue\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* पासपोर्ट आवेदन संख्या\n*पंक्ति 3:* समस्या विवरण\n\n*उदाहरण:*\nप्रिया शर्मा\nCD9876543\nदस्तावेज जमा करने में समस्या\n\nकृपया पुनः प्रयास करें।`,
            };
        }

        return {
            isValid: true,
            data: {
                name: lines[0],
                applicationNumber: lines[1],
                remarks: lines.slice(2).join('\n'),
            },
        };
    }

    // Petition issues
    if (formType.startsWith('sub_petition')) {
        if (lines.length < 6) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Issue Details\n\n*Example:*\nAmit Singh\nRakesh Singh\nWard 5, Hazaribagh\n9876543210\nHazaribagh Sadar Thana\nDetail of your issue here\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nअमित सिंह\nराकेश सिंह\nवार्ड 5, हजारीबाग\n9876543210\nहजारीबाग सदर थाना\nअपनी समस्या का विवरण यहाँ लिखें\n\nकृपया पुनः प्रयास करें।`,
            };
        }

        return {
            isValid: true,
            data: {
                name: lines[0],
                fatherName: lines[1],
                address: lines[2],
                policeStation: lines[4],
                remarks: `Contact No: ${lines[3]}\n\n${lines.slice(5).join(' ')}`,
            },
        };
    }

    // Information inputs
    if (formType.startsWith('sub_info_')) {
        if (lines.length < 6) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Information details\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* सूचना का विवरण\n\nकृपया पुनः प्रयास करें।`,
            };
        }

        return {
            isValid: true,
            data: {
                name: lines[0],
                fatherName: lines[1],
                address: lines[2],
                policeStation: lines[4],
                remarks: `Contact No: ${lines[3]}\n\n${lines.slice(5).join(' ')}`,
            },
        };
    }

    // Find my Police Station (PDF Section D — place name request)
    if (formType === 'sub_location_find_station') {
        if (lines.length < 5) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Your place name / landmark\n\n*Example:*\nAmit Singh\nRakesh Singh\nPelawal area, Hazaribagh\n9876543210\nNear Pelawal OP\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* अपने स्थान का नाम / लैंडमार्क\n\n*उदाहरण:*\nअमित सिंह\nराकेश सिंह\nपेलावल, हजारीबाग\n9876543210\nपेलावल ओपी के पास\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                fatherName: lines[1],
                address: lines[2],
                location: lines[4],
                remarks: `Mobile: ${lines[3]}${lines.length > 5 ? `\n\n${lines.slice(5).join('\n')}` : ''}`,
            },
        };
    }

    // Suggestion (PDF: Name, Father, Address, Mobile, Station, Suggestion)
    if (formType === 'suggestion_form') {
        if (lines.length < 6) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide (one per line):\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Your Suggestion\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रति पंक्ति एक विवरण भेजें:\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल\n*पंक्ति 5:* संबंधित थाना\n*पंक्ति 6:* सुझाव\n\nकृपया पुनः प्रयास करें।`,
            };
        }

        return {
            isValid: true,
            data: {
                name: lines[0],
                content: `Father's name: ${lines[1]}\nAddress: ${lines[2]}\nMobile: ${lines[3]}\nPolice station: ${lines[4]}\nSuggestion:\n${lines.slice(5).join('\n')}`,
            },
        };
    }

    // Traffic Jam
    if (formType === 'sub_traffic_jam') {
        if (lines.length < 4) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n1. Name\n2. Mobile Number\n3. Traffic jam location\n4. Remarks\n\n*Example:*\nRajeev Kumar\n9876543210\nTower Chowk\nHeavy traffic jam for 1 hour\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n1. नाम\n2. मोबाइल नंबर\n3. जाम का स्थान\n4. टिप्पणी\n\n*उदाहरण:*\nराजीव कुमार\n9876543210\nटावर चौक\n1 घंटे से भारी जाम है\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                location: lines[2],
                remarks: `Contact No: ${lines[1]}\n\n${lines.slice(3).join(' ')}`,
            },
        };
    }

    // Traffic Challan (PDF: Name, Father, Address, Mobile, Challan No., Report issue)
    if (formType === 'sub_traffic_challan') {
        if (lines.length < 6) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide (one per line):\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Challan Number\n*Line 6:* Report issue\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रति पंक्ति एक विवरण भेजें (नाम, पिता, पता, मोबाइल, चालान नंबर, समस्या)।\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                fatherName: lines[1],
                address: lines[2],
                challanNumber: lines[4],
                remarks: `Mobile: ${lines[3]}\nIssue: ${lines.slice(5).join(' ')}`,
            },
        };
    }

    // Traffic Other (PDF: Name, Father, Address, Mobile, Station, Report issue)
    if (formType === 'sub_traffic_other') {
        if (lines.length < 6) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide (one per line):\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Report issue\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रति पंक्ति एक विवरण भेजें।\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                fatherName: lines[1],
                address: lines[2],
                policeStation: lines[4],
                remarks: `Mobile: ${lines[3]}\nIssue: ${lines.slice(5).join(' ')}`,
            },
        };
    }

    // Character delay (PDF: Name, Character verification application no., Remarks)
    if (formType === 'sub_character_delay') {
        if (lines.length < 3) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Name of Applicant\n*Line 2:* Character Verification Application Number\n*Line 3:* Remarks\n\n*Example:*\nSunil Verma\nCH12345\nVerification delayed by 15 days\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* चरित्र सत्यापन आवेदन संख्या\n*पंक्ति 3:* टिप्पणी\n\n*उदाहरण:*\nसुनील वर्मा\nCH12345\nसत्यापन 15 दिनों से लंबित है\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                applicationNumber: lines[1],
                remarks: lines.slice(2).join('\n'),
            },
        };
    }

    // Character other (PDF: Name, Character application no., Report issue)
    if (formType === 'sub_character_other') {
        if (lines.length < 3) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Name of Applicant\n*Line 2:* Character Application Number\n*Line 3:* Report issue\n\n*Example:*\nSunil Verma\nCH12345\nName misspelled in application\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* आवेदक का नाम\n*पंक्ति 2:* चरित्र आवेदन संख्या\n*पंक्ति 3:* समस्या विवरण\n\n*उदाहरण:*\nसुनील वर्मा\nCH12345\nआवेदन में नाम की वर्तनी गलत है\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                applicationNumber: lines[1],
                remarks: lines.slice(2).join('\n'),
            },
        };
    }

    // Lost Mobile (only "Not Satisfied" is handled here; "Report Lost Mobile" redirects to CEIR portal)
    if (formType === 'sub_lost_mobile_not_satisfied') {
        if (lines.length < 6) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Lost Mobile Number\n*Line 6:* Concerned Police Station\n\n*Example:*\nSanjay Sharma\nRahul Sharma\nSadar, Hazaribagh\n9876543210\n9876543211\nHazaribagh Sadar Thana\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* खोया मोबाइल नंबर\n*पंक्ति 6:* संबंधित पुलिस स्टेशन\n\n*उदाहरण:*\nसंजय शर्मा\nराहुल शर्मा\nसदर, हजारीबाग\n9876543210\n9876543211\nहजारीबाग सदर थाना\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                fatherName: lines[1],
                address: lines[2],
                lostMobileNumber: lines[4],
                policeStation: lines[5],
                remarks: `Contact No: ${lines[3]}\n\n${lines.slice(6).join(' ')}`, // If they provide extra info
            },
        };
    }

    // Cyber Crime (only "Other Issues" is handled here; "Report Cyber Crime" redirects to cybercrime.gov.in / 1930)
    if (formType === 'sub_cyber_other') {
        if (lines.length < 6) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Concerned Police Station\n*Line 6:* Report issue\n\n*Example:*\nKamal Roy\nBijay Roy\nSadar, Hazaribagh\n9876543210\nCyber P.S.\nAmount fraudulently deducted from my account\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* संबंधित पुलिस स्टेशन\n*पंक्ति 6:* समस्या विवरण\n\n*उदाहरण:*\nकमल रॉय\nबिजय रॉय\nसदर, हजारीबाग\n9876543210\nसाइबर पीएस\nमेरे खाते से धोखाधड़ी से पैसे काटे गए\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                fatherName: lines[1],
                address: lines[2],
                policeStation: lines[4],
                remarks: `Contact No: ${lines[3]}\n\n${lines.slice(5).join(' ')}`,
            },
        };
    }

    // Missing person (station is selected in next actionable step)
    if (formType === 'sub_missing_person') {
        if (lines.length < 5) {
            return {
                isValid: false,
                errorMessage: language === 'english'
                    ? `❌ *Incomplete Information*\n\nPlease provide:\n\n*Line 1:* Your Name\n*Line 2:* Father's Name\n*Line 3:* Address\n*Line 4:* Mobile Number\n*Line 5:* Missing person details\n\n*Example:*\nAnita Kumari\nRamesh Prasad\nSadar, Hazaribagh\n9876543210\nMy younger brother (age 17) is missing since yesterday evening from Lake Road area.\n\nPlease try again.`
                    : `❌ *अधूरी जानकारी*\n\nकृपया प्रदान करें:\n\n*पंक्ति 1:* आपका नाम\n*पंक्ति 2:* पिता का नाम\n*पंक्ति 3:* पता\n*पंक्ति 4:* मोबाइल नंबर\n*पंक्ति 5:* लापता व्यक्ति का विवरण\n\n*उदाहरण:*\nअनीता कुमारी\nरमेश प्रसाद\nसदर, हजारीबाग\n9876543210\nमेरा छोटा भाई (उम्र 17 वर्ष) कल शाम से लेक रोड क्षेत्र से लापता है।\n\nकृपया पुनः प्रयास करें।`,
            };
        }
        return {
            isValid: true,
            data: {
                name: lines[0],
                fatherName: lines[1],
                address: lines[2],
                remarks: `Contact No: ${lines[3]}\n\n${lines.slice(4).join(' ')}`,
            },
        };
    }

    // Default
    return {
        isValid: true,
        data: {
            name: lines[0] || 'Not provided',
            remarks: userInput,
        },
    };
}

/**
 * Persist a submission that failed structured validation (wrong line count / format).
 * Stored as a single raw text blob for staff review.
 */
export async function saveRawComplaint(
    phoneNumber: string,
    rawText: string,
    flowStep: string
): Promise<string | null> {
    const connectDB = (await import('./db')).default;
    await connectDB();

    const doc = await RawComplaint.create({
        phoneNumber,
        rawText,
        flowStep,
        status: 'pending',
    });

    return doc.rawComplaintId || null;
}

/**
 * Save complaint to database
 */
export async function saveComplaint(
    phoneNumber: string,
    complaintType: string,
    data: Record<string, unknown>
): Promise<string | null> {
    // Import database connection
    const connectDB = (await import('./db')).default;
    await connectDB();

    // Check if it's a review/suggestion
    if (complaintType === 'suggestion_form') {
        const Review = (await import('@/models/Review')).default;
        await Review.create({
            phoneNumber,
            name: String(data.name || ''),
            content: String(data.content || ''),
            status: 'pending',
        });
        return null;
    }

    // Convert sub_xxx to xxx format for database
    const dbComplaintType = complaintType.replace('sub_', '');

    const complaint = await Complaint.create({
        phoneNumber,
        complaintType: dbComplaintType,
        ...data,
        status: 'pending',
    });

    // complaintId is set by the pre-save hook
    return complaint.complaintId || null;
}

/**
 * Handle form submission
 */
export async function handleFormSubmission(
    phoneNumber: string,
    userInput: string,
    flowState: { step: string; data?: Record<string, unknown> }
): Promise<{
    success: boolean;
    message: string;
    language: 'english' | 'hindi';
    sendFollowUpMenu?: boolean;
    awaitLocation?: boolean;
    awaitStationSelection?: boolean;
    deferredComplaintType?: string;
    deferredComplaintData?: Record<string, unknown>;
}> {
    // Import database connection
    const connectDB = (await import('./db')).default;
    await connectDB();

    const contact = await Contact.findOne({ phoneNumber });
    const language = contact?.language || 'english';

    // Validate input
    const validationResult = validateFormInput(flowState.step, userInput, language);

    if (!validationResult.isValid) {
        try {
            await saveRawComplaint(phoneNumber, userInput, flowState.step);
        } catch (err) {
            console.error('Error saving raw (invalid-format) complaint:', err);
        }
        return {
            success: false,
            message: validationResult.errorMessage || '',
            language,
        };
    }

    // Information flow requires one extra step:
    // collect live location first, then register complaint.
    if (flowState.step.startsWith('sub_info_')) {
        return {
            success: true,
            message: language === 'english'
                ? `📍 *Final Step Required*\n\nPlease share your *live location* now to complete complaint registration.\n\nTap the location button sent by WhatsApp and submit your current location.`
                : `📍 *अंतिम चरण आवश्यक*\n\nशिकायत दर्ज पूरी करने के लिए कृपया अब अपना *लाइव लोकेशन* साझा करें।\n\nव्हाट्सएप में भेजे गए लोकेशन बटन पर टैप करके अपना वर्तमान स्थान भेजें।`,
            language,
            awaitLocation: true,
            deferredComplaintType: flowState.step,
            deferredComplaintData: validationResult.data || {},
        };
    }

    // Selected flows require final police-station selection from master data.
    const stationSelectionSteps = new Set([
        'sub_passport_delay',
        'sub_passport_other',
        'sub_character_delay',
        'sub_character_other',
        'sub_traffic_jam',
        'sub_traffic_challan',
        'sub_missing_person',
    ]);
    if (stationSelectionSteps.has(flowState.step)) {
        return {
            success: true,
            message: language === 'english'
                ? `🏢 *Final Step Required*\n\nPlease select the concerned police station to complete complaint registration.`
                : `🏢 *अंतिम चरण आवश्यक*\n\nशिकायत दर्ज पूरी करने के लिए कृपया संबंधित पुलिस स्टेशन चुनें।`,
            language,
            awaitStationSelection: true,
            deferredComplaintType: flowState.step,
            deferredComplaintData: validationResult.data || {},
        };
    }

    // Save to database
    try {
        const complaintId = await saveComplaint(phoneNumber, flowState.step, validationResult.data || {});

        // Success message
        if (flowState.step === 'suggestion_form') {
            if (language === 'english') {
                return {
                    success: true,
                    message: `✅ *Suggestion/Review Submitted*\n\nThank you for your valuable suggestion/review. We appreciate your input!`,
                    language,
                    sendFollowUpMenu: true,
                };
            } else {
                return {
                    success: true,
                    message: `✅ *सुझाव/समीक्षा जमा की गई*\n\nआपके बहुमूल्य सुझाव/समीक्षा के लिए धन्यवाद। हम इसकी सराहना करते हैं!`,
                    language,
                    sendFollowUpMenu: true,
                };
            }
        }

        const idLine = complaintId
            ? language === 'english'
                ? `\n\n🆔 *Complaint ID: ${complaintId}*\n_Please save this ID to track your complaint._`
                : `\n\n🆔 *शिकायत आईडी: ${complaintId}*\n_इस आईडी को सुरक्षित रखें, आपकी शिकायत ट्रैक करने के काम आएगी।_`
            : '';

        if (language === 'english') {
            return {
                success: true,
                message: `✅ *Complaint Registered Successfully*\n\nYour complaint has been registered. Our team will review it and take appropriate action.${idLine}\n\nYou will be contacted soon. Thank you for your patience.`,
                language,
                sendFollowUpMenu: true,
            };
        } else {
            return {
                success: true,
                message: `✅ *शिकायत सफलतापूर्वक दर्ज*\n\nआपकी शिकायत दर्ज कर ली गई है। हमारी टीम इसकी समीक्षा करेगी और उचित कार्रवाई करेगी।${idLine}\n\nजल्द ही आपसे संपर्क किया जाएगा। आपके धैर्य के लिए धन्यवाद।`,
                language,
                sendFollowUpMenu: true,
            };
        }
    } catch (error) {
        console.error('Error saving complaint:', error);

        if (language === 'english') {
            return {
                success: false,
                message: `❌ *Error*\n\nSorry, there was an error saving your complaint. Please try again later or contact us directly.`,
                language,
            };
        } else {
            return {
                success: false,
                message: `❌ *त्रुटि*\n\nक्षमा करें, आपकी शिकायत सहेजने में त्रुटि हुई। कृपया बाद में पुनः प्रयास करें या हमसे सीधे संपर्क करें।`,
                language,
            };
        }
    }
}
