import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type Variant = 'success' | 'error' | 'warning' | 'info';

const styles: Record<Variant, string> = {
    success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
};

const icons: Record<Variant, typeof Info> = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
};

export function AlertBanner({
    variant = 'info',
    children,
    className = '',
}: {
    variant?: Variant;
    children: React.ReactNode;
    className?: string;
}) {
    const Icon = icons[variant];
    return (
        <div className={`flex items-start gap-3 p-4 border text-sm ${styles[variant]} ${className}`} role="alert">
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">{children}</div>
        </div>
    );
}
