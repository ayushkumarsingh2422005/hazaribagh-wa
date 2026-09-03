import ReviewsClient from './ReviewsClient';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import connectDB from '@/lib/db';
import PoliceStation from '@/models/PoliceStation';
import Review from '@/models/Review';
import { PageHeader } from '@/components/ui/PageHeader';

async function getPoliceStations() {
    await connectDB();
    const stations = await PoliceStation.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select('name')
        .lean();
    return stations.map(s => s.name);
}

async function getReviews() {
    await connectDB();
    const reviews = await Review.find({}).sort({ createdAt: -1 }).limit(200).lean();
    return reviews.map(r => ({
        _id: r._id.toString(),
        phoneNumber: r.phoneNumber,
        name: r.name,
        content: r.content,
        status: r.status as 'pending' | 'approved' | 'rejected',
        createdAt: r.createdAt.toISOString(),
    }));
}

export default async function ReviewsPage() {
    const [policeStations, reviews] = await Promise.all([getPoliceStations(), getReviews()]);

    return (
        <DashboardLayout section="reviews">
            <PageHeader title="Reviews & Suggestions" subtitle="Operations" />
            <ReviewsClient policeStations={policeStations} initialReviews={reviews} />
        </DashboardLayout>
    );
}
