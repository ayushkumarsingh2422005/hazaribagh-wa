import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PoliceStation from '@/models/PoliceStation';
import connectDB from '@/lib/db';
import { MapPin, Phone, User } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card, CardHeader, CardBody, ListRow } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

async function getPoliceStations() {
    await connectDB();
    const stations = await PoliceStation.find({}).sort({ displayOrder: 1, name: 1 }).lean();
    return stations.map(station => ({
        ...station,
        _id: station._id.toString(),
        createdAt: station.createdAt.toISOString(),
        updatedAt: station.updatedAt.toISOString(),
    }));
}

export default async function PoliceStationsPage() {
    const stations = await getPoliceStations();

    return (
        <DashboardLayout section="police_stations">
            <PageHeader
                title="Police Stations"
                actions={<ButtonLink href="/dashboard/police-stations/new">Add Station</ButtonLink>}
            />

            <Card>
                <CardHeader title="All Stations" count={stations.length} />
                <CardBody divided>
                    {stations.length === 0 ? (
                        <EmptyState
                            icon={MapPin}
                            title="No police stations yet"
                            action={<ButtonLink href="/dashboard/police-stations/new">Add Station</ButtonLink>}
                        />
                    ) : (
                        stations.map(station => (
                            <ListRow key={station._id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {station.name}
                                            </h3>
                                            <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                #{typeof station.displayOrder === 'number' ? station.displayOrder : 0}
                                            </span>
                                            <span
                                                className={`px-1.5 py-0.5 text-xs font-medium ${
                                                    station.isActive
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}
                                            >
                                                {station.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            {(station as { showInAssociatedPsList?: boolean }).showInAssociatedPsList ===
                                                false && (
                                                <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                    Off PS picker
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{station.nameHindi}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-slate-900 dark:text-white">{station.address}</p>
                                                    <p className="text-slate-500">
                                                        {station.location.coordinates[1]}, {station.location.coordinates[0]}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                    <span className="text-slate-900 dark:text-white">
                                                        <span className="text-slate-500">Govt: </span>
                                                        {(station as { governmentNumber?: string }).governmentNumber ||
                                                            station.contactNumber ||
                                                            '—'}
                                                    </span>
                                                </div>
                                                {Boolean((station as { personalNumber?: string }).personalNumber) && (
                                                    <div className="flex items-center gap-1.5 pl-5">
                                                        <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                        <span className="text-slate-900 dark:text-white">
                                                            <span className="text-slate-500">Personal: </span>
                                                            {(station as { personalNumber?: string }).personalNumber}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {station.inchargeName && (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-slate-900 dark:text-white">{station.inchargeName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ButtonLink
                                        href={`/dashboard/police-stations/edit/${station._id}`}
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
