import crypto from 'crypto';
import { NextRequest } from 'next/server';
import connectDB from './db';
import AppOtp from '@/models/AppOtp';
import AppSession from '@/models/AppSession';
import Contact from '@/models/Contact';
import { sendWhatsAppMessage } from './whatsapp';
import { normalizeIndiaWhatsAppTo } from './police-station-alert';

const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export function normalizeAppPhone(input: string): string | null {
    return normalizeIndiaWhatsAppTo(input);
}

function generateOtp(): string {
    return String(crypto.randomInt(100000, 999999));
}

function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
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

    const message =
        `*Hazaribagh Police — Sathi App*\n\nYour login OTP is: *${otp}*\n\nValid for 10 minutes. Do not share this code with anyone.\n\n_If you did not request this, ignore this message._`;

    try {
        await sendWhatsAppMessage({ to: phoneNumber, text: message });
    } catch (err) {
        console.error('Failed to send OTP via WhatsApp:', err);
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
