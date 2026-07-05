import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ORIGINS = ['*'];

export function getCorsOrigin(request: NextRequest): string {
    const configured = process.env.APP_CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
    const allowed = configured?.length ? configured : DEFAULT_ORIGINS;
    const origin = request.headers.get('origin');
    if (allowed.includes('*')) return origin || '*';
    if (origin && allowed.includes(origin)) return origin;
    return allowed[0] || '*';
}

export function corsHeaders(request: NextRequest): HeadersInit {
    return {
        'Access-Control-Allow-Origin': getCorsOrigin(request),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

export function withCors(request: NextRequest, response: NextResponse): NextResponse {
    const headers = corsHeaders(request);
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    return response;
}

export function jsonWithCors(request: NextRequest, body: unknown, status = 200): NextResponse {
    return withCors(request, NextResponse.json(body, { status }));
}

export function handleOptions(request: NextRequest): NextResponse {
    return withCors(request, new NextResponse(null, { status: 204 }));
}
