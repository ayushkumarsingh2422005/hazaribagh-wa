import crypto from 'crypto';
import { NextRequest } from 'next/server';
import connectDB from './db';
import AppOtp from '@/models/AppOtp';
import AppSession from '@/models/AppSession';
import Contact from '@/models/Contact';
import { normalizeIndiaWhatsAppTo } from './police-station-alert';
import {
    OTP_TTL_MS,
    generateOtp,
    deliverWhatsAppOtp,
    saveOtpRecord,
    verifyOtpRecord,
} from './otp-delivery';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const OTP_SESSION_MESSAGE =
    '*Hazaribagh Police — Sathi App*\n\nYour login OTP is: *{{otp}}*\n\nValid for 10 minutes. Do not share this code with anyone.\n\n_If you did not request this, ignore this message._';

export function normalizeAppPhone(input: string): string | null {
    return normalizeIndiaWhatsAppTo(input);
}

function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export async function sendAppOtp(rawPhone: string): Promise<{ success: boolean; error?: string }> {
    const phoneNumber = normalizeAppPhone(rawPhone);
    if (!phoneNumber) {
        return { success: false, error: 'Invalid phone number. Enter a valid 10-digit Indian mobile number.' };
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    try {
        await saveOtpRecord({ phoneNumber, purpose: 'app', otp, expiresAt });
    } catch (err) {
        console.error('Failed to save OTP record:', err);
        return { success: false, error: 'Could not prepare OTP. Please try again later.' };
    }

    try {
        await deliverWhatsAppOtp(phoneNumber, otp, OTP_SESSION_MESSAGE.replace('{{otp}}', otp));
    } catch (err) {
        console.error('Failed to send OTP via WhatsApp:', err);
        await connectDB();
        await AppOtp.deleteOne({ phoneNumber, purpose: 'app' });
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

    const verified = await verifyOtpRecord({ phoneNumber, purpose: 'app', otpInput });
    if (!verified.success) {
        return { success: false, error: verified.error };
    }

    await connectDB();
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
