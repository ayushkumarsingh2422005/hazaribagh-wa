import Link from 'next/link';
import type { ReactNode } from 'react';

const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
};

const variants = {
    primary:
        'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-md shadow-blue-600/20 font-semibold',
    secondary:
        'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-blue-500 font-semibold shadow-sm',
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
            className={`inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 shrink-0 ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {children}
        </Link>
    );
}
