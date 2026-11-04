import { uploadImageBuffer, type UploadFolder } from './blob-upload';

/** App / Saathi image upload — stores on Vercel Blob when configured. */
export async function saveAppImageBuffer(
    buf: Buffer,
    mime: string,
    folder: UploadFolder | string = 'app-uploads'
): Promise<string> {
    const normalized =
        folder === 'harassment' || folder === 'missing-person' || folder === 'app-uploads'
            ? folder
            : 'app-uploads';
    return uploadImageBuffer(buf, mime, normalized);
}
