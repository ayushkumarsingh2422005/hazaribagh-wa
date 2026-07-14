import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import PoliceOffice from '@/models/PoliceOffice';
import connectDB from '@/lib/db';
import PoliceOfficeForm from '../../PoliceOfficeForm';

async function getOffice(id: string) {
    await connectDB();
    const office = await PoliceOffice.findById(id).lean();
    if (!office) return null;
    return {
        _id: office._id.toString(),
        officeKey: office.officeKey,
        category: office.category as 'dsp' | 'ci',
        name: office.name,
        nameHindi: office.nameHindi,
        address: office.address,
        addressHindi: office.addressHindi,
        phone: office.phone || '',
        displayOrder: office.displayOrder,
        latitude: office.location.coordinates[1],
        longitude: office.location.coordinates[0],
        isActive: office.isActive,
    };
}

export default async function EditPoliceOfficePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const office = await getOffice(id);
    if (!office) {
        notFound();
    }

    return (
        <DashboardLayout section="police_offices">
            <PageHeader title="Edit Police Office" />

            <Card className="p-4">
                <PoliceOfficeForm initialData={office} />
            </Card>
        </DashboardLayout>
    );
}
