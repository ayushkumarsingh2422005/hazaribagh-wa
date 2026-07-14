'use server';

import { redirect } from 'next/navigation';
import { sendAdminPasswordResetOtp, resetAdminPasswordWithOtp } from '@/lib/admin-password-reset';

export type AdminResetActionState = {
    error?: string;
    success?: boolean;
    step?: 'otp';
    identifier?: string;
    maskedPhone?: string;
    message?: string;
};

export async function requestAdminResetOtp(
    _prev: AdminResetActionState,
    formData: FormData
): Promise<AdminResetActionState> {
    const identifier = String(formData.get('identifier') || '').trim();
    if (!identifier) {
        return { error: 'Enter your username or email.' };
    }

    try {
        const result = await sendAdminPasswordResetOtp(identifier);
        if (!result.success) {
            return { error: result.error || 'Could not send OTP.' };
        }

        return {
            success: true,
            step: 'otp',
            identifier,
            maskedPhone: result.maskedPhone,
            message: `OTP sent to WhatsApp ending in ${result.maskedPhone}.`,
        };
    } catch (err) {
        console.error('requestAdminResetOtp error:', err);
        return { error: 'Could not send OTP. Please try again.' };
    }
}

export async function confirmAdminPasswordReset(
    _prev: AdminResetActionState,
    formData: FormData
): Promise<AdminResetActionState> {
    const identifier = String(formData.get('identifier') || '').trim();
    const otp = String(formData.get('otp') || '').trim();
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (!identifier || !otp) {
        return { error: 'Username/email and OTP are required.', step: 'otp', identifier };
    }

    const result = await resetAdminPasswordWithOtp({ identifier, otp, password, confirmPassword });
    if (!result.success) {
        return { error: result.error || 'Could not reset password.', step: 'otp', identifier };
    }

    redirect('/login?reset=success');
}
