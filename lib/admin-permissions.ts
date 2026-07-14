/** Dashboard section keys — matches sidebar modules */
export type AdminSection =
    | 'dashboard'
    | 'chats'
    | 'test_whatsapp'
    | 'police_stations'
    | 'police_offices'
    | 'traffic_rules'
    | 'complaints'
    | 'raw_complaints'
    | 'reviews'
    | 'resources'
    | 'admin_users'
    | 'settings';

export type AdminPermissions = Record<AdminSection, boolean>;

export const ADMIN_SECTION_META: Array<{
    key: AdminSection;
    label: string;
    href: string;
    description: string;
    group: 'overview' | 'operations' | 'directory' | 'administration';
}> = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', description: 'Home overview', group: 'overview' },
    { key: 'chats', label: 'WhatsApp Chats', href: '/dashboard/chats', description: 'View and reply to citizen chats', group: 'operations' },
    { key: 'test_whatsapp', label: 'Test WhatsApp', href: '/dashboard/test-whatsapp', description: 'Send test WhatsApp messages', group: 'operations' },
    { key: 'complaints', label: 'Complaints', href: '/dashboard/complaints', description: 'Structured complaints & reports', group: 'operations' },
    { key: 'raw_complaints', label: 'Raw Complaints', href: '/dashboard/raw-complaints', description: 'Unparsed citizen messages', group: 'operations' },
    { key: 'reviews', label: 'Reviews', href: '/dashboard/reviews', description: 'Citizen reviews & feedback', group: 'operations' },
    { key: 'police_stations', label: 'Police Stations', href: '/dashboard/police-stations', description: 'Manage police station directory', group: 'directory' },
    { key: 'police_offices', label: 'Police Offices', href: '/dashboard/police-offices', description: 'Manage DSP / CI offices', group: 'directory' },
    { key: 'traffic_rules', label: 'Traffic Rules', href: '/dashboard/traffic-rules', description: 'Manage traffic violations & fines', group: 'directory' },
    { key: 'resources', label: 'Resources', href: '/dashboard/resources', description: 'Helpful links & resources', group: 'directory' },
    { key: 'admin_users', label: 'Admin Users', href: '/dashboard/users', description: 'View administrator accounts', group: 'administration' },
    { key: 'settings', label: 'Settings', href: '/dashboard/settings', description: 'System settings', group: 'administration' },
];

export const NAV_GROUP_LABELS: Record<string, string> = {
    overview: 'Overview',
    operations: 'Operations',
    directory: 'Directory',
    administration: 'Administration',
};

export const ALL_SECTIONS: AdminSection[] = ADMIN_SECTION_META.map(s => s.key);

export function fullPermissions(): AdminPermissions {
    return ALL_SECTIONS.reduce((acc, key) => {
        acc[key] = true;
        return acc;
    }, {} as AdminPermissions);
}

export function emptyPermissions(): AdminPermissions {
    return ALL_SECTIONS.reduce((acc, key) => {
        acc[key] = false;
        return acc;
    }, {} as AdminPermissions);
}

export type SerializedAdminUser = {
    _id: string;
    username: string;
    email: string;
    phoneNumber?: string;
    isSuperAdmin: boolean;
    canManageAdmins: boolean;
    canAccessChats: boolean;
    permissions: AdminPermissions;
    policeStationNames: string[];
    allowedComplaintTypes: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type NavPermissions = {
    sections: AdminPermissions;
    isSuperAdmin: boolean;
    canManageAdmins: boolean;
    canAccessChats: boolean;
};

export function toNavPermissions(user: {
    isSuperAdmin?: boolean;
    canManageAdmins?: boolean;
    canAccessChats?: boolean;
    permissions?: Partial<AdminPermissions>;
}): NavPermissions {
    const isSuperAdmin = !!user.isSuperAdmin;
    const base = user.permissions || {};
    const sections = ALL_SECTIONS.reduce((acc, key) => {
        acc[key] = isSuperAdmin || !!base[key];
        return acc;
    }, {} as AdminPermissions);

    if (isSuperAdmin) {
        sections.chats = true;
    } else {
        sections.chats = !!base.chats && !!user.canAccessChats;
    }

    if (isSuperAdmin || user.canManageAdmins) {
        sections.admin_users = true;
    }

    return {
        sections,
        isSuperAdmin,
        canManageAdmins: isSuperAdmin || !!user.canManageAdmins,
        canAccessChats: isSuperAdmin || !!user.canAccessChats || !!sections.chats,
    };
}

export function hasSectionAccess(
    user: { isSuperAdmin?: boolean; canManageAdmins?: boolean; canAccessChats?: boolean; permissions?: Partial<AdminPermissions> },
    section: AdminSection
): boolean {
    const nav = toNavPermissions(user);
    if (section === 'chats') return nav.canAccessChats && nav.sections.chats;
    if (section === 'admin_users') return nav.sections.admin_users || nav.canManageAdmins;
    return nav.sections[section];
}

export function canManageAdminUsers(user: { isSuperAdmin?: boolean; canManageAdmins?: boolean }): boolean {
    return !!user.isSuperAdmin || !!user.canManageAdmins;
}

export function parsePermissionsFromForm(formData: FormData): AdminPermissions {
    const perms = emptyPermissions();
    for (const key of ALL_SECTIONS) {
        perms[key] = formData.get(`perm_${key}`) === 'on';
    }
    return perms;
}

export function parsePoliceStationsFromForm(formData: FormData): string[] {
    const raw = formData.get('policeStationNames') as string;
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
    } catch {
        return [];
    }
}
