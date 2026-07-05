import { NextRequest } from 'next/server';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import { getAppSessionFromRequest, revokeAppSession } from '@/lib/app-auth';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function POST(request: NextRequest) {
    const session = await getAppSessionFromRequest(request);
    if (!session) {
        return jsonWithCors(request, { success: false, error: 'Unauthorized' }, 401);
    }
    await revokeAppSession(session.token);
    return jsonWithCors(request, { success: true });
}
