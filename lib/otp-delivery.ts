import crypto from 'crypto';
import connectDB from './db';
import AppOtp from '@/models/AppOtp';
import Contact from '@/models/Contact';
import {
    sendWhatsAppMessage,
    sendWhatsAppOtpTemplate,
    WHATSAPP_SESSION_WINDOW_MS,
} from './whatsapp';

export const OTP_TTL_MS = 10 * 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export type OtpPurpose = 'app' | 'admin_reset';

function otpTemplateConfigured(): boolean {
    return Boolean(process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim());
}

async function hasActiveWhatsAppSession(phoneNumber: string): Promise<boolean> {
    const contact = await Contact.findOne({ phoneNumber }).select('lastMessageAt').lean();
    if (!contact?.lastMessageAt) return false;
    return contact.lastMessageAt.getTime() > Date.now() - WHATSAPP_SESSION_WINDOW_MS;
}

export function generateOtp(): string {
    return String(crypto.randomInt(100000, 999999));
}

export async function deliverWhatsAppOtp(
    phoneNumber: string,
    otp: string,
    sessionMessage: string
): Promise<void> {
    const inSession = await hasActiveWhatsAppSession(phoneNumber);

    // Prefer the approved Authentication template whenever it is configured —
    // same delivery path for Sathi registration and admin password reset.
    if (otpTemplateConfigured()) {
        try {
            await sendWhatsAppOtpTemplate({ to: phoneNumber, otp });
            return;
        } catch (err) {
            console.warn('OTP template send failed, falling back to session message:', err);
            if (!inSession) throw err;
        }
    }

    if (inSession) {
        await sendWhatsAppMessage({ to: phoneNumber, text: sessionMessage });
        return;
    }

    throw new Error(
        'OTP template is not configured. Set WHATSAPP_OTP_TEMPLATE_NAME in .env.local after approving an Authentication template in Meta Business Manager.'
    );
}

export async function saveOtpRecord(params: {
    phoneNumber: string;
    purpose: OtpPurpose;
    otp: string;
    expiresAt: Date;
    userId?: string;
}): Promise<void> {
    await connectDB();

    // Drop legacy records from before purpose field existed (no compound key)
    await AppOtp.deleteMany({
        phoneNumber: params.phoneNumber,
        purpose: { $exists: false },
    });

    const update: Record<string, unknown> = {
        phoneNumber: params.phoneNumber,
        purpose: params.purpose,
        otp: params.otp,
        expiresAt: params.expiresAt,
        attempts: 0,
    };
    if (params.userId) {
        update.userId = params.userId;
    }

    try {
        await AppOtp.findOneAndUpdate(
            { phoneNumber: params.phoneNumber, purpose: params.purpose },
            params.userId ? { $set: update } : { $set: update, $unset: { userId: 1 } },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error('saveOtpRecord failed:', err);
        throw new Error('Could not save OTP record.');
    }
}

export async function verifyOtpRecord(params: {
    phoneNumber: string;
    purpose: OtpPurpose;
    otpInput: string;
    userId?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
    const otp = String(params.otpInput || '').trim();
    if (!/^\d{6}$/.test(otp)) {
        return { success: false, error: 'OTP must be 6 digits.' };
    }

    await connectDB();
    const record = await AppOtp.findOne({ phoneNumber: params.phoneNumber, purpose: params.purpose });
    if (!record) {
        return { success: false, error: 'OTP expired or not found. Request a new OTP.' };
    }

    if (params.userId && record.userId && record.userId.toString() !== params.userId) {
        return { success: false, error: 'OTP expired or not found. Request a new OTP.' };
    }

    if (record.expiresAt.getTime() < Date.now()) {
        await AppOtp.deleteOne({ _id: record._id });
        return { success: false, error: 'OTP has expired. Request a new OTP.' };
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
        await AppOtp.deleteOne({ _id: record._id });
        return { success: false, error: 'Too many failed attempts. Request a new OTP.' };
    }

    if (record.otp !== otp) {
        record.attempts += 1;
        await record.save();
        return { success: false, error: 'Incorrect OTP. Please try again.' };
    }

    await AppOtp.deleteOne({ _id: record._id });
    return { success: true };
}

export function maskPhoneLastFour(phone10: string): string {
    if (phone10.length < 4) return '****';
    return phone10.slice(-4);
}

export async function canResendOtp(phoneNumber: string, purpose: OtpPurpose): Promise<boolean> {
    await connectDB();
    const record = await AppOtp.findOne({ phoneNumber, purpose }).select('createdAt').lean();
    if (!record?.createdAt) return true;
    return Date.now() - new Date(record.createdAt).getTime() >= OTP_RESEND_COOLDOWN_MS;
}
