import PoliceStation from '@/models/PoliceStation';
import connectDB from './db';
import { sendWhatsAppMessage } from './whatsapp';

/** User chose "unknown" station — do not WhatsApp any PS contact. */
const UNKNOWN_STATION_MARKERS = [
    'not known',
    'unknown',
    'not sure',
    "don't know",
    'dont know',
    'do not know',
    'नहीं पता',
    'पता नहीं',
];

export function shouldSkipPoliceStationAlert(stationRaw: unknown): boolean {
    const station = String(stationRaw ?? '').trim();
    if (!station) return true;
    const lower = station.toLowerCase();
    return UNKNOWN_STATION_MARKERS.some(m => lower === m || lower.includes(m));
}

/**
 * WhatsApp Cloud API expects country-code + MSISDN, digits only (no +).
 * India (+91): 10-digit mobiles become 91XXXXXXXXXX.
 */
export function normalizeIndiaWhatsAppTo(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return null;
    let n = digits.startsWith('0') ? digits.replace(/^0+/, '') : digits;
    if (n.length === 10) n = `91${n}`;
    if (n.length < 10 || n.length > 15) return null;
    return n;
}

/**
 * Sends a concise alert to the police station WhatsApp associated with MongoDB PoliceStation record.
 * Never throws — failures are logged; citizen registration already succeeded.
 */
export async function notifyPoliceStationComplaintAlert(params: {
    policeStationName: string;
    citizenPhone: string;
    complaintId: string | null;
    complaintType: string;
    complainantName?: string;
}): Promise<void> {
    if (shouldSkipPoliceStationAlert(params.policeStationName)) return;

    try {
        await connectDB();
        const label = params.policeStationName.trim();

        let doc =
            (await PoliceStation.findOne({
                isActive: true,
                $or: [{ name: label }, { nameHindi: label }],
            })
                .select('name nameHindi contactNumber')
                .lean()) || null;

        if (!doc) {
            const lower = label.toLowerCase();
            const candidates = await PoliceStation.find({ isActive: true })
                .select('name nameHindi contactNumber')
                .lean();
            doc =
                candidates.find(
                    s =>
                        String(s.name || '').toLowerCase() === lower ||
                        String(s.nameHindi || '').toLowerCase() === lower
                ) || null;
        }

        if (!doc?.contactNumber) {
            console.warn('[PS alert] No active station or contact for:', label);
            return;
        }

        const to = normalizeIndiaWhatsAppTo(String(doc.contactNumber));
        if (!to) {
            console.warn('[PS alert] Invalid contact number for station:', doc.name, doc.contactNumber);
            return;
        }

        const typeReadable = params.complaintType.replace(/_/g, ' ');
        const nameLine = params.complainantName?.trim()
            ? `\n*Complainant name:* ${params.complainantName.trim()}`
            : '';
        const idLine = params.complaintId ? `\n*Complaint ID:* ${params.complaintId}` : '';

        const text = `🔔 *Hazaribagh Police — New registration*

*Station:* ${doc.name}
*Type:* ${typeReadable}${idLine}
*Citizen WhatsApp:* ${params.citizenPhone}${nameLine}

Please review in the admin dashboard.`;

        await sendWhatsAppMessage({ to, text });
    } catch (err) {
        console.error('[PS alert] Failed (non-blocking):', err);
    }
}
