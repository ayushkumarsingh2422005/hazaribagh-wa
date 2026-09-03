'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/components/providers/ThemeProvider';

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
];

/** Compact icon button for top bar — cycles light → dark → system */
export function ThemeToggleButton({ className = '' }: { className?: string }) {
    const { theme, setTheme, resolved } = useTheme();

    const cycle = () => {
        const order: ThemeMode[] = ['light', 'dark', 'system'];
        const next = order[(order.indexOf(theme) + 1) % order.length];
        setTheme(next);
    };

    const Icon = theme === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun;
    const label =
        theme === 'system' ? 'Theme: System' : theme === 'dark' ? 'Theme: Dark' : 'Theme: Light';

    return (
        <button
            type="button"
            onClick={cycle}
            title={label}
            aria-label={label}
            className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors ${className}`}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}

/** Full control for Settings page */
export function ThemePreferenceCard() {
    const { theme, setTheme, resolved } = useTheme();

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const active = theme === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTheme(opt.value)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                active
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {opt.label}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Active appearance:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{resolved}</span>
                {theme === 'system' ? ' (following device setting)' : ''}
            </p>
        </div>
    );
}
