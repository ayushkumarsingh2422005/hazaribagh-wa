import type { ReactNode } from 'react';
import { BackLink } from './BackLink';

export function PageHeader({
    title,
    actions,
    backLink,
    meta,
    size = 'default',
}: {
    title: string;
    actions?: ReactNode;
    backLink?: { href: string; label: string };
    meta?: ReactNode;
    size?: 'default' | 'detail';
}) {
    const titleClass =
        size === 'detail'
            ? 'text-xl font-bold text-slate-900 dark:text-white'
            : 'text-xl font-bold text-slate-900 dark:text-white';

    return (
        <div className="mb-4">
            {backLink && <BackLink href={backLink.href} label={backLink.label} />}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                    <h1 className={titleClass}>{title}</h1>
                    {meta && <div className="flex flex-wrap items-center gap-2 mt-1.5">{meta}</div>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
            </div>
        </div>
    );
}
