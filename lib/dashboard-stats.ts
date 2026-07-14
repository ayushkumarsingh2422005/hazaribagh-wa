import connectDB from '@/lib/db';
import Complaint from '@/models/Complaint';
import RawComplaint from '@/models/RawComplaint';
import Contact from '@/models/Contact';
import Review from '@/models/Review';
import User from '@/models/User';
import PoliceStation from '@/models/PoliceStation';
import PoliceOffice from '@/models/PoliceOffice';
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

export type DashboardOverview = {
    attention: DashboardStatCard[];
    operations: DashboardStatCard[];
    reference: DashboardStatCard[];
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


export async function getDashboardOverview(user: AuthAdminUser): Promise<DashboardOverview> {
    await connectDB();

    const attention: DashboardStatCard[] = [];
    const operations: DashboardStatCard[] = [];
    const reference: DashboardStatCard[] = [];

    const todayStart = startOfTodayIST();

    if (hasSectionAccess(user, 'complaints')) {
        const filter = await buildComplaintFilter(user);
        const [pending, inProgress, resolved, todayNew, sathiPending] = await Promise.all([
            Complaint.countDocuments({ ...filter, status: 'pending' }),
            Complaint.countDocuments({ ...filter, status: 'in_progress' }),
            Complaint.countDocuments({ ...filter, status: { $in: ['resolved', 'closed'] } }),
            Complaint.countDocuments({ ...filter, createdAt: { $gte: todayStart } }),
            Complaint.countDocuments({ ...filter, status: 'pending', source: 'app' }),
        ]);

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
                    label: 'Sathi app pending',
                    value: sathiPending,
                    hint: 'From mobile app — needs action',
                    href: '/dashboard/complaints?status=pending',
                    variant: 'warning',
                    section: 'complaints',
                })
            );
        }
    }

    if (hasSectionAccess(user, 'raw_complaints')) {
        const filter = await buildRawComplaintFilter(user);
        const [pending, inProgress] = await Promise.all([
            RawComplaint.countDocuments({ ...filter, status: 'pending' }),
            RawComplaint.countDocuments({ ...filter, status: 'in_progress' }),
        ]);

        attention.push(
            card({
                id: 'raw-pending',
                label: 'Raw submissions pending',
                value: pending,
                hint: 'Invalid-format messages to review',
                href: '/dashboard/raw-complaints?status=pending',
                section: 'raw_complaints',
            })
        );

        operations.push(
            card({
                id: 'raw-in-progress',
                label: 'Raw in progress',
                value: inProgress,
                hint: 'Under manual review',
                href: '/dashboard/raw-complaints?status=in_progress',
                variant: inProgress > 0 ? 'info' : 'default',
                section: 'raw_complaints',
                needsAttention: false,
            })
        );
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
        const [total, active] = await Promise.all([
            PoliceStation.countDocuments({}),
            PoliceStation.countDocuments({ isActive: true }),
        ]);
        reference.push(
            card({
                id: 'stations',
                label: 'Police stations',
                value: active,
                hint: `${total} total in directory`,
                href: '/dashboard/police-stations',
                section: 'police_stations',
                needsAttention: false,
            })
        );
    }

    if (hasSectionAccess(user, 'police_offices')) {
        const active = await PoliceOffice.countDocuments({ isActive: true });
        reference.push(
            card({
                id: 'offices',
                label: 'Police offices',
                value: active,
                hint: 'DSP / CI offices active',
                href: '/dashboard/police-offices',
                section: 'police_offices',
                needsAttention: false,
            })
        );
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
                        ? 'Ready for chatbot & Sathi OTP'
                        : 'OTP template not set'
                    : 'Configure in settings',
                href: '/dashboard/settings',
                variant: health.configured ? (health.otpTemplateSet ? 'success' : 'warning') : 'urgent',
                section: 'settings',
                needsAttention: !health.configured,
            })
        );
    }

    attention.sort((a, b) => {
        const score = (c: DashboardStatCard) => (c.variant === 'urgent' ? 0 : c.variant === 'warning' ? 1 : 2);
        return score(a) - score(b);
    });

    return {
        attention,
        operations,
        reference,
    };
}
