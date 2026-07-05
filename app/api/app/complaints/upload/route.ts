import { NextRequest } from 'next/server';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import { getAppSessionFromRequest } from '@/lib/app-auth';
import { saveAppImageBuffer } from '@/lib/app-upload';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function POST(request: NextRequest) {
    const session = await getAppSessionFromRequest(request);
    if (!session) {
        return jsonWithCors(request, { success: false, error: 'Unauthorized' }, 401);
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const purpose = String(formData.get('purpose') || 'missing-person');

        if (!file || !(file instanceof Blob)) {
            return jsonWithCors(request, { success: false, error: 'No image file provided.' }, 400);
        }

        const buf = Buffer.from(await file.arrayBuffer());
        const mime = file.type || 'image/jpeg';
        const folder = purpose === 'harassment' ? 'harassment' : 'missing-person';
        const url = await saveAppImageBuffer(buf, mime, folder);

        return jsonWithCors(request, { success: true, url });
    } catch (error) {
        console.error('upload error:', error);
        return jsonWithCors(
            request,
            { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
            500
        );
    }
}
