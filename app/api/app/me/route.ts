import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/models/Contact';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import { getAppSessionFromRequest } from '@/lib/app-auth';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function GET(request: NextRequest) {
    const session = await getAppSessionFromRequest(request);
    if (!session) {
        return jsonWithCors(request, { success: false, error: 'Unauthorized' }, 401);
    }

    await connectDB();
    const contact = await Contact.findOne({ phoneNumber: session.phoneNumber }).lean();

    return jsonWithCors(request, {
        success: true,
        user: {
            phoneNumber: session.phoneNumber,
            language: contact?.language || 'english',
            name: contact?.name || null,
        },
    });
}

export async function PATCH(request: NextRequest) {
    const session = await getAppSessionFromRequest(request);
    if (!session) {
        return jsonWithCors(request, { success: false, error: 'Unauthorized' }, 401);
    }

    const body = await request.json();
    await connectDB();

    const update: Record<string, unknown> = {};
    if (body.language === 'english' || body.language === 'hindi') {
        update.language = body.language;
    }
    if (body.name) update.name = String(body.name).trim();

    const contact = await Contact.findOneAndUpdate(
        { phoneNumber: session.phoneNumber },
        { $set: update },
        { upsert: true, new: true }
    ).lean();

    return jsonWithCors(request, {
        success: true,
        user: {
            phoneNumber: session.phoneNumber,
            language: contact?.language || 'english',
            name: contact?.name || null,
        },
    });
}
