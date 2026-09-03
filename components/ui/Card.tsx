import type { ReactNode } from 'react';
import Link from 'next/link';

const panelClass =
    'dash-card overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`${panelClass} ${className}`}>{children}</div>;
}

export function CardHeader({
    title,
    count,
    actions,
    accent,
}: {
    title: string;
    count?: number;
    actions?: ReactNode;
    accent?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'none';
}) {
    const accentBar =
        accent === 'blue'
            ? 'border-l-4 border-l-blue-500'
            : accent === 'green'
              ? 'border-l-4 border-l-emerald-500'
              : accent === 'amber'
                ? 'border-l-4 border-l-amber-500'
                : accent === 'red'
                  ? 'border-l-4 border-l-red-500'
                  : accent === 'purple'
                    ? 'border-l-4 border-l-violet-500'
                    : '';

    return (
        <div
            className={`px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 ${accentBar}`}
        >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
                {count !== undefined && (
                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                        {count}
                    </span>
                )}
            </h2>
            {actions}
        </div>
    );
}

export function CardBody({
    children,
    className = '',
    divided = false,
}: {
    children: ReactNode;
    className?: string;
    divided?: boolean;
}) {
    return (
        <div className={`${divided ? 'divide-y divide-slate-100 dark:divide-slate-800' : ''} ${className}`}>
            {children}
        </div>
    );
}

export function ListRow({
    children,
    href,
    className = '',
}: {
    children: ReactNode;
    href?: string;
    className?: string;
}) {
    const rowClass = `px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${className}`;

    if (href) {
        return (
            <Link href={href} className={`block ${rowClass}`}>
                {children}
            </Link>
        );
    }

    return <div className={rowClass}>{children}</div>;
}

export function DataTable({ children }: { children: ReactNode }) {
    return (
        <Card>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">{children}</table>
            </div>
        </Card>
    );
}

export function DataTableHead({ children }: { children: ReactNode }) {
    return (
        <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-xs uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
            {children}
        </thead>
    );
}

export const TH_CLASS = 'px-4 py-3';
export const TD_CLASS = 'px-4 py-3.5';

/** Colored status pill used across list tables */
export function StatusBadge({
    status,
    label,
}: {
    status: string;
    label?: string;
}) {
    const s = status.toLowerCase();
    const styles =
        s === 'pending'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
            : s === 'in_progress'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
              : s === 'resolved' || s === 'closed'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

    const text =
        label ||
        (s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' '));

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles}`}>
            {text}
        </span>
    );
}
