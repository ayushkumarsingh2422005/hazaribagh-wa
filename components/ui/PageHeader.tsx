import type { ReactNode } from 'react';
import { BackLink } from './BackLink';

export function PageHeader({
    title,
    subtitle,
    actions,
    backLink,
    meta,
    size = 'default',
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    backLink?: { href: string; label: string };
    meta?: ReactNode;
    size?: 'default' | 'detail';
}) {
    const titleClass =
        size === 'detail'
            ? 'text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight'
            : 'text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight';

    return (
        <div className="mb-5">
            {backLink && <BackLink href={backLink.href} label={backLink.label} />}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                    {subtitle ? (
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                            {subtitle}
                        </p>
                    ) : null}
                    <h1 className={titleClass}>{title}</h1>
                    {meta && <div className="flex flex-wrap items-center gap-2 mt-2">{meta}</div>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
            </div>
        </div>
    );
}
