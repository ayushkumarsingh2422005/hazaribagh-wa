import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Complaint from '@/models/Complaint';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import { getAppSessionFromRequest } from '@/lib/app-auth';
import { submitAppComplaint, COMPLAINT_TYPES_EXCLUDED_FROM_MY_ACTIVITIES } from '@/lib/app-submit';
import { phoneLookupVariants } from '@/lib/my-activities';
import { getComplaintStatusLabel, getComplaintTypeLabel } from '@/lib/complaint-labels';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function GET(request: NextRequest) {
    const session = await getAppSessionFromRequest(request);
    if (!session) {
        return jsonWithCors(request, { success: false, error: 'Unauthorized' }, 401);
    }

    await connectDB();
    const variants = phoneLookupVariants(session.phoneNumber);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') === 'hindi' ? 'hindi' : 'english';

    const complaints = await Complaint.find({
        phoneNumber: { $in: variants },
        complaintType: { $nin: [...COMPLAINT_TYPES_EXCLUDED_FROM_MY_ACTIVITIES] },
        complaintId: { $exists: true, $nin: [null, ''] },
    })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    return jsonWithCors(request, {
        success: true,
        complaints: complaints.map(c => ({
            complaintId: c.complaintId,
            complaintType: c.complaintType,
            typeLabel: getComplaintTypeLabel(String(c.complaintType), language),
            status: c.status,
            statusLabel: getComplaintStatusLabel(String(c.status), language),
            policeStation: c.policeStation || '',
            source: c.source || 'whatsapp',
            createdAt: c.createdAt,
        })),
    });
}

export async function POST(request: NextRequest) {
    const session = await getAppSessionFromRequest(request);
    if (!session) {
        return jsonWithCors(request, { success: false, error: 'Unauthorized' }, 401);
    }

    try {
        const body = await request.json();
        const result = await submitAppComplaint(session.phoneNumber, {
            complaintType: body.complaintType,
            language: body.language,
            data: body.data || {},
        });

        if (!result.success) {
            return jsonWithCors(request, { success: false, error: result.error }, 400);
        }

        return jsonWithCors(request, {
            success: true,
            complaintId: result.hideComplaintId ? null : result.complaintId,
            message: result.message,
        });
    } catch (error) {
        console.error('app complaint submit error:', error);
        return jsonWithCors(request, { success: false, error: 'Failed to submit' }, 500);
    }
}
