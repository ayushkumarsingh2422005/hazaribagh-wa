import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

async function downloadWhatsappImageBuffer(
    mediaId: string
): Promise<{ buf: Buffer; mime: string; ext: string }> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token) {
        throw new Error('WHATSAPP_ACCESS_TOKEN is not configured');
    }

    const metaRes = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) {
        const errText = await metaRes.text();
        throw new Error(`WhatsApp media metadata failed: ${metaRes.status} ${errText}`);
    }

    const meta = (await metaRes.json()) as { url?: string; mime_type?: string };
    const mediaUrl = meta.url;
    if (!mediaUrl) {
        throw new Error('WhatsApp media response missing url');
    }

    const binRes = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!binRes.ok) {
        throw new Error(`WhatsApp media download failed: ${binRes.status}`);
    }

    const mime = meta.mime_type || binRes.headers.get('content-type') || 'image/jpeg';
    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';

    const buf = Buffer.from(await binRes.arrayBuffer());
    if (buf.length > 12 * 1024 * 1024) {
        throw new Error('Image too large (max 12MB)');
    }

    return { buf, mime, ext };
}

/**
 * Downloads an inbound WhatsApp image and stores it.
 *
 * - **Vercel / production:** set `BLOB_READ_WRITE_TOKEN` (Vercel Blob). Returns a permanent `https://...` URL.
 * - **Local dev:** without that token, saves under `public/uploads/missing-person/` and returns `/uploads/...`.
 */
export async function saveWhatsappImageToUploads(mediaId: string): Promise<string> {
    const { buf, mime, ext } = await downloadWhatsappImageBuffer(mediaId);
    const filename = `${randomUUID()}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { put } = await import('@vercel/blob');
        const blob = await put(`missing-person/${filename}`, buf, {
            access: 'public',
            contentType: mime,
            addRandomSuffix: false,
        });
        return blob.url;
    }

    if (process.env.VERCEL) {
        throw new Error(
            'Missing person photos cannot be saved to disk on Vercel. Add Vercel Blob: create a Blob store in the Vercel dashboard and set BLOB_READ_WRITE_TOKEN on this project.'
        );
    }

    const dir = path.join(process.cwd(), 'public', 'uploads', 'missing-person');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buf);

    return `/uploads/missing-person/${filename}`;
}
