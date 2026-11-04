import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { getBlobAccess } from '@/lib/blob-upload';

function isAllowedBlobUrl(raw: string): boolean {
    try {
        const host = new URL(raw).hostname;
        return host.endsWith('.blob.vercel-storage.com') || host === 'blob.vercel-storage.com';
    } catch {
        return false;
    }
}

/**
 * Stream a private Vercel Blob image so the dashboard / WhatsApp photo links work.
 * Only allows Vercel Blob hostnames (UUID filenames are not guessable).
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')?.trim();
    if (!url || !isAllowedBlobUrl(url)) {
        return NextResponse.json({ error: 'Invalid blob URL' }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: 'Blob storage is not configured' }, { status: 503 });
    }

    try {
        const access = getBlobAccess();
        const result = await get(url, { access });
        if (!result) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const contentType = result.blob.contentType || 'application/octet-stream';
        return new NextResponse(result.stream, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'private, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Blob media proxy failed:', error);
        return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
    }
}
