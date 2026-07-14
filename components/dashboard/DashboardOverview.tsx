import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
    ClipboardList,
    FileWarning,
    MessageSquare,
    Star,
    MapPin,
    Building2,
    BookOpen,
    Link2,
    Users,
    Activity,
    Clock,
    CheckCircle2,
    Loader2,
    Smartphone,
    Inbox,
} from 'lucide-react';
import type { DashboardOverview, DashboardStatCard } from '@/lib/dashboard-stats';

const ICONS: Record<string, LucideIcon> = {
    'complaints-pending': ClipboardList,
    'complaints-in-progress': Loader2,
    'complaints-resolved': CheckCircle2,
    'complaints-today': Clock,
    'sathi-pending': Smartphone,
    'raw-pending': FileWarning,
    'raw-in-progress': Loader2,
    'chats-unread': MessageSquare,
    'chats-total': Inbox,
    'reviews-pending': Star,
    'reviews-total': Star,
    stations: MapPin,
    offices: Building2,
    traffic: BookOpen,
    resources: Link2,
    admins: Users,
    whatsapp: Activity,
};

const VARIANT_STYLES: Record<DashboardStatCard['variant'], string> = {
    default: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    info: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20',
    success: 'border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20',
    warning: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20',
    urgent: 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20',
};

const VALUE_STYLES: Record<DashboardStatCard['variant'], string> = {
    default: 'text-slate-900 dark:text-white',
    info: 'text-blue-700 dark:text-blue-300',
    success: 'text-green-700 dark:text-green-300',
    warning: 'text-amber-700 dark:text-amber-300',
    urgent: 'text-red-700 dark:text-red-300',
};

const ICON_STYLES: Record<DashboardStatCard['variant'], string> = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    urgent: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
};

function StatCard({ item }: { item: DashboardStatCard }) {
    const Icon = ICONS[item.id] ?? ClipboardList;

    return (
        <Link
            href={item.href}
            className={`block border p-3 rounded-lg transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${VARIANT_STYLES[item.variant]}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                        {item.label}
                    </p>
                    <p className={`text-xl font-bold mt-0.5 tabular-nums ${VALUE_STYLES[item.variant]}`}>
                        {item.value}
                    </p>
                </div>
                <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-md ${ICON_STYLES[item.variant]}`}>
                    <Icon className="w-4 h-4" aria-hidden />
                </div>
            </div>
        </Link>
    );
}

function CardGrid({ items }: { items: DashboardStatCard[] }) {
    if (items.length === 0) return null;
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {items.map(item => (
                <StatCard key={item.id} item={item} />
            ))}
        </div>
    );
}

export function DashboardOverview({ overview }: { overview: DashboardOverview }) {
    return (
        <div className="space-y-4">
            {overview.attention.length > 0 && <CardGrid items={overview.attention} />}
            {overview.operations.length > 0 && <CardGrid items={overview.operations} />}
            {overview.reference.length > 0 && <CardGrid items={overview.reference} />}
        </div>
    );
}
