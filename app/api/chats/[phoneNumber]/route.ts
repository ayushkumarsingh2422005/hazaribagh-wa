import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import Contact from '@/models/Contact';
import {
    apiForbidden,
    apiUnauthorized,
    getApiAuthAdminUser,
    getScopedPhoneNumbers,
} from '@/lib/admin-auth';
import { hasSectionAccess } from '@/lib/admin-permissions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ phoneNumber: string }> }
) {
    try {
        const user = await getApiAuthAdminUser();
        if (!user) return apiUnauthorized();
        if (!hasSectionAccess(user, 'chats') || !user.canAccessChats) return apiForbidden();

        await connectDB();
        const { phoneNumber } = await params;

        const scopedPhones = await getScopedPhoneNumbers(user);
        if (scopedPhones?.length && !scopedPhones.includes(phoneNumber)) {
            return apiForbidden();
        }

        const messages = await ChatMessage.find({ phoneNumber }).sort({ timestamp: 1 }).lean();

        await Contact.updateOne({ phoneNumber }, { $set: { unreadCount: 0 } });

        return NextResponse.json({
            success: true,
            messages: messages.map(m => ({ ...m, _id: m._id.toString() })),
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
