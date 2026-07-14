'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { requestAdminResetOtp, confirmAdminPasswordReset, type AdminResetActionState } from '@/app/actions/admin-password-reset';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const initialState: AdminResetActionState = {};

export default function ForgotPasswordForm() {
    const [identifier, setIdentifier] = useState('');
    const [otpState, otpAction, otpPending] = useActionState(requestAdminResetOtp, initialState);
    const [resetState, resetAction, resetPending] = useActionState(confirmAdminPasswordReset, initialState);

    const activeIdentifier = resetState.identifier || otpState.identifier || identifier;
    const onOtpStep = otpState.step === 'otp' || resetState.step === 'otp';
    const error = resetState.error || otpState.error;
    const infoMessage = otpState.message;

    useEffect(() => {
        if (otpState.identifier) setIdentifier(otpState.identifier);
    }, [otpState.identifier]);

    return (
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset password</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                    {onOtpStep
                        ? 'Enter the OTP sent on WhatsApp and choose a new password.'
                        : 'We will send a one-time code to the WhatsApp number linked to your admin account.'}
                </p>
            </div>

            {!onOtpStep ? (
                <form action={otpAction} className="space-y-4">
                    <Input
                        name="identifier"
                        label="Username or email"
                        placeholder="Your admin username or email"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        required
                    />

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" isLoading={otpPending}>
                        Send OTP on WhatsApp
                    </Button>
                </form>
            ) : (
                <form action={resetAction} className="space-y-4">
                    <input type="hidden" name="identifier" value={activeIdentifier} />

                    {infoMessage && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
                            {infoMessage}
                        </div>
                    )}

                    <Input
                        name="otp"
                        label="WhatsApp OTP"
                        placeholder="6-digit code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                    />

                    <Input
                        name="password"
                        type="password"
                        label="New password"
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                    />

                    <Input
                        name="confirmPassword"
                        type="password"
                        label="Confirm new password"
                        placeholder="Repeat new password"
                        minLength={8}
                        required
                    />

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" isLoading={resetPending}>
                        Update password
                    </Button>
                </form>
            )}

            {onOtpStep && (
                <form action={otpAction} className="mt-3 text-center">
                    <input type="hidden" name="identifier" value={activeIdentifier} />
                    <button
                        type="submit"
                        disabled={otpPending}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                    >
                        Resend OTP
                    </button>
                </form>
            )}

            <p className="mt-6 text-center text-sm">
                <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                    ← Back to sign in
                </Link>
            </p>
        </div>
    );
}
