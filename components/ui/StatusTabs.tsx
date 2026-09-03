import Link from 'next/link';
import { COMPLAINT_STATUS_SECTIONS } from '@/lib/complaint-status-sections';

export type StatusTabValue = 'pending' | 'in_progress' | 'resolved' | 'all';

const TABS: { value: StatusTabValue; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'all', label: 'All' },
];

export function parseStatusTab(raw: string | undefined): StatusTabValue {
    if (raw === 'in_progress' || raw === 'resolved' || raw === 'all') return raw;
    return 'pending';
}

export function mongoFilterForStatusTab(tab: StatusTabValue): Record<string, unknown> {
    if (tab === 'all') return {};
    if (tab === 'resolved') return { status: { $in: ['resolved', 'closed'] } };
    return { status: tab };
}

export function StatusTabs({
    basePath,
    active,
    counts,
}: {
    basePath: string;
    active: StatusTabValue;
    counts: { pending: number; inProgress: number; resolved: number; all: number };
}) {
    const countFor = (value: StatusTabValue) => {
        if (value === 'pending') return counts.pending;
        if (value === 'in_progress') return counts.inProgress;
        if (value === 'resolved') return counts.resolved;
        return counts.all;
    };

    const styleFor = (value: StatusTabValue) => {
        const section = COMPLAINT_STATUS_SECTIONS.find(s => s.value === value);
        if (!section) {
            return active === value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800';
        }
        if (active === value) {
            if (value === 'pending') return 'bg-amber-500 text-white shadow-md shadow-amber-500/30';
            if (value === 'in_progress') return 'bg-blue-600 text-white shadow-md shadow-blue-600/25';
            if (value === 'resolved') return 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25';
            return `${section.headerClass} font-semibold border border-transparent`;
        }
        return 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800';
    };

    return (
        <div className="flex flex-wrap gap-2 mb-4 p-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            {TABS.map(tab => {
                const count = countFor(tab.value);
                const href = `${basePath}?status=${tab.value}&page=1`;
                const isActive = active === tab.value;
                return (
                    <Link
                        key={tab.value}
                        href={href}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${styleFor(tab.value)}`}
                    >
                        {tab.label}
                        <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                    ? 'bg-white/25 text-inherit'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            {count}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
