import Complaint from '@/models/Complaint';
import Review from '@/models/Review';
import connectDB from './db';
import {
    getComplaintStatusLabel,
    getComplaintTypeLabel,
    getReviewStatusLabel,
} from './complaint-labels';

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
const MAX_REVIEWS = 3;

export async function buildMyActivitiesMessage(
    phoneNumber: string,
    language: 'english' | 'hindi'
): Promise<string> {
    await connectDB();
    const variants = phoneLookupVariants(phoneNumber);

    const [complaints, reviews] = await Promise.all([
        Complaint.find({ phoneNumber: { $in: variants } })
            .sort({ createdAt: -1 })
            .limit(MAX_COMPLAINTS)
            .select('complaintId complaintType status policeStation createdAt name')
            .lean(),
        Review.find({ phoneNumber: { $in: variants } })
            .sort({ createdAt: -1 })
            .limit(MAX_REVIEWS)
            .select('status createdAt content')
            .lean(),
    ]);

    if (complaints.length === 0 && reviews.length === 0) {
        return language === 'english'
            ? `📋 *My activities*\n\nNo complaints or suggestions were found for this WhatsApp number.\n\nIf you recently submitted details, wait a moment and check again. Use the menu to register a new request.`
            : `📋 *मेरी गतिविधियाँ*\n\nइस व्हाट्सएप नंबर पर कोई शिकायत या सुझाव नहीं मिला।\n\nयदि आपने अभी विवरण भेजा है, थोड़ी देर बाद पुनः देखें। नई रिक्वेस्ट के लिए मेनू का उपयोग करें।`;
    }

    const lines: string[] = [];
    lines.push(language === 'english' ? `📋 *My activities*` : `📋 *मेरी गतिविधियाँ*`);
    lines.push(
        language === 'english'
            ? `_Showing latest submissions from this number._`
            : `_इस नंबर से दर्ज हाल की प्रविष्टियाँ।_`
    );
    lines.push('');

    if (complaints.length > 0) {
        lines.push(language === 'english' ? `*Complaints (${complaints.length} recent)*` : `*शिकायतें (${complaints.length} हाल की)*`);
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
    }

    if (reviews.length > 0) {
        lines.push(language === 'english' ? `*Suggestions (${reviews.length} recent)*` : `*सुझाव (${reviews.length} हाल के)*`);
        reviews.forEach((r, i) => {
            const status = getReviewStatusLabel(String(r.status || 'pending'), language);
            const date = r.createdAt ? formatDateIST(new Date(r.createdAt), language) : '';
            const preview = String(r.content || '').trim().slice(0, 60);
            lines.push(`${i + 1}. ${language === 'english' ? 'Suggestion' : 'सुझाव'}`);
            lines.push(`   ${language === 'english' ? 'Status' : 'स्थिति'}: *${status}*`);
            if (preview) lines.push(`   ${preview}${preview.length >= 60 ? '…' : ''}`);
            if (date) lines.push(`   ${date}`);
            lines.push('');
        });
    }

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
