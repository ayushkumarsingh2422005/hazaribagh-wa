import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PoliceOffice from '@/models/PoliceOffice';
import connectDB from '@/lib/db';
import { MapPin, Phone, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card, CardHeader, CardBody, ListRow } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import SeedOfficesButton from './SeedOfficesButton';

async function getPoliceOffices() {
    await connectDB();
    const offices = await PoliceOffice.find({}).sort({ category: 1, displayOrder: 1, name: 1 }).lean();
    return offices.map(office => ({
        ...office,
        _id: office._id.toString(),
        createdAt: office.createdAt.toISOString(),
        updatedAt: office.updatedAt.toISOString(),
    }));
}

export default async function PoliceOfficesPage() {
    const offices = await getPoliceOffices();
    const dspCount = offices.filter(o => o.category === 'dsp').length;
    const ciCount = offices.filter(o => o.category === 'ci').length;

    return (
        <DashboardLayout section="police_offices">
            <PageHeader
                title="Police Offices"
                actions={
                    <div className="flex flex-wrap gap-2">
                        <SeedOfficesButton />
                        <ButtonLink href="/dashboard/police-offices/new">Add Office</ButtonLink>
                    </div>
                }
            />

            <Card>
                <CardHeader
                    title="All Offices"
                    count={offices.length}
                    actions={
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {dspCount} DSP/SDPO · {ciCount} CI
                        </span>
                    }
                />
                <CardBody divided>
                    {offices.length === 0 ? (
                        <EmptyState icon={Building2} title="No offices yet" />
                    ) : (
                        offices.map(office => (
                            <ListRow key={office._id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {office.name}
                                            </h3>
                                            <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 uppercase">
                                                {office.category === 'dsp' ? 'DSP/SDPO' : 'CI'}
                                            </span>
                                            <span className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                {office.officeKey}
                                            </span>
                                            <span
                                                className={`px-1.5 py-0.5 text-xs font-medium ${
                                                    office.isActive
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}
                                            >
                                                {office.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{office.nameHindi}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-slate-900 dark:text-white">{office.address || '—'}</p>
                                                    <p className="text-slate-500">
                                                        {office.location.coordinates[1]}, {office.location.coordinates[0]}
                                                    </p>
                                                </div>
                                            </div>
                                            {office.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                    <span className="text-slate-900 dark:text-white">{office.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ButtonLink
                                        href={`/dashboard/police-offices/edit/${office._id}`}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Edit
                                    </ButtonLink>
                                </div>
                            </ListRow>
                        ))
                    )}
                </CardBody>
            </Card>
        </DashboardLayout>
    );
}
