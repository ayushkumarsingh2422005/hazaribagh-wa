import { NextRequest, NextResponse } from 'next/server';

/** DISABLED: Police Offices admin API — not needed for now. Restore handlers from git history. */

export async function GET(
    _request: NextRequest,
    _context: { params: Promise<{ id: string }> }
) {
    return NextResponse.json({ error: 'Police offices feature is disabled' }, { status: 410 });
}

export async function PUT(
    _request: NextRequest,
    _context: { params: Promise<{ id: string }> }
) {
    return NextResponse.json({ error: 'Police offices feature is disabled' }, { status: 410 });
}

export async function DELETE(
    _request: NextRequest,
    _context: { params: Promise<{ id: string }> }
) {
    return NextResponse.json({ error: 'Police offices feature is disabled' }, { status: 410 });
}
