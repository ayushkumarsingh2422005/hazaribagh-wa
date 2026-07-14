import { NextResponse } from 'next/server';

/** DISABLED: Police Offices seed API — not needed for now. */

export async function POST() {
    return NextResponse.json({ error: 'Police offices feature is disabled' }, { status: 410 });
}
