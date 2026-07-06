'use server';

import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signToken, setSession, clearSession, getSession, parseSessionUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fullPermissions } from '@/lib/admin-permissions';
import { ensureLegacyAdminMigrated } from '@/lib/admin-auth';

export async function login(prevState: any, formData: FormData) {
    await connectDB();

    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    if (!identifier || !password) {
        return { error: 'Please provide both identifier and password' };
    }

    try {
        const user = await User.findOne({
            $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
        }).select('+password');

        if (!user) {
            return { error: 'Invalid credentials' };
        }

        if (user.isActive === false) {
            return { error: 'This account has been deactivated.' };
        }

        const isMatch = await bcrypt.compare(password, user.password!);

        if (!isMatch) {
            return { error: 'Invalid credentials' };
        }

        await ensureLegacyAdminMigrated(user);

        const token = await signToken({ userId: user._id.toString(), username: user.username });
        await setSession(token);
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Something went wrong. Please try again.' };
    }

    redirect('/dashboard');
}

export async function logout() {
    await clearSession();
    redirect('/login');
}

export async function hasUsers() {
    await connectDB();
    const count = await User.countDocuments();
    return count > 0;
}

export async function createFirstUser(prevState: any, formData: FormData) {
    await connectDB();
    const count = await User.countDocuments();

    if (count > 0) {
        return { error: 'Admin already exists. Please login.' };
    }

    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!username || !email || !password) {
        return { error: 'All fields are required' };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword,
            isSuperAdmin: true,
            canManageAdmins: true,
            canAccessChats: true,
            permissions: fullPermissions(),
            policeStationNames: [],
            isActive: true,
        });

        const user = await User.findOne({ username });
        const token = await signToken({ userId: user!._id.toString(), username: user!.username });
        await setSession(token);
    } catch (error) {
        return { error: 'Failed to create admin.' };
    }

    redirect('/dashboard');
}

/** @deprecated Use createAdminUser from app/actions/users.ts */
export async function createOtherUser(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session) {
        return { error: 'Unauthorized' };
    }

    await connectDB();
    const actor = await User.findById(parseSessionUserId(session));
    if (!actor) return { error: 'Unauthorized' };
    await ensureLegacyAdminMigrated(actor);
    if (!actor.isSuperAdmin && !actor.canManageAdmins) {
        return { error: 'You do not have permission to create admins.' };
    }

    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!username || !email || !password) {
        return { error: 'All fields are required' };
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username }],
        });

        if (existingUser) {
            return { error: 'User with this email or username already exists' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword,
            isSuperAdmin: false,
            canManageAdmins: false,
            canAccessChats: false,
            permissions: fullPermissions(),
            policeStationNames: [],
            isActive: true,
        });

        return { success: 'User created successfully' };
    } catch (error) {
        console.error('Create user error:', error);
        return { error: 'Failed to create user' };
    }
}
