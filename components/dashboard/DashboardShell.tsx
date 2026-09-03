'use client';

import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Menu, MapPin } from 'lucide-react';
import type { NavPermissions } from '@/lib/admin-permissions';
import { ThemeToggleButton } from '@/components/ui/ThemeToggle';

interface DashboardShellProps {
    username: string;
    nav: NavPermissions;
    children: ReactNode;
}

export default function DashboardShell({ username, nav, children }: DashboardShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const roleLabel = nav.isSuperAdmin
        ? 'Super Admin'
        : nav.canManageAdmins
          ? 'Manager'
          : 'Administrator';

    return (
        <div className="min-h-screen" style={{ background: 'var(--canvas)' }}>
            <header className="lg:hidden sticky top-0 z-40 flex items-center gap-2 h-14 px-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                            Hazaribagh Police
                        </span>
                    </div>
                </div>
                <ThemeToggleButton />
            </header>

            {mobileOpen && (
                <button
                    type="button"
                    className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <Sidebar
                username={username}
                nav={nav}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <main className="lg:ml-64 min-h-screen">
                <div className="hidden lg:flex sticky top-0 z-30 items-center justify-between gap-4 h-14 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                            Hazaribagh Police, Jharkhand
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggleButton />
                        <div className="text-right leading-tight">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{username}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{roleLabel}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-sm font-bold uppercase shadow-md">
                            {username.charAt(0)}
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-5 lg:p-6">{children}</div>
            </main>
        </div>
    );
}
