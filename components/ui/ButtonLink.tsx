import Link from 'next/link';
import type { ReactNode } from 'react';

const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
};

const variants = {
    primary: 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    secondary:
        'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-indigo-500',
};

export function ButtonLink({
    href,
    children,
    size = 'md',
    variant = 'primary',
    className = '',
}: {
    href: string;
    children: ReactNode;
    size?: keyof typeof sizes;
    variant?: keyof typeof variants;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 shrink-0 ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {children}
        </Link>
    );
}
