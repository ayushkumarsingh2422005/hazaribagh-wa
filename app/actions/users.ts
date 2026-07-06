'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import User from '@/models/User';
import {
    emptyPermissions,
    fullPermissions,
    parsePermissionsFromForm,
    parsePoliceStationsFromForm,
    type SerializedAdminUser,
} from '@/lib/admin-permissions';
import { parseAllowedComplaintTypesFromForm } from '@/lib/complaint-services';
import { requireManageAdmins, requireSection } from '@/lib/admin-auth';

function serializeUser(user: {
    _id: { toString(): string };
    username: string;
    email: string;
    isSuperAdmin?: boolean;
    canManageAdmins?: boolean;
    canAccessChats?: boolean;
    permissions?: Record<string, boolean>;
    policeStationNames?: string[];
    allowedComplaintTypes?: string[];
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}): SerializedAdminUser {
    const perms = { ...emptyPermissions(), ...(user.permissions || {}) };
    return {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        isSuperAdmin: !!user.isSuperAdmin,
        canManageAdmins: !!user.canManageAdmins,
        canAccessChats: !!user.canAccessChats,
        permissions: perms as SerializedAdminUser['permissions'],
        policeStationNames: user.policeStationNames || [],
        allowedComplaintTypes: user.allowedComplaintTypes || [],
        isActive: user.isActive !== false,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

export async function listAdminUsers(): Promise<SerializedAdminUser[]> {
    await requireSection('admin_users');
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return users.map(u => serializeUser(u as Parameters<typeof serializeUser>[0]));
}

export async function createAdminUser(prevState: unknown, formData: FormData) {
    const actor = await requireManageAdmins();

    const username = String(formData.get('username') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const isSuperAdmin = formData.get('isSuperAdmin') === 'on';
    const canManageAdmins = formData.get('canManageAdmins') === 'on';
    const canAccessChats = formData.get('canAccessChats') === 'on';
    const permissions = isSuperAdmin ? fullPermissions() : parsePermissionsFromForm(formData);
    const policeStationNames = parsePoliceStationsFromForm(formData);
    const allowedComplaintTypes = parseAllowedComplaintTypesFromForm(formData);

    if (!username || !email || !password) {
        return { error: 'Username, email and password are required.' };
    }

    if (isSuperAdmin && !actor.isSuperAdmin) {
        return { error: 'Only a super admin can create another super admin.' };
    }

    if (canManageAdmins && !actor.isSuperAdmin && !actor.canManageAdmins) {
        return { error: 'You cannot grant admin management rights.' };
    }

    try {
        await connectDB();
        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) return { error: 'Username or email already exists.' };

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email,
            password: hashedPassword,
            isSuperAdmin,
            canManageAdmins: isSuperAdmin || canManageAdmins,
            canAccessChats: isSuperAdmin || canAccessChats,
            permissions: isSuperAdmin ? permissions : permissions,
            policeStationNames: isSuperAdmin ? [] : policeStationNames,
            allowedComplaintTypes: isSuperAdmin ? [] : allowedComplaintTypes,
            isActive: true,
        });

        revalidatePath('/dashboard/users');
        return { success: 'Admin user created successfully.' };
    } catch (e) {
        console.error('createAdminUser', e);
        return { error: 'Failed to create admin user.' };
    }
}

export async function updateAdminUser(prevState: unknown, formData: FormData) {
    const actor = await requireManageAdmins();
    const userId = String(formData.get('userId') || '');
    if (!userId) return { error: 'User ID is required.' };

    const username = String(formData.get('username') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const isSuperAdmin = formData.get('isSuperAdmin') === 'on';
    const canManageAdmins = formData.get('canManageAdmins') === 'on';
    const canAccessChats = formData.get('canAccessChats') === 'on';
    const isActive = formData.get('isActive') !== 'off';
    const permissions = isSuperAdmin ? fullPermissions() : parsePermissionsFromForm(formData);
    const policeStationNames = parsePoliceStationsFromForm(formData);
    const allowedComplaintTypes = parseAllowedComplaintTypesFromForm(formData);

    if (!username || !email) {
        return { error: 'Username and email are required.' };
    }

    try {
        await connectDB();
        const target = await User.findById(userId).select('+password');
        if (!target) return { error: 'User not found.' };

        if (target.isSuperAdmin && !actor.isSuperAdmin && actor._id !== target._id.toString()) {
            return { error: 'Cannot modify a super admin.' };
        }

        if (isSuperAdmin && !actor.isSuperAdmin) {
            return { error: 'Only a super admin can grant super admin role.' };
        }

        const duplicate = await User.findOne({
            _id: { $ne: userId },
            $or: [{ email }, { username }],
        });
        if (duplicate) return { error: 'Username or email already in use.' };

        target.username = username;
        target.email = email;
        target.isSuperAdmin = isSuperAdmin;
        target.canManageAdmins = isSuperAdmin || canManageAdmins;
        target.canAccessChats = isSuperAdmin || canAccessChats;
        target.permissions = permissions;
        target.policeStationNames = isSuperAdmin ? [] : policeStationNames;
    target.allowedComplaintTypes = isSuperAdmin ? [] : allowedComplaintTypes;
        target.isActive = isActive;

        if (password) {
            target.password = await bcrypt.hash(password, 10);
        }

        await target.save();
        revalidatePath('/dashboard/users');
        return { success: 'Admin user updated successfully.' };
    } catch (e) {
        console.error('updateAdminUser', e);
        return { error: 'Failed to update admin user.' };
    }
}

export async function deleteAdminUser(userId: string) {
    const actor = await requireManageAdmins();
    if (!userId) return { error: 'User ID is required.' };
    if (userId === actor._id) return { error: 'You cannot delete your own account.' };

    try {
        await connectDB();
        const target = await User.findById(userId);
        if (!target) return { error: 'User not found.' };
        if (target.isSuperAdmin) return { error: 'Cannot delete a super admin.' };

        await User.deleteOne({ _id: userId });
        revalidatePath('/dashboard/users');
        return { success: 'Admin user deleted.' };
    } catch (e) {
        console.error('deleteAdminUser', e);
        return { error: 'Failed to delete admin user.' };
    }
}
