'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { AlertBanner } from '@/components/ui/AlertBanner';

export default function SeedOfficesButton() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState('');

    const handleSeed = async () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/police-offices/seed', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Offices seeded successfully');
                setConfirming(false);
                router.refresh();
            } else {
                setError(data.error || 'Seed failed');
            }
        } catch {
            setError('Seed failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            {error && (
                <AlertBanner variant="error" className="w-full max-w-md">
                    {error}
                </AlertBanner>
            )}
            <div className="flex gap-2">
                {confirming && (
                    <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSeed}
                    disabled={loading}
                    className={`px-4 py-2 border text-sm disabled:opacity-50 ${
                        confirming
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                            : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    {loading ? 'Seeding...' : confirming ? 'Confirm seed' : 'Seed Default Offices'}
                </button>
            </div>
            {confirming && !loading && (
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs text-right">
                    Loads default DSP / SDPO / CI offices. Existing keys will be updated.
                </p>
            )}
        </div>
    );
}
