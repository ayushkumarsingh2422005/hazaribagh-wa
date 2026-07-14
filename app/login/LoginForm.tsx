'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login, createFirstUser } from '../actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-violet-600 to-indigo-600">
                    {isSetupRequired ? 'Welcome Admin' : 'Welcome Back'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    {isSetupRequired
                        ? 'Setup your initial admin account to get started'
                        : 'Enter your credentials to access the dashboard'}
                </p>
            </div>

            <form action={formAction} className="space-y-6">
                <Input
                    name={isSetupRequired ? "username" : "identifier"}
                    label={isSetupRequired ? "Username" : "Username or Email"}
                    placeholder={isSetupRequired ? "admin" : "Enter your username or email"}
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
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-medium">
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
                <div className="mt-6 text-center text-sm text-slate-500 space-y-2">
                    <p>
                        <Link
                            href="/login/forgot-password"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                            Forgot password?
                        </Link>
                    </p>
                    <p>Don&apos;t have an account? Contact your administrator.</p>
                </div>
            )}

            {/* Powered by */}
            <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-600">
                Powered by{' '}
                <a
                    href="https://digicraft.one"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-500 dark:hover:text-slate-500 transition-colors"
                >
                    DigiCraft Innovation Pvt. Ltd.
                </a>
            </p>
        </div>
    );
}
