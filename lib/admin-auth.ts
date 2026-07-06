import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import PoliceStation from '@/models/PoliceStation';
import Complaint from '@/models/Complaint';
import { getSession, parseSessionUserId } from '@/lib/auth';
import {
    type AdminSection,
    emptyPermissions,
    fullPermissions,
    hasSectionAccess,
    canManageAdminUsers,
    type AdminPermissions,
    ALL_SECTIONS,
} from '@/lib/admin-permissions';
import { flowStepsForComplaintTypes } from '@/lib/complaint-services';

export type AuthAdminUser = {
    _id: string;
    username: string;
    email: string;
    isSuperAdmin: boolean;
    canManageAdmins: boolean;
    canAccessChats: boolean;
    permissions: AdminPermissions;
    policeStationNames: string[];
    allowedComplaintTypes: string[];
    isActive: boolean;
};

function normalizePermissions(raw?: Partial<AdminPermissions>): AdminPermissions {
    const out = emptyPermissions();
    if (!raw) return out;
    for (const key of ALL_SECTIONS) {
        if (typeof raw[key] === 'boolean') out[key] = raw[key]!;
    }
    return out;
}

function isLegacyAdminWithoutRbac(userDoc: {
    isSuperAdmin?: boolean;
    canManageAdmins?: boolean;
    canAccessChats?: boolean;
    permissions?: Partial<AdminPermissions>;
}): boolean {
    if (userDoc.isSuperAdmin) return false;
    if (userDoc.canManageAdmins || userDoc.canAccessChats) return false;
    const perms = userDoc.permissions || {};
    return !Object.values(perms).some(Boolean);
}

export async function ensureLegacyAdminMigrated(userDoc: {
    _id: unknown;
    isSuperAdmin?: boolean;
    permissions?: Partial<AdminPermissions>;
    canManageAdmins?: boolean;
    canAccessChats?: boolean;
    policeStationNames?: string[];
    allowedComplaintTypes?: string[];
    isActive?: boolean;
    save?: () => Promise<unknown>;
}): Promise<void> {
    if (!isLegacyAdminWithoutRbac(userDoc)) return;

    userDoc.isSuperAdmin = true;
    userDoc.canManageAdmins = true;
    userDoc.canAccessChats = true;
    userDoc.permissions = fullPermissions();
    userDoc.policeStationNames = userDoc.policeStationNames || [];
    userDoc.allowedComplaintTypes = userDoc.allowedComplaintTypes || [];
    userDoc.isActive = userDoc.isActive !== false;
    if (typeof (userDoc as { markModified?: (p: string) => void }).markModified === 'function') {
        (userDoc as unknown as { markModified: (p: string) => void }).markModified('permissions');
    }
    if (userDoc.save) await userDoc.save();
}

export async function getAuthAdminUser(): Promise<AuthAdminUser | null> {
    const session = await getSession();
    const userId = parseSessionUserId(session);
    if (!userId) return null;

    await connectDB();
    const user = await User.findById(userId);
    if (!user || user.isActive === false) return null;

    await ensureLegacyAdminMigrated(user);

    return {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        isSuperAdmin: !!user.isSuperAdmin,
        canManageAdmins: !!user.canManageAdmins,
        canAccessChats: !!user.canAccessChats,
        permissions: normalizePermissions(user.permissions as Partial<AdminPermissions>),
        policeStationNames: user.policeStationNames || [],
        allowedComplaintTypes: user.allowedComplaintTypes || [],
        isActive: user.isActive,
    };
}

export async function requireAuthAdminUser(): Promise<AuthAdminUser> {
    const user = await getAuthAdminUser();
    if (!user) redirect('/login');
    return user;
}

export async function requireSection(section: AdminSection): Promise<AuthAdminUser> {
    const user = await requireAuthAdminUser();
    if (!hasSectionAccess(user, section)) {
        redirect('/dashboard?access=denied');
    }
    return user;
}

export async function requireManageAdmins(): Promise<AuthAdminUser> {
    const user = await requireAuthAdminUser();
    if (!canManageAdminUsers(user)) {
        redirect('/dashboard?access=denied');
    }
    return user;
}

export function apiUnauthorized() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function apiForbidden() {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function getApiAuthAdminUser() {
    return getAuthAdminUser();
}

export async function getStationAliasMap(): Promise<Record<string, string>> {
    await connectDB();
    const stations = await PoliceStation.find({ isActive: true })
        .select('name nameHindi')
        .sort({ displayOrder: 1, name: 1 })
        .lean();

    const aliasMap: Record<string, string> = {};
    for (const s of stations) {
        const canonical = String(s.name || '').trim();
        const english = canonical.toLowerCase();
        const hindi = String(s.nameHindi || '').trim().toLowerCase();
        if (english) aliasMap[english] = canonical;
        if (hindi) aliasMap[hindi] = canonical;
        if (canonical) aliasMap[canonical] = canonical;
    }
    return aliasMap;
}

export async function expandPoliceStationNames(names: string[]): Promise<string[]> {
    if (!names.length) return [];
    const aliasMap = await getStationAliasMap();
    const expanded = new Set<string>();
    for (const name of names) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        expanded.add(trimmed);
        const lower = trimmed.toLowerCase();
        if (aliasMap[lower]) expanded.add(aliasMap[lower]);
    }
    return Array.from(expanded);
}

/** Empty array = all stations (district-wide). Non-empty = scoped to listed PS. */
export async function buildPoliceStationQuery(user: AuthAdminUser): Promise<Record<string, unknown>> {
    if (user.isSuperAdmin || !user.policeStationNames?.length) {
        return {};
    }
    const expanded = await expandPoliceStationNames(user.policeStationNames);
    if (!expanded.length) return { policeStation: { $in: ['__none__'] } };
    return { policeStation: { $in: expanded } };
}

/** Phone numbers tied to PS scope only (for raw complaints — service scope uses flowStep). */
export async function getStationScopedPhoneQuery(user: AuthAdminUser): Promise<Record<string, unknown>> {
    if (userHasAllStations(user)) return {};
    const stationQ = await buildPoliceStationQuery(user);
    await connectDB();
    const phones = await Complaint.find(stationQ).distinct('phoneNumber');
    const list = phones.filter(Boolean).map(String);
    return list.length ? { phoneNumber: { $in: list } } : { phoneNumber: { $in: ['__none__'] } };
}

export async function getScopedPhoneNumbers(user: AuthAdminUser): Promise<string[] | null> {
    if (user.isSuperAdmin) return null;
    const hasStationScope = !!user.policeStationNames?.length;
    const hasServiceScope = !!user.allowedComplaintTypes?.length;
    if (!hasStationScope && !hasServiceScope) return null;

    await connectDB();
    const filter = await buildComplaintFilter(user);
    const phones = await Complaint.find(filter).distinct('phoneNumber');
    return phones.filter(Boolean).map(String);
}

export function userHasAllStations(user: AuthAdminUser): boolean {
    return user.isSuperAdmin || !user.policeStationNames?.length;
}

export function userHasAllServices(user: AuthAdminUser): boolean {
    return user.isSuperAdmin || !user.allowedComplaintTypes?.length;
}

export function buildComplaintTypeQuery(user: AuthAdminUser): Record<string, unknown> {
    if (userHasAllServices(user)) return {};
    const types = user.allowedComplaintTypes || [];
    if (!types.length) return {};
    return { complaintType: { $in: types } };
}

export function buildRawComplaintFlowStepQuery(user: AuthAdminUser): Record<string, unknown> {
    if (userHasAllServices(user)) return {};
    const types = user.allowedComplaintTypes || [];
    if (!types.length) return {};
    const steps = flowStepsForComplaintTypes(types);
    return steps.length ? { flowStep: { $in: steps } } : { flowStep: { $in: ['__none__'] } };
}

export function canAccessComplaintType(user: AuthAdminUser, complaintType: string): boolean {
    if (userHasAllServices(user)) return true;
    return (user.allowedComplaintTypes || []).includes(complaintType);
}

/** Combined PS + service scope for Complaint queries */
export async function buildComplaintFilter(user: AuthAdminUser): Promise<Record<string, unknown>> {
    const stationQ = await buildPoliceStationQuery(user);
    const typeQ = buildComplaintTypeQuery(user);
    return { ...stationQ, ...typeQ };
}

/** Combined scope for RawComplaint queries (service via flowStep; PS via phone list). */
export async function buildRawComplaintFilter(user: AuthAdminUser): Promise<Record<string, unknown>> {
    const flowQ = buildRawComplaintFlowStepQuery(user);
    const stationPhoneQ = await getStationScopedPhoneQuery(user);
    return { ...flowQ, ...stationPhoneQ };
}
