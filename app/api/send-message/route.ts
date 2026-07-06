import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthAdminUser, apiUnauthorized, apiForbidden } from '@/lib/admin-auth';
import { hasSectionAccess } from '@/lib/admin-permissions';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import connectDB from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';

export async function POST(request: NextRequest) {
    try {
        const user = await getApiAuthAdminUser();
        if (!user) return apiUnauthorized();
        if (!hasSectionAccess(user, 'chats') || !user.canAccessChats) return apiForbidden();

        const body = await request.json();
        const { to, message } = body;

        if (!to || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: to, message' },
                { status: 400 }
            );
        }

        const response = await sendWhatsAppMessage({ to, text: message });

        await connectDB();
        if (response.messages?.[0]?.id) {
            await ChatMessage.create({
                phoneNumber: to,
                message,
                direction: 'outgoing',
                messageId: response.messages[0].id,
                timestamp: new Date(),
                status: 'sent',
            });
        }

        return NextResponse.json({
            success: true,
            messageId: response.messages?.[0]?.id,
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send message' },
            { status: 500 }
        );
    }
}
