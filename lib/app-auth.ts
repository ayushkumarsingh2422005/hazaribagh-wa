import crypto from 'crypto';
import { NextRequest } from 'next/server';
import connectDB from './db';
import AppOtp from '@/models/AppOtp';
import AppSession from '@/models/AppSession';
import Contact from '@/models/Contact';
import {
    sendWhatsAppMessage,
    sendWhatsAppOtpTemplate,
    WHATSAPP_SESSION_WINDOW_MS,
} from './whatsapp';
import { normalizeIndiaWhatsAppTo } from './police-station-alert';

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const OTP_SESSION_MESSAGE =
    '*Hazaribagh Police — Sathi App*\n\nYour login OTP is: *{{otp}}*\n\nValid for 10 minutes. Do not share this code with anyone.\n\n_If you did not request this, ignore this message._';

export function normalizeAppPhone(input: string): string | null {
    return normalizeIndiaWhatsAppTo(input);
}

function generateOtp(): string {
    return String(crypto.randomInt(100000, 999999));
}

function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

async function hasActiveWhatsAppSession(phoneNumber: string): Promise<boolean> {
    const contact = await Contact.findOne({ phoneNumber }).select('lastMessageAt').lean();
    if (!contact?.lastMessageAt) return false;
    return contact.lastMessageAt.getTime() > Date.now() - WHATSAPP_SESSION_WINDOW_MS;
}

function otpTemplateConfigured(): boolean {
    return Boolean(process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim());
}

async function sendOtpViaSessionMessage(phoneNumber: string, otp: string): Promise<void> {
    const message = OTP_SESSION_MESSAGE.replace('{{otp}}', otp);
    await sendWhatsAppMessage({ to: phoneNumber, text: message });
}

async function sendOtpViaTemplate(phoneNumber: string, otp: string): Promise<void> {
    await sendWhatsAppOtpTemplate({ to: phoneNumber, otp });
}

/**
 * Deliver OTP on WhatsApp:
 * - Active chatbot session → formatted session message (existing style)
 * - New / expired session → approved authentication template
 */
async function deliverAppOtp(phoneNumber: string, otp: string): Promise<void> {
    const inSession = await hasActiveWhatsAppSession(phoneNumber);

    if (inSession) {
        try {
            await sendOtpViaSessionMessage(phoneNumber, otp);
            return;
        } catch (err) {
            console.warn('Session OTP message failed, falling back to template:', err);
        }
    }

    if (!otpTemplateConfigured()) {
        if (inSession) {
            throw new Error('Could not deliver OTP on WhatsApp.');
        }
        throw new Error(
            'OTP template is not configured. Set WHATSAPP_OTP_TEMPLATE_NAME in .env.local after approving an Authentication template in Meta Business Manager.'
        );
    }

    await sendOtpViaTemplate(phoneNumber, otp);
}

export async function sendAppOtp(rawPhone: string): Promise<{ success: boolean; error?: string }> {
    const phoneNumber = normalizeAppPhone(rawPhone);
    if (!phoneNumber) {
        return { success: false, error: 'Invalid phone number. Enter a valid 10-digit Indian mobile number.' };
    }

    await connectDB();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await AppOtp.findOneAndUpdate(
        { phoneNumber },
        { phoneNumber, otp, expiresAt, attempts: 0 },
        { upsert: true, new: true }
    );

    try {
        await deliverAppOtp(phoneNumber, otp);
    } catch (err) {
        console.error('Failed to send OTP via WhatsApp:', err);
        await AppOtp.deleteOne({ phoneNumber });
        const detail = err instanceof Error ? err.message : 'Unknown error';
        if (detail.includes('WHATSAPP_OTP_TEMPLATE_NAME')) {
            return {
                success: false,
                error:
                    'OTP could not be sent. The server needs a WhatsApp authentication template for new users. Please contact support.',
            };
        }
        return { success: false, error: 'Could not send OTP on WhatsApp. Please try again later.' };
    }

    return { success: true };
}

export async function verifyAppOtp(
    rawPhone: string,
    otpInput: string
): Promise<{ success: boolean; token?: string; phoneNumber?: string; error?: string }> {
    const phoneNumber = normalizeAppPhone(rawPhone);
    if (!phoneNumber) {
        return { success: false, error: 'Invalid phone number.' };
    }

    const otp = String(otpInput || '').trim();
    if (!/^\d{6}$/.test(otp)) {
        return { success: false, error: 'OTP must be 6 digits.' };
    }

    await connectDB();
    const record = await AppOtp.findOne({ phoneNumber });
    if (!record) {
        return { success: false, error: 'OTP expired or not found. Request a new OTP.' };
    }

    if (record.expiresAt.getTime() < Date.now()) {
        await AppOtp.deleteOne({ phoneNumber });
        return { success: false, error: 'OTP has expired. Request a new OTP.' };
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
        await AppOtp.deleteOne({ phoneNumber });
        return { success: false, error: 'Too many failed attempts. Request a new OTP.' };
    }

    if (record.otp !== otp) {
        record.attempts += 1;
        await record.save();
        return { success: false, error: 'Incorrect OTP. Please try again.' };
    }

    await AppOtp.deleteOne({ phoneNumber });

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await AppSession.findOneAndUpdate(
        { phoneNumber },
        { phoneNumber, token, expiresAt },
        { upsert: true, new: true }
    );

    await Contact.findOneAndUpdate(
        { phoneNumber },
        { phoneNumber, lastMessageAt: new Date() },
        { upsert: true }
    );

    return { success: true, token, phoneNumber };
}

export async function getAppSessionFromRequest(
    request: NextRequest
): Promise<{ phoneNumber: string; token: string } | null> {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    const token = auth.slice(7).trim();
    if (!token) return null;

    await connectDB();
    const session = await AppSession.findOne({ token }).lean();
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
        await AppSession.deleteOne({ token });
        return null;
    }

    return { phoneNumber: session.phoneNumber, token: session.token };
}

export async function revokeAppSession(token: string): Promise<void> {
    await connectDB();
    await AppSession.deleteOne({ token });
}
