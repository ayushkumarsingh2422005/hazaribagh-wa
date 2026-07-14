import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/models/Review';
import { getSession } from '@/lib/auth';
import { getAuthAdminUser } from '@/lib/admin-auth';
import { hasSectionAccess } from '@/lib/admin-permissions';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = await getAuthAdminUser();
        if (!admin || !hasSectionAccess(admin, 'reviews')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const { status } = await request.json();

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectDB();
        const review = await Review.findByIdAndUpdate(id, { status }, { new: true });

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, review });
    } catch {
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}
