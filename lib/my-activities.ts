import Complaint from '@/models/Complaint';
import connectDB from './db';
import { COMPLAINT_TYPES_EXCLUDED_FROM_MY_ACTIVITIES } from './chatbot-helpers';
import { getComplaintStatusLabel, getComplaintTypeLabel } from './complaint-labels';

/** Match complaints saved under slightly different WhatsApp number formats. */
export function phoneLookupVariants(phone: string): string[] {
    const digits = phone.replace(/\D/g, '');
    const variants = new Set<string>();
    if (phone.trim()) variants.add(phone.trim());
    if (digits) {
        variants.add(digits);
        if (digits.length === 10) variants.add(`91${digits}`);
        if (digits.startsWith('91') && digits.length === 12) variants.add(digits.slice(2));
    }
    return [...variants];
}

function formatDateIST(date: Date, language: 'english' | 'hindi'): string {
    return date.toLocaleString(language === 'english' ? 'en-IN' : 'hi-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const MAX_COMPLAINTS = 8;

export async function buildMyActivitiesMessage(
    phoneNumber: string,
    language: 'english' | 'hindi'
): Promise<string> {
    await connectDB();
    const variants = phoneLookupVariants(phoneNumber);

    const complaints = await Complaint.find({
        phoneNumber: { $in: variants },
        complaintType: { $nin: [...COMPLAINT_TYPES_EXCLUDED_FROM_MY_ACTIVITIES] },
        complaintId: { $exists: true, $nin: [null, ''] },
    })
        .sort({ createdAt: -1 })
        .limit(MAX_COMPLAINTS)
        .select('complaintId complaintType status policeStation createdAt name')
        .lean();

    if (complaints.length === 0) {
        return language === 'english'
            ? `📋 *My activities*\n\nNo trackable complaints were found for this WhatsApp number.\n\nOnly complaints registered with a *Complaint ID* appear here (Passport, Character, Petition, Cyber, etc.).\n\nUse the menu to register a new complaint.`
            : `📋 *मेरी गतिविधियाँ*\n\nइस व्हाट्सएप नंबर पर कोई ट्रैक योग्य शिकायत नहीं मिली।\n\nयहाँ केवल *शिकायत आईडी* वाली शिकायतें दिखती हैं (पासपोर्ट, चरित्र, याचिका, साइबर आदि)।\n\nनई शिकायत के लिए मेनू का उपयोग करें।`;
    }

    const lines: string[] = [];
    lines.push(language === 'english' ? `📋 *My activities*` : `📋 *मेरी गतिविधियाँ*`);
    lines.push(
        language === 'english'
            ? `_Complaints with a Complaint ID from this number._`
            : `_इस नंबर से दर्ज शिकायतें (शिकायत आईडी के साथ)._`
    );
    lines.push('');

    lines.push(
        language === 'english'
            ? `*Complaints (${complaints.length} recent)*`
            : `*शिकायतें (${complaints.length} हाल की)*`
    );
    complaints.forEach((c, i) => {
        const id = c.complaintId ? String(c.complaintId) : '—';
        const type = getComplaintTypeLabel(String(c.complaintType), language);
        const status = getComplaintStatusLabel(String(c.status || 'pending'), language);
        const date = c.createdAt ? formatDateIST(new Date(c.createdAt), language) : '';
        const ps = c.policeStation ? String(c.policeStation) : '';
        lines.push(`${i + 1}. *${id}*`);
        lines.push(`   ${type}`);
        lines.push(`   ${language === 'english' ? 'Status' : 'स्थिति'}: *${status}*`);
        if (ps && ps !== 'Not Known') {
            lines.push(`   ${language === 'english' ? 'Station' : 'थाना'}: ${ps}`);
        }
        if (date) lines.push(`   ${date}`);
        lines.push('');
    });

    lines.push(
        language === 'english'
            ? `_For emergencies call *112*. District Control Room: *8002529348*_`
            : `_आपातकाल में *112* पर कॉल करें। जिला नियंत्रण कक्ष: *8002529348*_`
    );

    let message = lines.join('\n');
    if (message.length > 3900) {
        message = `${message.slice(0, 3850)}\n\n…`;
    }
    return message;
}
