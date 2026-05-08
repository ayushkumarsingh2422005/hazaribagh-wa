import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import Contact from '@/models/Contact';
import { markMessageAsRead, sendTypingOn } from '@/lib/whatsapp';
import { sendChatbotResponse } from '@/lib/chatbot';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

function getPersistableOutgoingText(
    botResponse: {
        type: 'text' | 'buttons' | 'list';
        message?: string;
        bodyText?: string;
        buttonText?: string;
        buttons?: Array<{ id: string; title: string }>;
        sections?: Array<{ title?: string; rows: Array<{ id: string; title: string; description?: string }> }>;
    }
): string {
    const primary = botResponse.type === 'text' ? (botResponse.message || '') : (botResponse.bodyText || '');
    if (primary.trim()) return primary;

    if (botResponse.type === 'list' && botResponse.sections?.length) {
        const rowTitles = botResponse.sections
            .flatMap(section => section.rows.map(row => row.title))
            .filter(Boolean)
            .slice(0, 8);
        const fallback = [
            botResponse.buttonText || 'Interactive list',
            rowTitles.length ? `Options: ${rowTitles.join(', ')}` : '',
        ]
            .filter(Boolean)
            .join('\n');
        if (fallback.trim()) return fallback;
    }

    if (botResponse.type === 'buttons' && botResponse.buttons?.length) {
        const buttonTitles = botResponse.buttons.map(btn => btn.title).filter(Boolean).join(', ');
        const fallback = buttonTitles ? `Interactive buttons: ${buttonTitles}` : 'Interactive buttons';
        if (fallback.trim()) return fallback;
    }

    return '';
}

// Webhook verification (GET request from Meta)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully');
        return new NextResponse(challenge, { status: 200 });
    } else {
        return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }
}

// Handle incoming WhatsApp messages (POST request from Meta)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

        // WhatsApp sends webhook events in this structure
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            // Handle incoming messages
            if (value?.messages && value.messages.length > 0) {
                await connectDB();

                const message = value.messages[0];
                const phoneNumber = message.from;
                const messageId = message.id;

                // ⌨️ Fire typing indicator immediately (fire-and-forget).
                // Shows the "typing..." bubble in the user's chat while the server processes.
                sendTypingOn(phoneNumber, messageId).catch(() => { });

                // Check if this is a location message
                if (message.location) {
                    const { latitude, longitude } = message.location;
                    console.log(`📍 Location from ${phoneNumber}: ${latitude}, ${longitude}`);

                    const { handleLocationMessage, getContactLanguageAndSendMenu } = await import('@/lib/chatbot');
                    const response = await handleLocationMessage(phoneNumber, latitude, longitude);

                    await sendChatbotResponse(phoneNumber, response);

                    // Location result is terminal → auto-send service menu after a brief pause
                    if (response.sendFollowUpMenu) {
                        try {
                            sendTypingOn(phoneNumber, messageId).catch(() => { });
                            await new Promise(r => setTimeout(r, 1500));
                            await getContactLanguageAndSendMenu(phoneNumber);
                            console.log(`📋 Follow-up service menu sent to ${phoneNumber} (after location)`);
                        } catch (e) {
                            console.error('❌ Error sending follow-up menu after location:', e);
                        }
                    }

                    await markMessageAsRead(messageId);
                    return NextResponse.json({ success: true });
                }

                // Check if this is a button response, list selection, or regular text
                const messageText =
                    message.text?.body ||
                    message.interactive?.button_reply?.title ||
                    message.interactive?.list_reply?.title ||
                    '';
                const buttonId =
                    message.interactive?.button_reply?.id ||
                    message.interactive?.list_reply?.id;

                console.log(`📥 Message from ${phoneNumber}: ${messageText}${buttonId ? ` (ID: ${buttonId})` : ''}`);

                // Save incoming message to database (only if there's text)
                if (messageText.trim()) {
                    await ChatMessage.create({
                        phoneNumber,
                        message: messageText,
                        direction: 'incoming',
                        messageId,
                        timestamp: new Date(parseInt(message.timestamp) * 1000),
                        status: 'delivered',
                    });
                }

                // Update or create contact
                await Contact.findOneAndUpdate(
                    { phoneNumber },
                    {
                        phoneNumber,
                        lastMessageAt: new Date(),
                        $inc: { unreadCount: 1 },
                    },
                    { upsert: true, new: true }
                );

                // ✅ SEND INTELLIGENT CHATBOT REPLY
                try {
                    const { processChatbotMessage, sendChatbotResponse: sendReply, getContactLanguageAndSendMenu } = await import('@/lib/chatbot');
                    const botResponse = await processChatbotMessage(phoneNumber, messageText, buttonId);

                    console.log(`🤖 Sending chatbot reply to ${phoneNumber} (Type: ${botResponse.type})`);

                    // Send the response (buttons, list, or text)
                    const response = await sendReply(phoneNumber, botResponse);

                    // Save the outgoing message to database
                    if (response?.messages?.[0]?.id) {
                        const outgoingText = getPersistableOutgoingText(botResponse);

                        // Some WhatsApp interactive payloads may contain only metadata.
                        // Avoid writing invalid empty chat rows to Mongo.
                        if (outgoingText.trim()) {
                            try {
                                await ChatMessage.create({
                                    phoneNumber,
                                    message: outgoingText,
                                    direction: 'outgoing',
                                    messageId: response.messages[0].id,
                                    timestamp: new Date(),
                                    status: 'sent',
                                });
                            } catch (saveError) {
                                console.error('❌ Failed to persist outgoing chatbot message:', saveError);
                            }
                        } else {
                            console.warn(`⚠️ Skipped outgoing ChatMessage save due to empty body (type: ${botResponse.type})`);
                        }

                        console.log(`✅ Chatbot reply sent successfully to ${phoneNumber}`);
                    }

                    // 🔁 If this response ends a cycle, automatically send the service menu.
                    if (botResponse.sendFollowUpMenu) {
                        try {
                            sendTypingOn(phoneNumber, messageId).catch(() => { });
                            // Brief pause so primary response arrives first
                            await new Promise(r => setTimeout(r, 1500));
                            await getContactLanguageAndSendMenu(phoneNumber);
                            console.log(`📋 Follow-up service menu sent to ${phoneNumber}`);
                        } catch (menuError) {
                            console.error('❌ Error sending follow-up service menu:', menuError);
                        }
                    }

                    // Mark the incoming message as read
                    await markMessageAsRead(messageId);
                } catch (replyError) {
                    console.error('❌ Error sending chatbot reply:', replyError);
                    // Don't throw — we still want to return 200 to WhatsApp
                }
            }

            // Handle message status updates (sent, delivered, read)
            if (value?.statuses && value.statuses.length > 0) {
                await connectDB();

                const status = value.statuses[0];
                console.log(`📊 Status update for message ${status.id}: ${status.status}`);

                await ChatMessage.findOneAndUpdate(
                    { messageId: status.id },
                    { status: status.status }
                );
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
