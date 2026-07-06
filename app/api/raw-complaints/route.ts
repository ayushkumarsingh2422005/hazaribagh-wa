import { NextRequest, NextResponse } from 'next/server';
import {
    apiForbidden,
    apiUnauthorized,
    buildRawComplaintFilter,
    getApiAuthAdminUser,
} from '@/lib/admin-auth';
import { hasSectionAccess } from '@/lib/admin-permissions';
import connectDB from '@/lib/db';
import RawComplaint from '@/models/RawComplaint';

export async function GET(request: NextRequest) {
    try {
        const user = await getApiAuthAdminUser();
        if (!user) return apiUnauthorized();
        if (!hasSectionAccess(user, 'raw_complaints')) return apiForbidden();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const flowStep = searchParams.get('flowStep');

        await connectDB();

        const scopeFilter = await buildRawComplaintFilter(user);
        const query: Record<string, unknown> = { ...scopeFilter };
        if (status) query.status = status;
        if (flowStep) query.flowStep = flowStep;

        const rawComplaints = await RawComplaint.find(query).sort({ createdAt: -1 }).limit(200);
        return NextResponse.json({ success: true, rawComplaints });
    } catch (error) {
        console.error('Error fetching raw complaints:', error);
        return NextResponse.json({ error: 'Failed to fetch raw complaints' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getApiAuthAdminUser();
        if (!user) return apiUnauthorized();
        if (!hasSectionAccess(user, 'raw_complaints')) return apiForbidden();

        const data = await request.json();
        await connectDB();

        const rawComplaint = await RawComplaint.create(data);
        return NextResponse.json({ success: true, rawComplaint });
    } catch (error) {
        console.error('Error creating raw complaint:', error);
        return NextResponse.json({ error: 'Failed to create raw complaint' }, { status: 500 });
    }
}
