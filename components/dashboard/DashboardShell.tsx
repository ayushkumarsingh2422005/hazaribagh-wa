'use client';

import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import type { NavPermissions } from '@/lib/admin-permissions';

interface DashboardShellProps {
    username: string;
    nav: NavPermissions;
    children: ReactNode;
}

export default function DashboardShell({ username, nav, children }: DashboardShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Mobile header */}
            <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        H
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Hazaribagh WA</span>
                </div>
            </header>

            {/* Mobile overlay */}
            {mobileOpen && (
                <button
                    type="button"
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
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
                <div className="p-4 sm:p-5 lg:p-6">{children}</div>
            </main>
        </div>
    );
}
