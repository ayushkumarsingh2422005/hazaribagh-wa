import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectDB from '@/lib/db';
import PoliceOffice from '@/models/PoliceOffice';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();
        const office = await PoliceOffice.findById(id);

        if (!office) {
            return NextResponse.json({ error: 'Office not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, office });
    } catch (error) {
        console.error('Error fetching police office:', error);
        return NextResponse.json({ error: 'Failed to fetch office' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();
        await connectDB();

        const office = await PoliceOffice.findByIdAndUpdate(
            id,
            {
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
            },
            { new: true }
        );

        if (!office) {
            return NextResponse.json({ error: 'Office not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, office });
    } catch (error) {
        console.error('Error updating police office:', error);
        return NextResponse.json({ error: 'Failed to update office' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();
        const office = await PoliceOffice.findByIdAndDelete(id);

        if (!office) {
            return NextResponse.json({ error: 'Office not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting police office:', error);
        return NextResponse.json({ error: 'Failed to delete office' }, { status: 500 });
    }
}
