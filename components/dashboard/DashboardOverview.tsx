'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
    ClipboardList,
    FileWarning,
    MessageSquare,
    Star,
    MapPin,
    BookOpen,
    Link2,
    Users,
    Activity,
    Clock,
    CheckCircle2,
    Loader2,
    Smartphone,
    Inbox,
    AlertTriangle,
    ArrowRight,
    Settings,
    MessageCircle,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    BarChart,
    Bar,
} from 'recharts';
import { Card, CardBody, CardHeader, StatusBadge } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import type {
    DashboardOverview,
    DashboardStatCard,
    QuickAction,
} from '@/lib/dashboard-stats';

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
    traffic: BookOpen,
    resources: Link2,
    admins: Users,
    whatsapp: Activity,
};

const KPI_STYLES = [
    {
        key: 'total',
        label: 'Total Complaints',
        icon: ClipboardList,
        wrap: 'from-blue-500 to-blue-700',
        iconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300',
        href: '/dashboard/complaints?status=all',
    },
    {
        key: 'pending',
        label: 'Pending',
        icon: Clock,
        wrap: 'from-amber-400 to-orange-500',
        iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
        href: '/dashboard/complaints?status=pending',
    },
    {
        key: 'inProgress',
        label: 'In Progress',
        icon: Loader2,
        wrap: 'from-sky-400 to-blue-600',
        iconBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
        href: '/dashboard/complaints?status=in_progress',
    },
    {
        key: 'resolved',
        label: 'Resolved',
        icon: CheckCircle2,
        wrap: 'from-emerald-400 to-green-600',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
        href: '/dashboard/complaints?status=resolved',
    },
    {
        key: 'today',
        label: 'New Today',
        icon: Inbox,
        wrap: 'from-violet-400 to-purple-600',
        iconBg: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300',
        href: '/dashboard/complaints?status=all',
    },
    {
        key: 'rawPending',
        label: 'Raw Pending',
        icon: FileWarning,
        wrap: 'from-rose-400 to-red-600',
        iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
        href: '/dashboard/raw-complaints?status=pending',
    },
] as const;

const QUICK_ICONS: Record<string, LucideIcon> = {
    'qa-complaints': ClipboardList,
    'qa-raw': FileWarning,
    'qa-chats': MessageCircle,
    'qa-stations': MapPin,
    'qa-users': Users,
    'qa-settings': Settings,
};

const QUICK_TONES: Record<QuickAction['tone'], string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900',
    green: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-900',
    red: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900',
    purple: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-900',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-100 dark:border-cyan-900',
};

const VARIANT_STYLES: Record<DashboardStatCard['variant'], string> = {
    default: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    info: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30',
    success: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30',
    warning: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30',
    urgent: 'border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30',
};

const VALUE_STYLES: Record<DashboardStatCard['variant'], string> = {
    default: 'text-slate-900 dark:text-white',
    info: 'text-blue-700 dark:text-blue-300',
    success: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    urgent: 'text-red-700 dark:text-red-300',
};

const ICON_STYLES: Record<DashboardStatCard['variant'], string> = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    info: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    success: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    urgent: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
};

function MiniStat({ item }: { item: DashboardStatCard }) {
    const Icon = ICONS[item.id] ?? ClipboardList;
    return (
        <Link
            href={item.href}
            className={`block border p-3.5 rounded-xl transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${VARIANT_STYLES[item.variant]}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                        {item.label}
                    </p>
                    <p className={`text-2xl font-bold mt-1 tabular-nums ${VALUE_STYLES[item.variant]}`}>
                        {item.value}
                    </p>
                    {item.hint ? (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{item.hint}</p>
                    ) : null}
                </div>
                <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl ${ICON_STYLES[item.variant]}`}>
                    <Icon className="w-5 h-5" aria-hidden />
                </div>
            </div>
        </Link>
    );
}

export function DashboardOverview({ overview }: { overview: DashboardOverview }) {
    const kpiValues = overview.kpis;
    const statusTotal = overview.statusBreakdown.reduce((s, x) => s + x.value, 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle="Hazaribagh Police · Monitoring"
                meta={
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        Live overview of complaints, chats, and district services
                    </span>
                }
            />

            {/* KPI row */}
            {overview.canViewComplaints || overview.kpis.rawPending > 0 || overview.attention.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {KPI_STYLES.map(kpi => {
                        const Icon = kpi.icon;
                        const value = kpiValues[kpi.key];
                        return (
                            <Link
                                key={kpi.key}
                                href={kpi.href}
                                className="dash-card group relative overflow-hidden p-4 hover:shadow-lg transition-shadow bg-white dark:bg-slate-900"
                            >
                                <div
                                    className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${kpi.wrap} opacity-90`}
                                />
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            {kpi.label}
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                                            {value}
                                        </p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : null}

            {/* Charts + Alerts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-1">
                    <CardHeader title="Case Status Overview" accent="blue" />
                    <CardBody className="p-4">
                        {overview.statusBreakdown.every(s => s.value === 0) ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
                                No complaint data yet
                            </p>
                        ) : (
                            <>
                                <div className="h-52 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={overview.statusBreakdown}
                                                dataKey="value"
                                                nameKey="label"
                                                innerRadius={58}
                                                outerRadius={82}
                                                paddingAngle={3}
                                                strokeWidth={0}
                                            >
                                                {overview.statusBreakdown.map(slice => (
                                                    <Cell key={slice.key} fill={slice.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: 12,
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: 12,
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                                                {statusTotal}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-wide text-slate-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center mt-1">
                                    {overview.statusBreakdown.map(s => (
                                        <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                                            {s.label} ({s.value})
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>

                <Card className="xl:col-span-1">
                    <CardHeader title="Complaint Trend (6 months)" accent="green" />
                    <CardBody className="p-4">
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={overview.monthlyTrend}>
                                    <defs>
                                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" width={28} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#2563eb"
                                        strokeWidth={2.5}
                                        fill="url(#trendFill)"
                                        name="Complaints"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>

                <Card className="xl:col-span-1">
                    <CardHeader title="Alerts & Notifications" accent="amber" />
                    <CardBody className="p-3">
                        {overview.alerts.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                                All clear — no urgent alerts
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {overview.alerts.map(alert => (
                                    <li key={alert.id}>
                                        <Link
                                            href={alert.href}
                                            className={`flex gap-3 p-3 rounded-xl border transition-colors hover:shadow-sm ${
                                                alert.severity === 'urgent'
                                                    ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900'
                                                    : alert.severity === 'warning'
                                                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900'
                                                      : 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900'
                                            }`}
                                        >
                                            <AlertTriangle
                                                className={`w-5 h-5 shrink-0 mt-0.5 ${
                                                    alert.severity === 'urgent'
                                                        ? 'text-red-600'
                                                        : alert.severity === 'warning'
                                                          ? 'text-amber-600'
                                                          : 'text-blue-600'
                                                }`}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {alert.title}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {alert.detail}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 ml-auto shrink-0 text-slate-400 self-center" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Service group bar + recent + quick actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-1">
                    <CardHeader title="By Service" accent="purple" />
                    <CardBody className="p-4">
                        {overview.groupBreakdown.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No group data</p>
                        ) : (
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={overview.groupBreakdown} layout="vertical" margin={{ left: 8, right: 8 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} className="dark:opacity-20" />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            width={100}
                                            tick={{ fontSize: 10 }}
                                            stroke="#94a3b8"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: '1px solid #e2e8f0',
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar dataKey="value" fill="#7c3aed" radius={[0, 6, 6, 0]} name="Count" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardBody>
                </Card>

                <Card className="xl:col-span-1">
                    <CardHeader
                        title="Recent Complaints"
                        accent="blue"
                        actions={
                            overview.canViewComplaints ? (
                                <Link
                                    href="/dashboard/complaints?status=all"
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    View all
                                </Link>
                            ) : null
                        }
                    />
                    <CardBody className="overflow-x-auto">
                        {overview.recentComplaints.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center px-4">
                                No recent complaints
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-4 py-2.5 font-semibold">ID</th>
                                        <th className="px-4 py-2.5 font-semibold">Type</th>
                                        <th className="px-4 py-2.5 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {overview.recentComplaints.map(row => (
                                        <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-2.5">
                                                <Link
                                                    href={`/dashboard/complaints/${row.id}`}
                                                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {row.complaintId || row.id.slice(-6)}
                                                </Link>
                                                <p className="text-[11px] text-slate-400 truncate max-w-[100px]">
                                                    {row.policeStation}
                                                </p>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                                                <span className="line-clamp-1">{row.typeLabel}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <StatusBadge status={row.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardBody>
                </Card>

                <Card className="xl:col-span-1">
                    <CardHeader title="Quick Actions" accent="green" />
                    <CardBody className="p-4">
                        {overview.quickActions.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No actions</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {overview.quickActions.map(qa => {
                                    const Icon = QUICK_ICONS[qa.id] ?? ClipboardList;
                                    return (
                                        <Link
                                            key={qa.id}
                                            href={qa.href}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-center transition-all hover:shadow-md ${QUICK_TONES[qa.tone]}`}
                                        >
                                            <Icon className="w-6 h-6" />
                                            <span className="text-xs font-semibold">{qa.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Secondary reference grid */}
            {(overview.attention.length > 0 || overview.operations.length > 0 || overview.reference.length > 0) && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Directory & health
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {[...overview.reference].map(item => (
                            <MiniStat key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
