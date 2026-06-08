import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
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
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const { id } = await params;
    const office = await getOffice(id);
    if (!office) {
        notFound();
    }

    return (
        <DashboardLayout username={session.username as string}>
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    Edit Police Office
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">
                    Update office details for WhatsApp Office Directory
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                <PoliceOfficeForm initialData={office} />
            </div>
        </DashboardLayout>
    );
}
