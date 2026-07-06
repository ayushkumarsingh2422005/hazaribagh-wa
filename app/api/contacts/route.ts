import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/models/Contact';
import {
    apiForbidden,
    apiUnauthorized,
    getApiAuthAdminUser,
    getScopedPhoneNumbers,
} from '@/lib/admin-auth';
import { hasSectionAccess } from '@/lib/admin-permissions';

export async function GET() {
    try {
        const user = await getApiAuthAdminUser();
        if (!user) return apiUnauthorized();
        if (!hasSectionAccess(user, 'chats') || !user.canAccessChats) return apiForbidden();

        await connectDB();

        const scopedPhones = await getScopedPhoneNumbers(user);
        const query = scopedPhones?.length ? { phoneNumber: { $in: scopedPhones } } : {};

        const contacts = await Contact.find(query).sort({ lastMessageAt: -1 }).lean();

        return NextResponse.json({
            success: true,
            contacts: contacts.map(contact => ({
                ...contact,
                _id: contact._id.toString(),
            })),
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}
