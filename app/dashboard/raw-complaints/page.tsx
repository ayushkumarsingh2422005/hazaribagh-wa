import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RawComplaint from '@/models/RawComplaint';
import PoliceStation from '@/models/PoliceStation';
import connectDB from '@/lib/db';
import RawComplaintsClient from './RawComplaintsClient';
import {
    complaintTypeLabels,
    flowStepToComplaintTypeKey,
    GROUPS,
} from '@/lib/complaint-services';
import { requireSection, buildRawComplaintFilter } from '@/lib/admin-auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTabs, parseStatusTab, mongoFilterForStatusTab } from '@/components/ui/StatusTabs';
import { LIST_PAGE_SIZE, parsePageParam, getPaginationMeta } from '@/lib/pagination';

export default async function RawComplaintsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string }>;
}) {
    const user = await requireSection('raw_complaints');
    const params = await searchParams;
    const page = parsePageParam(params.page);
    const activeStatus = parseStatusTab(params.status);
    const baseFilter = await buildRawComplaintFilter(user);
    const statusFilter = mongoFilterForStatusTab(activeStatus);
    const listFilter = { ...baseFilter, ...statusFilter };

    await connectDB();

    const [totalAll, pending, inProgress, resolved, listTotal] = await Promise.all([
        RawComplaint.countDocuments(baseFilter),
        RawComplaint.countDocuments({ ...baseFilter, status: 'pending' }),
        RawComplaint.countDocuments({ ...baseFilter, status: 'in_progress' }),
        RawComplaint.countDocuments({ ...baseFilter, status: 'resolved' }),
        RawComplaint.countDocuments(listFilter),
    ]);

    const { safePage, skip, pageSize, totalPages } = getPaginationMeta(listTotal, page, LIST_PAGE_SIZE);

    const items = await RawComplaint.find(listFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

    const rawComplaints = items.map(r => ({
        _id: r._id.toString(),
        rawComplaintId: r.rawComplaintId || null,
        flowStep: r.flowStep,
        complaintTypeKey: flowStepToComplaintTypeKey(r.flowStep),
        phoneNumber: r.phoneNumber,
        rawText: r.rawText,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    }));

    const policeStations = await PoliceStation.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select('name')
        .lean()
        .then(stations => stations.map(s => s.name));

    return (
        <DashboardLayout section="raw_complaints">
            <PageHeader title="Raw / invalid-format submissions" />

            <StatusTabs
                basePath="/dashboard/raw-complaints"
                active={activeStatus}
                counts={{ pending, inProgress, resolved, all: totalAll }}
            />

            <RawComplaintsClient
                rawComplaints={rawComplaints}
                groups={GROUPS}
                complaintTypeLabels={complaintTypeLabels}
                policeStations={policeStations}
                activeStatus={activeStatus}
                pagination={{
                    basePath: '/dashboard/raw-complaints',
                    page: safePage,
                    totalPages,
                    total: listTotal,
                    pageSize,
                    status: activeStatus,
                }}
            />
        </DashboardLayout>
    );
}
