import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const MAX_BYTES = 12 * 1024 * 1024;

export async function saveAppImageBuffer(
    buf: Buffer,
    mime: string,
    folder = 'app-uploads'
): Promise<string> {
    if (buf.length > MAX_BYTES) {
        throw new Error('Image too large (max 12MB)');
    }

    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';

    const filename = `${randomUUID()}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { put } = await import('@vercel/blob');
        const blob = await put(`${folder}/${filename}`, buf, {
            access: 'public',
            contentType: mime,
            addRandomSuffix: false,
        });
        return blob.url;
    }

    if (process.env.VERCEL) {
        throw new Error('Image upload requires Vercel Blob (BLOB_READ_WRITE_TOKEN) in production.');
    }

    const dir = path.join(process.cwd(), 'public', 'uploads', folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buf);
    return `/uploads/${folder}/${filename}`;
}
