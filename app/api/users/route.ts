import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import PoliceStation from '@/models/PoliceStation';
import {
    apiForbidden,
    apiUnauthorized,
    getApiAuthAdminUser,
    requireManageAdmins,
} from '@/lib/admin-auth';
import { canManageAdminUsers } from '@/lib/admin-permissions';
import { emptyPermissions } from '@/lib/admin-permissions';
import { validateAdminPhone } from '@/lib/admin-phone';

export async function GET() {
    const actor = await getApiAuthAdminUser();
    if (!actor) return apiUnauthorized();
    if (!canManageAdminUsers(actor)) return apiForbidden();

    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const stations = await PoliceStation.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select('name nameHindi')
        .lean();

    return NextResponse.json({
        success: true,
        users: users.map(u => ({
            _id: u._id.toString(),
            username: u.username,
            email: u.email,
            phoneNumber: u.phoneNumber || '',
            isSuperAdmin: !!u.isSuperAdmin,
            canManageAdmins: !!u.canManageAdmins,
            canAccessChats: !!u.canAccessChats,
            permissions: { ...emptyPermissions(), ...(u.permissions || {}) },
            policeStationNames: u.policeStationNames || [],
            isActive: u.isActive !== false,
            createdAt: u.createdAt,
        })),
        policeStations: stations.map(s => ({ name: s.name, nameHindi: s.nameHindi })),
        actor: {
            _id: actor._id,
            isSuperAdmin: actor.isSuperAdmin,
            canManageAdmins: actor.canManageAdmins,
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        const actor = await getApiAuthAdminUser();
        if (!actor) return apiUnauthorized();
        if (!canManageAdminUsers(actor)) return apiForbidden();

        const body = await request.json();
        await connectDB();

        const exists = await User.findOne({
            $or: [{ email: body.email?.toLowerCase() }, { username: body.username }],
        });
        if (exists) {
            return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
        }

        if (body.isSuperAdmin && !actor.isSuperAdmin) {
            return NextResponse.json({ error: 'Only super admin can create super admin' }, { status: 403 });
        }

        const phoneResult = validateAdminPhone(String(body.phoneNumber || ''));
        if (!phoneResult.ok) {
            return NextResponse.json({ error: phoneResult.error }, { status: 400 });
        }

        const bcrypt = await import('bcryptjs');
        const user = await User.create({
            username: body.username,
            email: body.email?.toLowerCase(),
            phoneNumber: phoneResult.phone,
            password: await bcrypt.hash(body.password, 10),
            isSuperAdmin: !!body.isSuperAdmin,
            canManageAdmins: !!body.isSuperAdmin || !!body.canManageAdmins,
            canAccessChats: !!body.isSuperAdmin || !!body.canAccessChats,
            permissions: body.permissions || emptyPermissions(),
            policeStationNames: body.isSuperAdmin ? [] : body.policeStationNames || [],
            isActive: body.isActive !== false,
        });

        return NextResponse.json({ success: true, userId: user._id.toString() });
    } catch (e) {
        console.error('POST /api/users', e);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
