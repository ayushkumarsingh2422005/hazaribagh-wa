import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db';
import RawComplaint from '@/models/RawComplaint';
import Contact from '@/models/Contact';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

function displayNameFromRaw(rawText: string): string {
    const first = rawText.trim().split('\n')[0]?.trim();
    if (first && first.length <= 80) return first;
    if (first) return `${first.slice(0, 77)}…`;
    return 'Citizen';
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();
        await connectDB();

        const updateData: Record<string, string | Date> = { status: data.status };
        if (data.assignedTo) updateData.assignedTo = data.assignedTo;
        if (data.status === 'resolved') updateData.resolvedAt = new Date();

        const rawComplaint = await RawComplaint.findByIdAndUpdate(id, updateData, { new: true });
        if (!rawComplaint) {
            return NextResponse.json({ error: 'Raw complaint not found' }, { status: 404 });
        }

        if (data.status === 'resolved' && rawComplaint.phoneNumber) {
            try {
                const contact = await Contact.findOne({ phoneNumber: rawComplaint.phoneNumber });
                const language = contact?.language || 'english';
                const cid = rawComplaint.rawComplaintId || id;
                const name = displayNameFromRaw(rawComplaint.rawText);

                const message =
                    language === 'english'
                        ? `✅ *Your Submission Has Been Resolved*\n\n🆔 Reference ID: *${cid}*\n\nDear ${name},\n\nWe are pleased to inform you that the matter you raised with Deoghar Police (submitted in non-standard format) has been reviewed and resolved.\n\nIf you still need help, please contact us again or call *112*.\n\n_Deoghar Police Official WhatsApp Chatbot_`
                        : `✅ *आपका प्रकरण हल हो गया है*\n\n🆔 संदर्भ आईडी: *${cid}*\n\nप्रिय ${name},\n\nहमें यह सूचित करते हुए प्रसन्नता है कि देवघर पुलिस में आपके द्वारा भेजा गया विवरण (गैर-मानक प्रारूप में) समीक्षा कर लिया गया है और समाधान कर दिया गया है।\n\nयदि आपको अभी भी सहायता चाहिए, तो कृपया फिर से संपर्क करें या *112* पर कॉल करें।\n\n_देवघर पुलिस आधिकारिक व्हाट्सएप चैटबॉट_`;

                await sendWhatsAppMessage({ to: rawComplaint.phoneNumber, text: message });
            } catch (notifyErr) {
                console.error('Failed to send raw complaint resolution notification:', notifyErr);
            }
        }

        return NextResponse.json({ success: true, rawComplaint });
    } catch (error) {
        console.error('Error updating raw complaint:', error);
        return NextResponse.json({ error: 'Failed to update raw complaint' }, { status: 500 });
    }
}
