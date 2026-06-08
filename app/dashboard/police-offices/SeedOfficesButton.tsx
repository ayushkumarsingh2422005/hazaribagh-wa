'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SeedOfficesButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        if (
            !confirm(
                'Load default DSP / SDPO / CI offices into the database? Existing offices with the same key will be updated.'
            )
        ) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/police-offices/seed', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(data.message || 'Offices seeded successfully.');
                router.refresh();
            } else {
                alert(data.error || 'Seed failed');
            }
        } catch (err) {
            console.error(err);
            alert('Seed failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleSeed}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
            {loading ? 'Seeding...' : 'Seed Default Offices'}
        </button>
    );
}
