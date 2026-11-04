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

/** Match store setting: private (default) or public. Set BLOB_ACCESS=public if your Blob store is public. */
export function getBlobAccess(): 'public' | 'private' {
    return process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
}

function isVercelBlobUrl(value: string): boolean {
    try {
        const host = new URL(value).hostname;
        return host.endsWith('.blob.vercel-storage.com') || host === 'blob.vercel-storage.com';
    } catch {
        return false;
    }
}

/**
 * Store an image and return a publicly reachable URL (or Blob URL for private stores).
 *
 * - With `BLOB_READ_WRITE_TOKEN`: uploads to Vercel Blob
 * - On Vercel without the token: throws
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
        const access = getBlobAccess();
        const blob = await put(objectKey, buf, {
            access,
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

/**
 * Resolve stored photo path / Blob URL for browser & WhatsApp links.
 * Private Blob URLs are rewritten through `/api/media/blob` so they can be viewed.
 */
export function resolvePhotoUrl(pathOrUrl?: string | null): string {
    const value = String(pathOrUrl || '').trim();
    if (!value) return '';

    const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');

    if (value.startsWith('http://') || value.startsWith('https://')) {
        if (getBlobAccess() === 'private' && isVercelBlobUrl(value)) {
            if (!base) return value;
            return `${base}/api/media/blob?url=${encodeURIComponent(value)}`;
        }
        return value;
    }

    if (!base) return value.startsWith('/') ? value : `/${value}`;
    return `${base}${value.startsWith('/') ? value : `/${value}`}`;
}
