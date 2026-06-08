import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db';
import PoliceOffice from '@/models/PoliceOffice';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const offices = await PoliceOffice.find({}).sort({ category: 1, displayOrder: 1, name: 1 });
        return NextResponse.json({ success: true, offices });
    } catch (error) {
        console.error('Error fetching police offices:', error);
        return NextResponse.json({ error: 'Failed to fetch offices' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const officeKey = String(data.officeKey || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');
        if (!officeKey) {
            return NextResponse.json({ error: 'Office key is required' }, { status: 400 });
        }

        await connectDB();

        const existing = await PoliceOffice.findOne({ officeKey });
        if (existing) {
            return NextResponse.json({ error: 'Office key already exists' }, { status: 400 });
        }

        const office = await PoliceOffice.create({
            officeKey,
            category: data.category === 'ci' ? 'ci' : 'dsp',
            name: data.name,
            nameHindi: data.nameHindi,
            address: data.address || '',
            addressHindi: data.addressHindi || '',
            location: {
                type: 'Point',
                coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
            },
            phone: String(data.phone || '').trim(),
            displayOrder: Number.isFinite(Number(data.displayOrder)) ? Number(data.displayOrder) : 0,
            isActive: data.isActive !== false,
        });

        return NextResponse.json({ success: true, office });
    } catch (error) {
        console.error('Error creating police office:', error);
        return NextResponse.json({ error: 'Failed to create office' }, { status: 500 });
    }
}
