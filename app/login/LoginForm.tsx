'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login, createFirstUser } from '../actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield } from 'lucide-react';

interface LoginFormProps {
    isSetupRequired: boolean;
}

const initialState = {
    error: '',
    success: '',
};

export default function LoginForm({ isSetupRequired }: LoginFormProps) {
    const searchParams = useSearchParams();
    const resetSuccess = searchParams.get('reset') === 'success';
    const action = isSetupRequired ? createFirstUser : login;
    const [state, formAction, isPending] = useActionState(action, initialState);

    return (
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/10 p-8 border border-slate-200/80 dark:border-slate-800">
            <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-linear-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                    <Shield className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isSetupRequired ? 'Welcome Admin' : 'Hazaribagh Police'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                    {isSetupRequired
                        ? 'Setup your initial admin account to get started'
                        : 'WhatsApp Admin Dashboard — sign in to continue'}
                </p>
            </div>

            <form action={formAction} className="space-y-5">
                <Input
                    name={isSetupRequired ? 'username' : 'identifier'}
                    label={isSetupRequired ? 'Username' : 'Username or Email'}
                    placeholder={isSetupRequired ? 'admin' : 'Enter your username or email'}
                    required
                />

                {isSetupRequired && (
                    <Input
                        name="email"
                        type="email"
                        label="Email Address"
                        placeholder="admin@example.com"
                        required
                    />
                )}

                <Input
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    required
                />

                {resetSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                        Password updated. Sign in with your new password.
                    </div>
                )}

                {state?.error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                        {state.error}
                    </div>
                )}

                <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
                    {isSetupRequired ? 'Create Admin Account' : 'Sign In'}
                </Button>
            </form>

            {!isSetupRequired && (
                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    <Link href="/login/forgot-password" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        Forgot password?
                    </Link>
                </p>
            )}

            <p className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Suraksha · Seva · Vishwas
            </p>
        </div>
    );
}
