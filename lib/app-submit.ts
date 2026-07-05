import Complaint, { type ComplaintType } from '@/models/Complaint';
import Review from '@/models/Review';
import connectDB from './db';
import { notifyPoliceStationComplaintAlert } from './police-station-alert';
import { COMPLAINT_TYPES_EXCLUDED_FROM_MY_ACTIVITIES } from './chatbot-helpers';

const COMPLAINT_TYPES_HIDE_ID = new Set([
    'traffic_jam',
    'traffic_challan',
    'traffic_other',
    'lost_mobile_not_satisfied',
    'missing_person',
    ...['info_extortion', 'info_adebazi', 'info_misbehavior', 'info_drugs', 'info_absconders', 'info_illegal', 'info_other'],
]);

export type AppSubmitPayload = {
    complaintType: string;
    language?: 'english' | 'hindi';
    data: Record<string, unknown>;
};

function isValidMobile(value: unknown): boolean {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) return true;
    if (digits.length === 12 && digits.startsWith('91')) return true;
    return false;
}

function requireFields(
    data: Record<string, unknown>,
    fields: string[],
    language: 'english' | 'hindi'
): string | null {
    for (const f of fields) {
        if (!String(data[f] ?? '').trim()) {
            return language === 'english'
                ? `Missing required field: ${f}`
                : `आवश्यक फ़ील्ड गायब: ${f}`;
        }
    }
    return null;
}

function buildRemarks(parts: Record<string, string>): string {
    return Object.entries(parts)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
}

export function shouldHideComplaintId(type: string): boolean {
    return COMPLAINT_TYPES_HIDE_ID.has(type);
}

export async function submitAppComplaint(
    phoneNumber: string,
    payload: AppSubmitPayload
): Promise<{
    success: boolean;
    complaintId?: string | null;
    hideComplaintId?: boolean;
    message?: string;
    error?: string;
}> {
    await connectDB();
    const language = payload.language || 'english';
    const type = payload.complaintType.replace(/^sub_/, '') as ComplaintType;
    const data = payload.data || {};

    // Suggestion → Review
    if (type === 'suggestion') {
        const err = requireFields(data, ['name', 'fatherName', 'address', 'mobile', 'policeStation', 'suggestion'], language);
        if (err) return { success: false, error: err };
        if (!isValidMobile(data.mobile)) {
            return { success: false, error: language === 'english' ? 'Invalid mobile number.' : 'अमान्य मोबाइल नंबर।' };
        }
        await Review.create({
            phoneNumber,
            name: String(data.name),
            content: buildRemarks({
                "Father's name": String(data.fatherName),
                Address: String(data.address),
                Mobile: String(data.mobile),
                'Police station': String(data.policeStation),
                Suggestion: String(data.suggestion),
            }),
            status: 'pending',
        });
        return {
            success: true,
            hideComplaintId: true,
            message:
                language === 'english'
                    ? 'Thank you for your suggestion. We appreciate your input!'
                    : 'आपके सुझाव के लिए धन्यवाद।',
        };
    }

    let complaintData: Record<string, unknown> = { name: String(data.name || '') };

    switch (type) {
        case 'passport_delay':
        case 'passport_other':
        case 'character_delay':
        case 'character_other': {
            const err = requireFields(data, ['name', 'applicationNumber', 'location', 'mobile', 'policeStation', 'remarks'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                applicationNumber: data.applicationNumber,
                location: data.location,
                policeStation: data.policeStation,
                remarks: buildRemarks({ Mobile: String(data.mobile), Details: String(data.remarks) }),
            };
            break;
        }
        case 'petition_not_visited':
        case 'petition_not_satisfied':
        case 'petition_other': {
            const err = requireFields(data, ['name', 'fatherName', 'address', 'mobile', 'issueDetails', 'policeStation'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                fatherName: data.fatherName,
                address: data.address,
                policeStation: data.policeStation,
                remarks: buildRemarks({ Mobile: String(data.mobile), Details: String(data.issueDetails) }),
            };
            break;
        }
        case 'lost_mobile_not_satisfied': {
            const err = requireFields(data, ['name', 'mobile', 'lostMobileNumber', 'imei', 'policeStation'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                policeStation: data.policeStation,
                lostMobileNumber: data.lostMobileNumber,
                remarks: buildRemarks({
                    Mobile: String(data.mobile),
                    IMEI: String(data.imei),
                }),
            };
            break;
        }
        case 'traffic_jam': {
            const err = requireFields(data, ['name', 'mobile', 'location', 'policeStation', 'remarks'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                location: data.location,
                policeStation: data.policeStation,
                remarks: buildRemarks({ Mobile: String(data.mobile), Details: String(data.remarks) }),
            };
            break;
        }
        case 'traffic_challan': {
            const err = requireFields(data, ['name', 'mobile', 'challanNumber', 'policeStation', 'remarks'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                challanNumber: data.challanNumber,
                policeStation: data.policeStation,
                remarks: buildRemarks({ Mobile: String(data.mobile), Details: String(data.remarks) }),
            };
            break;
        }
        case 'traffic_other': {
            const err = requireFields(data, ['name', 'mobile', 'policeStation', 'remarks'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                policeStation: data.policeStation,
                remarks: buildRemarks({ Mobile: String(data.mobile), Details: String(data.remarks) }),
            };
            break;
        }
        case 'missing_person': {
            const err = requireFields(data, ['name', 'mobile', 'policeStation', 'address', 'details'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                policeStation: data.policeStation,
                address: data.address,
                remarks: buildRemarks({
                    Mobile: String(data.mobile),
                    'Missing person': String(data.details),
                }),
                missingPersonPhotoUrl: data.photoUrl || undefined,
            };
            break;
        }
        case 'cyber_other': {
            const err = requireFields(data, ['name', 'fatherName', 'address', 'mobile', 'policeStation', 'remarks'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                fatherName: data.fatherName,
                address: data.address,
                policeStation: data.policeStation,
                remarks: buildRemarks({ Mobile: String(data.mobile), Details: String(data.remarks) }),
            };
            break;
        }
        case 'info_adebazi': {
            const err = requireFields(data, ['name', 'mobile', 'details', 'place', 'policeStation'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                location: data.place,
                policeStation: data.policeStation,
                remarks: buildRemarks({
                    Mobile: String(data.mobile),
                    Details: String(data.details),
                    Place: String(data.place),
                    ...(data.gps ? { GPS: String(data.gps) } : {}),
                }),
            };
            break;
        }
        case 'info_misbehavior': {
            const err = requireFields(data, ['name', 'mobile', 'place', 'policeStation', 'details'], language);
            if (err) return { success: false, error: err };
            if (!data.gps) {
                return {
                    success: false,
                    error: language === 'english' ? 'Incident location (GPS) is required.' : 'घटना का स्थान (GPS) आवश्यक है।',
                };
            }
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                location: data.place,
                policeStation: data.policeStation,
                missingPersonPhotoUrl: data.photoUrl || undefined,
                remarks: buildRemarks({
                    Mobile: String(data.mobile),
                    Place: String(data.place),
                    Details: String(data.details),
                    GPS: String(data.gps),
                }),
            };
            break;
        }
        case 'info_drugs':
        case 'info_illegal': {
            const err = requireFields(data, ['name', 'mobile', 'place', 'policeStation', 'details'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                location: data.place,
                policeStation: data.policeStation,
                remarks: buildRemarks({
                    Mobile: String(data.mobile),
                    Place: String(data.place),
                    Details: String(data.details),
                }),
            };
            break;
        }
        case 'info_absconders': {
            const err = requireFields(
                data,
                ['name', 'mobile', 'absconderName', 'caseDetails', 'lastSeen', 'policeStation'],
                language
            );
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                location: data.lastSeen,
                policeStation: data.policeStation,
                remarks: buildRemarks({
                    Mobile: String(data.mobile),
                    Absconder: String(data.absconderName),
                    'Case details': String(data.caseDetails),
                    'Last seen': String(data.lastSeen),
                    ...(data.gps ? { GPS: String(data.gps) } : {}),
                }),
            };
            break;
        }
        case 'info_other': {
            const err = requireFields(data, ['name', 'mobile', 'policeStation', 'details'], language);
            if (err) return { success: false, error: err };
            if (!isValidMobile(data.mobile)) return { success: false, error: 'Invalid mobile number.' };
            complaintData = {
                name: data.name,
                policeStation: data.policeStation,
                remarks: buildRemarks({
                    Mobile: String(data.mobile),
                    Details: String(data.details),
                }),
            };
            break;
        }
        default:
            return { success: false, error: `Unsupported complaint type: ${type}` };
    }

    const complaint = await Complaint.create({
        phoneNumber,
        complaintType: type,
        source: 'app',
        ...complaintData,
        status: 'pending',
    });

    await notifyPoliceStationComplaintAlert({
        policeStationName: String(complaintData.policeStation || ''),
        citizenPhone: phoneNumber,
        complaintId: complaint.complaintId || null,
        complaintType: complaint.complaintType,
        complainantName: String(complaintData.name || ''),
        missingPersonPhotoUrl: String(complaintData.missingPersonPhotoUrl || ''),
    });

    const hideId = shouldHideComplaintId(type);
    const isInfo = type.startsWith('info_');
    const isMissing = type === 'missing_person';

    let message: string;
    if (isInfo) {
        message =
            language === 'english'
                ? 'Thank you. Your information has been received. Hazaribagh Police appreciates your cooperation.'
                : 'धन्यवाद। आपकी सूचना प्राप्त हो गई है।';
    } else if (isMissing) {
        message =
            language === 'english'
                ? 'Missing person information submitted. Please visit the concerned police station to register formally.'
                : 'लापता व्यक्ति की सूचना दर्ज। कृपया औपचारिक शिकायत के लिए थाने में जाएं।';
    } else {
        const idLine =
            !hideId && complaint.complaintId
                ? language === 'english'
                    ? `\n\nComplaint ID: ${complaint.complaintId}`
                    : `\n\nशिकायत आईडी: ${complaint.complaintId}`
                : '';
        message =
            language === 'english'
                ? `Complaint registered successfully.${idLine}`
                : `शिकायत सफलतापूर्वक दर्ज।${idLine}`;
    }

    return {
        success: true,
        complaintId: complaint.complaintId || null,
        hideComplaintId: hideId,
        message,
    };
}

export { COMPLAINT_TYPES_EXCLUDED_FROM_MY_ACTIVITIES };
