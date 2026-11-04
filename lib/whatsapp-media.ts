import { uploadImageBuffer, type UploadFolder } from './blob-upload';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

async function downloadWhatsappImageBuffer(
    mediaId: string
): Promise<{ buf: Buffer; mime: string }> {
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
    const buf = Buffer.from(await binRes.arrayBuffer());

    return { buf, mime };
}

/**
 * Downloads an inbound WhatsApp image and stores it on Vercel Blob (or local uploads in dev).
 * Returns a public URL (`https://...` Blob URL in production).
 */
export async function saveWhatsappImageToUploads(
    mediaId: string,
    folder: UploadFolder = 'missing-person'
): Promise<string> {
    const { buf, mime } = await downloadWhatsappImageBuffer(mediaId);
    return uploadImageBuffer(buf, mime, folder);
}
