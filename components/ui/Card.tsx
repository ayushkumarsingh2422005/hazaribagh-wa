import type { ReactNode } from 'react';
import Link from 'next/link';

const panelClass =
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`${panelClass} ${className}`}>{children}</div>;
}

export function CardHeader({
    title,
    count,
    actions,
}: {
    title: string;
    count?: number;
    actions?: ReactNode;
}) {
    return (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
                {count !== undefined && (
                    <span className="ml-2 text-xs font-medium px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
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
    const rowClass = `px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${className}`;

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
        <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-medium text-slate-500 dark:text-slate-400">
            {children}
        </thead>
    );
}

export const TH_CLASS = 'px-4 py-2.5';
export const TD_CLASS = 'px-4 py-3';
