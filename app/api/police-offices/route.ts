import { NextRequest, NextResponse } from 'next/server';

/** DISABLED: Police Offices admin API — not needed for now. Restore handlers from git history. */

export async function GET() {
    return NextResponse.json({ error: 'Police offices feature is disabled' }, { status: 410 });
}

export async function POST(_request: NextRequest) {
    return NextResponse.json({ error: 'Police offices feature is disabled' }, { status: 410 });
}
