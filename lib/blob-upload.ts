import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const MAX_BYTES = 12 * 1024 * 1024;

export type UploadFolder = 'missing-person' | 'harassment' | 'app-uploads';

function extensionFromMime(mime: string): string {
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    return 'jpg';
}

/**
 * Store an image and return a publicly reachable URL.
 *
 * - With `BLOB_READ_WRITE_TOKEN`: uploads to Vercel Blob → permanent `https://...` URL
 * - On Vercel without the token: throws (disk is not writable)
 * - Local dev without the token: writes under `public/uploads/{folder}/`
 */
export async function uploadImageBuffer(
    buf: Buffer,
    mime: string,
    folder: UploadFolder = 'missing-person'
): Promise<string> {
    if (!buf?.length) {
        throw new Error('Empty image buffer');
    }
    if (buf.length > MAX_BYTES) {
        throw new Error('Image too large (max 12MB)');
    }

    const contentType = mime || 'image/jpeg';
    const filename = `${randomUUID()}.${extensionFromMime(contentType)}`;
    const objectKey = `${folder}/${filename}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { put } = await import('@vercel/blob');
        const blob = await put(objectKey, buf, {
            access: 'public',
            contentType,
            addRandomSuffix: false,
        });
        return blob.url;
    }

    if (process.env.VERCEL) {
        throw new Error(
            'Image upload requires Vercel Blob. Set BLOB_READ_WRITE_TOKEN on this project (Vercel → Storage → Blob).'
        );
    }

    const dir = path.join(process.cwd(), 'public', 'uploads', folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buf);
    return `/uploads/${folder}/${filename}`;
}

/** Resolve stored photo path or Blob URL for display / WhatsApp alerts. */
export function resolvePhotoUrl(pathOrUrl?: string | null): string {
    const value = String(pathOrUrl || '').trim();
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    if (!base) return value.startsWith('/') ? value : `/${value}`;
    return `${base}${value.startsWith('/') ? value : `/${value}`}`;
}
