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
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50';
        }
        if (active === value) {
            return `${section.borderClass} ${section.headerClass} font-semibold`;
        }
        return 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50';
    };

    return (
        <div className="flex flex-wrap gap-1.5 mb-4 border-b border-slate-200 dark:border-slate-800 pb-0">
            {TABS.map(tab => {
                const count = countFor(tab.value);
                const href = `${basePath}?status=${tab.value}&page=1`;
                return (
                    <Link
                        key={tab.value}
                        href={href}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors rounded-t-md ${styleFor(tab.value)}`}
                    >
                        {tab.label}
                        <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                active === tab.value
                                    ? 'bg-white/60 dark:bg-black/20'
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
