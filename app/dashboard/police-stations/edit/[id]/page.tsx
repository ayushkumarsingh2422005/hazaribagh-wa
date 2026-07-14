import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import PoliceStationForm from '../../PoliceStationForm';
import connectDB from '@/lib/db';
import PoliceStation from '@/models/PoliceStation';

async function getPoliceStation(id: string) {
    await connectDB();
    const station = await PoliceStation.findById(id).lean();
    if (!station) return null;

    return {
        _id: station._id.toString(),
        name: station.name,
        nameHindi: station.nameHindi,
        address: station.address,
        addressHindi: station.addressHindi,
        district: station.district,
        governmentNumber:
            (station as { governmentNumber?: string }).governmentNumber ||
            station.contactNumber ||
            '',
        personalNumber: (station as { personalNumber?: string }).personalNumber || '',
        inchargeName: station.inchargeName || '',
        inchargeNameHindi: station.inchargeNameHindi || '',
        displayOrder: typeof station.displayOrder === 'number' ? station.displayOrder : 0,
        latitude: station.location.coordinates[1],
        longitude: station.location.coordinates[0],
        isActive: station.isActive,
        showInAssociatedPsList: (station as { showInAssociatedPsList?: boolean }).showInAssociatedPsList !== false,
    };
}

export default async function EditPoliceStationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const station = await getPoliceStation(id);

    if (!station) {
        redirect('/dashboard/police-stations');
    }

    return (
        <DashboardLayout section="police_stations">
            <PageHeader title="Edit Police Station" />

            <Card className="p-4">
                <PoliceStationForm initialData={station} />
            </Card>
        </DashboardLayout>
    );
}
