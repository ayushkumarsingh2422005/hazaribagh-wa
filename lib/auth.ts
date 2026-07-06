import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_key_change_this_in_prod';
const key = new TextEncoder().encode(SECRET_KEY);

export type SessionPayload = {
    userId?: string | { buffer: Record<string, number> };
    username?: string;
    iat?: number;
    exp?: number;
};

export async function signToken(payload: Record<string, unknown>) {
    const normalized = { ...payload };
    if (normalized.userId != null) {
        normalized.userId = String(normalized.userId);
    }
    return await new SignJWT(normalized)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d') // Token expires in 1 day
        .sign(key);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, key);
        return payload as SessionPayload;
    } catch (error) {
        return null;
    }
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    return await verifyToken(token);
}

export async function setSession(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400, // 1 day
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete('token');
}

/** Normalize userId from JWT payload (string or legacy ObjectId buffer object). */
export function parseSessionUserId(session: SessionPayload | null): string | null {
    const id = session?.userId;
    if (!id) return null;
    if (typeof id === 'string') return id;

    if (typeof id === 'object' && id !== null && 'buffer' in id) {
        const buf = (id as { buffer: Record<string, number> }).buffer;
        const bytes = Object.keys(buf)
            .map(Number)
            .sort((a, b) => a - b)
            .map(i => buf[String(i)]);
        return Buffer.from(bytes).toString('hex');
    }

    return String(id);
}
