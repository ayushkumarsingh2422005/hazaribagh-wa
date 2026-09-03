import connectDB from '@/lib/db';
import Complaint from '@/models/Complaint';
import RawComplaint from '@/models/RawComplaint';
import Contact from '@/models/Contact';
import Review from '@/models/Review';
import User from '@/models/User';
import PoliceStation from '@/models/PoliceStation';
import TrafficViolation from '@/models/TrafficViolation';
import Resource from '@/models/Resource';
import {
    type AuthAdminUser,
    buildComplaintFilter,
    buildRawComplaintFilter,
    getScopedPhoneNumbers,
} from '@/lib/admin-auth';
import { hasSectionAccess, type AdminSection } from '@/lib/admin-permissions';
import { getWhatsAppHealth } from '@/lib/whatsapp-health';
import { SERVICE_GROUPS, COMPLAINT_TYPE_LABELS } from '@/lib/complaint-services';

export type DashboardCardVariant = 'default' | 'warning' | 'success' | 'info' | 'urgent';

export type DashboardStatCard = {
    id: string;
    label: string;
    value: number | string;
    hint?: string;
    href: string;
    variant: DashboardCardVariant;
    section?: AdminSection;
    needsAttention?: boolean;
};

export type StatusSlice = { key: string; label: string; value: number; color: string };
export type GroupSlice = { id: string; label: string; value: number };
export type TrendPoint = { month: string; label: string; count: number };
export type RecentComplaintRow = {
    id: string;
    complaintId: string | null;
    complaintType: string;
    typeLabel: string;
    policeStation: string;
    status: string;
    source: string;
    createdAt: string;
};
export type DashboardAlert = {
    id: string;
    title: string;
    detail: string;
    href: string;
    severity: 'urgent' | 'warning' | 'info';
};
export type QuickAction = {
    id: string;
    label: string;
    href: string;
    tone: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';
};

export type DashboardOverview = {
    attention: DashboardStatCard[];
    operations: DashboardStatCard[];
    reference: DashboardStatCard[];
    kpis: {
        total: number;
        pending: number;
        inProgress: number;
        resolved: number;
        today: number;
        rawPending: number;
    };
    statusBreakdown: StatusSlice[];
    groupBreakdown: GroupSlice[];
    monthlyTrend: TrendPoint[];
    recentComplaints: RecentComplaintRow[];
    alerts: DashboardAlert[];
    quickActions: QuickAction[];
    canViewComplaints: boolean;
};

function startOfTodayIST(): Date {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')!.value;
    const m = parts.find(p => p.type === 'month')!.value;
    const d = parts.find(p => p.type === 'day')!.value;
    return new Date(`${y}-${m}-${d}T00:00:00+05:30`);
}

function card(
    partial: Omit<DashboardStatCard, 'variant'> & { variant?: DashboardCardVariant; needsAttention?: boolean }
): DashboardStatCard {
    const needsAttention = partial.needsAttention ?? (typeof partial.value === 'number' && partial.value > 0);
    let variant = partial.variant ?? 'default';
    if (!partial.variant && needsAttention && partial.id.includes('pending')) variant = 'urgent';
    if (!partial.variant && needsAttention && partial.id.includes('unread')) variant = 'warning';
    return { ...partial, variant, needsAttention };
}

function typeToGroupId(complaintType: string): string {
    const found = SERVICE_GROUPS.find(g => g.types.includes(complaintType));
    return found?.id || 'other';
}

function monthLabel(key: string): string {
    const [y, m] = key.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

export async function getDashboardOverview(user: AuthAdminUser): Promise<DashboardOverview> {
    await connectDB();

    const attention: DashboardStatCard[] = [];
    const operations: DashboardStatCard[] = [];
    const reference: DashboardStatCard[] = [];
    const alerts: DashboardAlert[] = [];
    const quickActions: QuickAction[] = [];

    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let todayNew = 0;
    let rawPending = 0;
    let total = 0;
    let statusBreakdown: StatusSlice[] = [];
    let groupBreakdown: GroupSlice[] = [];
    let monthlyTrend: TrendPoint[] = [];
    let recentComplaints: RecentComplaintRow[] = [];

    const todayStart = startOfTodayIST();
    const canViewComplaints = hasSectionAccess(user, 'complaints');

    if (canViewComplaints) {
        const filter = await buildComplaintFilter(user);
        const [p, ip, r, tn, sathiPending, totalCount, byStatus, byType, recent] = await Promise.all([
            Complaint.countDocuments({ ...filter, status: 'pending' }),
            Complaint.countDocuments({ ...filter, status: 'in_progress' }),
            Complaint.countDocuments({ ...filter, status: { $in: ['resolved', 'closed'] } }),
            Complaint.countDocuments({ ...filter, createdAt: { $gte: todayStart } }),
            Complaint.countDocuments({ ...filter, status: 'pending', source: 'app' }),
            Complaint.countDocuments(filter),
            Complaint.aggregate<{ _id: string; count: number }>([
                { $match: filter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Complaint.aggregate<{ _id: string; count: number }>([
                { $match: filter },
                { $group: { _id: '$complaintType', count: { $sum: 1 } } },
            ]),
            Complaint.find(filter)
                .sort({ createdAt: -1 })
                .limit(8)
                .select('complaintId complaintType policeStation status source createdAt')
                .lean(),
        ]);

        pending = p;
        inProgress = ip;
        resolved = r;
        todayNew = tn;
        total = totalCount;

        const statusMap: Record<string, number> = {};
        for (const row of byStatus) statusMap[row._id] = row.count;
        statusBreakdown = [
            { key: 'pending', label: 'Pending', value: statusMap.pending || 0, color: '#f59e0b' },
            { key: 'in_progress', label: 'In Progress', value: statusMap.in_progress || 0, color: '#2563eb' },
            {
                key: 'resolved',
                label: 'Resolved',
                value: (statusMap.resolved || 0) + (statusMap.closed || 0),
                color: '#16a34a',
            },
        ];

        const groupCounts: Record<string, number> = {};
        for (const row of byType) {
            const gid = typeToGroupId(String(row._id || ''));
            groupCounts[gid] = (groupCounts[gid] || 0) + row.count;
        }
        groupBreakdown = SERVICE_GROUPS.map(g => ({
            id: g.id,
            label: g.label,
            value: groupCounts[g.id] || 0,
        }))
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // Last 6 months trend (IST-ish via +05:30 offset on createdAt for grouping)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const trendAgg = await Complaint.aggregate<{ _id: string; count: number }>([
            { $match: { ...filter, createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const trendMap = Object.fromEntries(trendAgg.map(t => [t._id, t.count]));
        monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyTrend.push({ month: key, label: monthLabel(key), count: trendMap[key] || 0 });
        }

        recentComplaints = recent.map(c => ({
            id: String(c._id),
            complaintId: c.complaintId || null,
            complaintType: String(c.complaintType || ''),
            typeLabel: COMPLAINT_TYPE_LABELS[String(c.complaintType)] || String(c.complaintType || '—'),
            policeStation: c.policeStation || '—',
            status: String(c.status || 'pending'),
            source: (c as { source?: string }).source || 'whatsapp',
            createdAt: c.createdAt.toISOString(),
        }));

        attention.push(
            card({
                id: 'complaints-pending',
                label: 'Pending complaints',
                value: pending,
                hint: pending > 0 ? 'Needs review or assignment' : 'Nothing waiting',
                href: '/dashboard/complaints?status=pending',
                section: 'complaints',
            })
        );

        if (pending > 0) {
            alerts.push({
                id: 'alert-pending',
                title: `${pending} complaint${pending === 1 ? '' : 's'} pending`,
                detail: 'Awaiting review or assignment',
                href: '/dashboard/complaints?status=pending',
                severity: pending > 10 ? 'urgent' : 'warning',
            });
        }

        operations.push(
            card({
                id: 'complaints-in-progress',
                label: 'In progress',
                value: inProgress,
                hint: 'Being handled',
                href: '/dashboard/complaints?status=in_progress',
                variant: inProgress > 0 ? 'info' : 'default',
                section: 'complaints',
                needsAttention: false,
            }),
            card({
                id: 'complaints-resolved',
                label: 'Resolved',
                value: resolved,
                hint: 'Closed cases',
                href: '/dashboard/complaints?status=resolved',
                variant: 'success',
                section: 'complaints',
                needsAttention: false,
            }),
            card({
                id: 'complaints-today',
                label: 'New today',
                value: todayNew,
                hint: 'Submitted since midnight IST',
                href: '/dashboard/complaints?status=all',
                variant: todayNew > 0 ? 'info' : 'default',
                section: 'complaints',
                needsAttention: false,
            })
        );

        if (sathiPending > 0) {
            attention.push(
                card({
                    id: 'sathi-pending',
                    label: 'Saathi app pending',
                    value: sathiPending,
                    hint: 'From mobile app — needs action',
                    href: '/dashboard/complaints?status=pending',
                    variant: 'warning',
                    section: 'complaints',
                })
            );
            alerts.push({
                id: 'alert-sathi',
                title: `${sathiPending} Saathi app pending`,
                detail: 'Mobile app submissions need action',
                href: '/dashboard/complaints?status=pending',
                severity: 'warning',
            });
        }

        quickActions.push({
            id: 'qa-complaints',
            label: 'Complaints',
            href: '/dashboard/complaints',
            tone: 'blue',
        });
    }

    if (hasSectionAccess(user, 'raw_complaints')) {
        const filter = await buildRawComplaintFilter(user);
        const [rp, rip] = await Promise.all([
            RawComplaint.countDocuments({ ...filter, status: 'pending' }),
            RawComplaint.countDocuments({ ...filter, status: 'in_progress' }),
        ]);
        rawPending = rp;

        attention.push(
            card({
                id: 'raw-pending',
                label: 'Raw submissions pending',
                value: rp,
                hint: 'Invalid-format messages to review',
                href: '/dashboard/raw-complaints?status=pending',
                section: 'raw_complaints',
            })
        );

        if (rp > 0) {
            alerts.push({
                id: 'alert-raw',
                title: `${rp} raw submission${rp === 1 ? '' : 's'} pending`,
                detail: 'Non-standard messages awaiting review',
                href: '/dashboard/raw-complaints?status=pending',
                severity: 'warning',
            });
        }

        operations.push(
            card({
                id: 'raw-in-progress',
                label: 'Raw in progress',
                value: rip,
                hint: 'Under manual review',
                href: '/dashboard/raw-complaints?status=in_progress',
                variant: rip > 0 ? 'info' : 'default',
                section: 'raw_complaints',
                needsAttention: false,
            })
        );

        quickActions.push({
            id: 'qa-raw',
            label: 'Raw Complaints',
            href: '/dashboard/raw-complaints',
            tone: 'amber',
        });
    }

    if (hasSectionAccess(user, 'chats') && user.canAccessChats) {
        const scopedPhones = await getScopedPhoneNumbers(user);
        const contactQuery = scopedPhones?.length ? { phoneNumber: { $in: scopedPhones } } : {};

        const [totalChats, unreadAgg] = await Promise.all([
            Contact.countDocuments(contactQuery),
            Contact.aggregate([
                { $match: contactQuery },
                { $group: { _id: null, total: { $sum: '$unreadCount' } } },
            ]),
        ]);
        const unread = unreadAgg[0]?.total ?? 0;

        if (unread > 0) {
            attention.push(
                card({
                    id: 'chats-unread',
                    label: 'Unread WhatsApp',
                    value: unread,
                    hint: 'Citizen messages awaiting reply',
                    href: '/dashboard/chats',
                    variant: 'warning',
                    section: 'chats',
                })
            );
            alerts.push({
                id: 'alert-chats',
                title: `${unread} unread WhatsApp message${unread === 1 ? '' : 's'}`,
                detail: 'Citizens awaiting a reply',
                href: '/dashboard/chats',
                severity: 'info',
            });
        }

        operations.push(
            card({
                id: 'chats-total',
                label: 'Conversations',
                value: totalChats,
                hint: unread > 0 ? `${unread} unread message(s)` : 'All caught up',
                href: '/dashboard/chats',
                variant: 'default',
                section: 'chats',
                needsAttention: false,
            })
        );

        quickActions.push({ id: 'qa-chats', label: 'Chats', href: '/dashboard/chats', tone: 'cyan' });
    }

    if (hasSectionAccess(user, 'reviews')) {
        const [pendingReviews, totalReviews] = await Promise.all([
            Review.countDocuments({ status: 'pending' }),
            Review.countDocuments({}),
        ]);

        if (pendingReviews > 0) {
            attention.push(
                card({
                    id: 'reviews-pending',
                    label: 'Pending reviews',
                    value: pendingReviews,
                    hint: 'Citizen feedback to approve',
                    href: '/dashboard/reviews',
                    variant: 'warning',
                    section: 'reviews',
                })
            );
        }

        operations.push(
            card({
                id: 'reviews-total',
                label: 'Total reviews',
                value: totalReviews,
                hint: 'All feedback received',
                href: '/dashboard/reviews',
                section: 'reviews',
                needsAttention: false,
            })
        );
    }

    if (hasSectionAccess(user, 'police_stations')) {
        const [stationTotal, active] = await Promise.all([
            PoliceStation.countDocuments({}),
            PoliceStation.countDocuments({ isActive: true }),
        ]);
        reference.push(
            card({
                id: 'stations',
                label: 'Police stations',
                value: active,
                hint: `${stationTotal} total in directory`,
                href: '/dashboard/police-stations',
                section: 'police_stations',
                needsAttention: false,
            })
        );
        quickActions.push({
            id: 'qa-stations',
            label: 'Stations',
            href: '/dashboard/police-stations',
            tone: 'green',
        });
    }

    if (hasSectionAccess(user, 'traffic_rules')) {
        const active = await TrafficViolation.countDocuments({ isActive: true });
        reference.push(
            card({
                id: 'traffic',
                label: 'Traffic rules',
                value: active,
                hint: 'Active violation entries',
                href: '/dashboard/traffic-rules',
                section: 'traffic_rules',
                needsAttention: false,
            })
        );
    }

    if (hasSectionAccess(user, 'resources')) {
        const active = await Resource.countDocuments({ isActive: true });
        reference.push(
            card({
                id: 'resources',
                label: 'Resources',
                value: active,
                hint: 'Links & info shown in chatbot',
                href: '/dashboard/resources',
                section: 'resources',
                needsAttention: false,
            })
        );
    }

    if (hasSectionAccess(user, 'admin_users') || user.canManageAdmins) {
        const admins = await User.countDocuments({ isActive: { $ne: false } });
        reference.push(
            card({
                id: 'admins',
                label: 'Active admins',
                value: admins,
                hint: user.canManageAdmins ? 'Manage team access' : 'Administrator accounts',
                href: '/dashboard/users',
                section: 'admin_users',
                needsAttention: false,
            })
        );
        quickActions.push({ id: 'qa-users', label: 'Admins', href: '/dashboard/users', tone: 'purple' });
    }

    const health = getWhatsAppHealth();
    if (hasSectionAccess(user, 'settings') || user.isSuperAdmin) {
        reference.push(
            card({
                id: 'whatsapp',
                label: 'WhatsApp API',
                value: health.configured ? 'OK' : 'Setup',
                hint: health.configured
                    ? health.otpTemplateSet
                        ? 'Ready for chatbot & Saathi OTP'
                        : 'OTP template not set'
                    : 'Configure in settings',
                href: '/dashboard/settings',
                variant: health.configured ? (health.otpTemplateSet ? 'success' : 'warning') : 'urgent',
                section: 'settings',
                needsAttention: !health.configured,
            })
        );
        quickActions.push({ id: 'qa-settings', label: 'Settings', href: '/dashboard/settings', tone: 'red' });
    }

    attention.sort((a, b) => {
        const score = (c: DashboardStatCard) => (c.variant === 'urgent' ? 0 : c.variant === 'warning' ? 1 : 2);
        return score(a) - score(b);
    });

    return {
        attention,
        operations,
        reference,
        kpis: {
            total,
            pending,
            inProgress,
            resolved,
            today: todayNew,
            rawPending,
        },
        statusBreakdown,
        groupBreakdown,
        monthlyTrend,
        recentComplaints,
        alerts,
        quickActions,
        canViewComplaints,
    };
}
