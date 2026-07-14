import type { LucideIcon } from 'lucide-react';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="px-4 py-8 text-center">
            <Icon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" aria-hidden />
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">{title}</h3>
            {description && <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{description}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
