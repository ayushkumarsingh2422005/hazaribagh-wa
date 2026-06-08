import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { seedPoliceOffices } from '@/lib/seed-police-offices';

export async function POST() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await seedPoliceOffices();
        return NextResponse.json({
            success: true,
            message: `Seeded ${result.upserted} offices (${result.total} total in database).`,
            ...result,
        });
    } catch (error) {
        console.error('Error seeding police offices:', error);
        return NextResponse.json({ error: 'Failed to seed offices' }, { status: 500 });
    }
}
