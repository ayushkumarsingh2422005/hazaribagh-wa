import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium mb-3"
        >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {label}
        </Link>
    );
}
