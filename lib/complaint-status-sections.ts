import { Clock, Loader2, CheckCircle2, type LucideIcon } from 'lucide-react';

export type StatusSection = {
    value: string;
    label: string;
    icon: LucideIcon;
    headerClass: string;
    borderClass: string;
    badgeClass: string;
    countClass: string;
};

export const COMPLAINT_STATUS_SECTIONS: StatusSection[] = [
    {
        value: 'pending',
        label: 'Pending',
        icon: Clock,
        headerClass: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
        borderClass: 'border-l-4 border-yellow-400',
        badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        countClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    },
    {
        value: 'in_progress',
        label: 'In Progress',
        icon: Loader2,
        headerClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
        borderClass: 'border-l-4 border-blue-500',
        badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        countClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    {
        value: 'resolved',
        label: 'Resolved',
        icon: CheckCircle2,
        headerClass: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300',
        borderClass: 'border-l-4 border-green-500',
        badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        countClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
];

export function statusBadgeClass(status: string): string {
    const base = 'text-xs px-2 py-0.5 rounded font-medium';
    if (status === 'resolved') return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
    if (status === 'in_progress') return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`;
    if (status === 'closed') return `${base} bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300`;
    return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`;
}
