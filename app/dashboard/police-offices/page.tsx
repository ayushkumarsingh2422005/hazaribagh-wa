import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PoliceOffice from '@/models/PoliceOffice';
import connectDB from '@/lib/db';
import { MapPin, Phone } from 'lucide-react';
import SeedOfficesButton from './SeedOfficesButton';

async function getPoliceOffices() {
    await connectDB();
    const offices = await PoliceOffice.find({}).sort({ category: 1, displayOrder: 1, name: 1 }).lean();
    return offices.map((office) => ({
        ...office,
        _id: office._id.toString(),
        createdAt: office.createdAt.toISOString(),
        updatedAt: office.updatedAt.toISOString(),
    }));
}

export default async function PoliceOfficesPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const offices = await getPoliceOffices();
    const dspCount = offices.filter((o) => o.category === 'dsp').length;
    const ciCount = offices.filter((o) => o.category === 'ci').length;

    return (
        <DashboardLayout username={session.username as string}>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        Police Offices
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">
                        DSP / SDPO / CI offices shown in WhatsApp Location → Office Directory
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <SeedOfficesButton />
                    <a
                        href="/dashboard/police-offices/new"
                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                        Add New Office
                    </a>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        All Offices
                        <span className="ml-2 text-sm px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {offices.length} total · {dspCount} DSP/SDPO · {ciCount} CI
                        </span>
                    </h2>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {offices.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                            No offices yet. Click &quot;Seed Default Offices&quot; or &quot;Add New Office&quot;.
                        </div>
                    ) : (
                        offices.map((office) => (
                            <div
                                key={office._id}
                                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {office.name}
                                            </h3>
                                            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 uppercase">
                                                {office.category === 'dsp' ? 'DSP/SDPO' : 'CI'}
                                            </span>
                                            <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                {office.officeKey}
                                            </span>
                                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                Order: {office.displayOrder}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 text-xs font-medium ${
                                                    office.isActive
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}
                                            >
                                                {office.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                            {office.nameHindi}
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-slate-900 dark:text-white">
                                                        {office.address || '—'}
                                                    </p>
                                                    <p className="text-slate-500 text-xs">
                                                        {office.location.coordinates[1]},{' '}
                                                        {office.location.coordinates[0]}
                                                    </p>
                                                </div>
                                            </div>
                                            {office.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                                                    <span className="text-slate-900 dark:text-white">
                                                        {office.phone}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <a
                                        href={`/dashboard/police-offices/edit/${office._id}`}
                                        className="ml-4 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                    >
                                        Edit
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
