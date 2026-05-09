import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReviewsClient from './ReviewsClient';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import connectDB from '@/lib/db';
import PoliceStation from '@/models/PoliceStation';

async function getPoliceStations() {
    await connectDB();
    const stations = await PoliceStation.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select('name')
        .lean();
    return stations.map(s => s.name);
}

export default async function ReviewsPage() {
    const session = await getSession();
    const policeStations = await getPoliceStations();

    if (!session) {
        redirect('/login');
    }

    return (
        <DashboardLayout username={session.username as string}>
            <ReviewsClient policeStations={policeStations} />
        </DashboardLayout>
    );
}
