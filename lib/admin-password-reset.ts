import bcrypt from 'bcryptjs';
import connectDB from './db';
import User from '@/models/User';
import { normalizeIndiaWhatsAppTo } from './police-station-alert';
import { normalizeAdminPhone } from './admin-phone';
import { sendAppOtp } from './app-auth';
import { verifyOtpRecord, maskPhoneLastFour } from './otp-delivery';

async function findAdminByIdentifier(identifier: string) {
    const trimmed = identifier.trim();
    if (!trimmed) return null;

    await connectDB();
    return User.findOne({
        $or: [{ email: trimmed.toLowerCase() }, { username: trimmed }],
    }).select('+password username email phoneNumber isActive');
}

export async function sendAdminPasswordResetOtp(
    identifier: string
): Promise<{ success: boolean; maskedPhone?: string; error?: string }> {
    const user = await findAdminByIdentifier(identifier);
    if (!user) {
        return { success: false, error: 'No account found with that username or email.' };
    }

    if (user.isActive === false) {
        return { success: false, error: 'This account is deactivated. Contact your administrator.' };
    }

    const phone10 = normalizeAdminPhone(user.phoneNumber || '');
    if (!phone10) {
        return {
            success: false,
            error: 'No phone number is linked to this account. Ask your super admin to add one.',
        };
    }

    const phoneNumber = normalizeIndiaWhatsAppTo(phone10);
    if (!phoneNumber) {
        return { success: false, error: 'The phone number on this account is invalid. Contact your administrator.' };
    }

    // Same OTP delivery path as Sathi app registration (/api/app/auth/send-otp)
    const result = await sendAppOtp(phone10);
    if (!result.success) {
        return { success: false, error: result.error || 'Could not send OTP on WhatsApp. Try again later.' };
    }

    return { success: true, maskedPhone: maskPhoneLastFour(phone10) };
}

export async function resetAdminPasswordWithOtp(params: {
    identifier: string;
    otp: string;
    password: string;
    confirmPassword: string;
}): Promise<{ success: boolean; error?: string }> {
    const { identifier, otp, password, confirmPassword } = params;

    if (!password || password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.' };
    }

    if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match.' };
    }

    const user = await findAdminByIdentifier(identifier);
    if (!user) {
        return { success: false, error: 'No account found with that username or email.' };
    }

    if (user.isActive === false) {
        return { success: false, error: 'This account is deactivated. Contact your administrator.' };
    }

    const phone10 = normalizeAdminPhone(user.phoneNumber || '');
    if (!phone10) {
        return { success: false, error: 'No phone number is linked to this account.' };
    }

    const phoneNumber = normalizeIndiaWhatsAppTo(phone10);
    if (!phoneNumber) {
        return { success: false, error: 'Invalid phone number on account.' };
    }

    const verified = await verifyOtpRecord({
        phoneNumber,
        purpose: 'app',
        otpInput: otp,
    });

    if (!verified.success) {
        return { success: false, error: verified.error };
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return { success: true };
}
