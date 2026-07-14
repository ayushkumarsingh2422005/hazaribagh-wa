import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildPageHref } from '@/lib/pagination';

export function Pagination({
    basePath,
    page,
    totalPages,
    total,
    pageSize,
    shown,
    query,
}: {
    basePath: string;
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    shown: number;
    query?: Record<string, string | undefined>;
}) {
    if (totalPages <= 1) return null;

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {from}–{to} of {total}
                {shown < total && ` (${shown} on this page after filters)`}
            </p>
            <div className="flex items-center gap-2">
                {page > 1 ? (
                    <Link
                        href={buildPageHref(basePath, page - 1, query)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Link>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </span>
                )}
                <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
                    Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                    <Link
                        href={buildPageHref(basePath, page + 1, query)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed">
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </span>
                )}
            </div>
        </div>
    );
}
