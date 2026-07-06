import { NextRequest, NextResponse } from 'next/server';
import {
    apiForbidden,
    apiUnauthorized,
    buildComplaintFilter,
    canAccessComplaintType,
    expandPoliceStationNames,
    getApiAuthAdminUser,
} from '@/lib/admin-auth';
import { hasSectionAccess } from '@/lib/admin-permissions';
import connectDB from '@/lib/db';
import Complaint from '@/models/Complaint';

export async function GET(request: NextRequest) {
    try {
        const user = await getApiAuthAdminUser();
        if (!user) return apiUnauthorized();
        if (!hasSectionAccess(user, 'complaints')) return apiForbidden();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        await connectDB();

        const complaintFilter = await buildComplaintFilter(user);
        const query: Record<string, unknown> = { ...complaintFilter };
        if (status) query.status = status;
        if (type) {
            if (!canAccessComplaintType(user, type)) return apiForbidden();
            query.complaintType = type;
        }

        const complaints = await Complaint.find(query).sort({ createdAt: -1 }).limit(100);
        return NextResponse.json({ success: true, complaints });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getApiAuthAdminUser();
        if (!user) return apiUnauthorized();
        if (!hasSectionAccess(user, 'complaints')) return apiForbidden();

        const data = await request.json();
        await connectDB();

        const complaint = await Complaint.create(data);
        return NextResponse.json({ success: true, complaint });
    } catch (error) {
        console.error('Error creating complaint:', error);
        return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
    }
}
