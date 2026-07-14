import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Complaint from '@/models/Complaint';
import connectDB from '@/lib/db';
import ComplaintsClient from './ComplaintsClient';
import { requireSection, buildComplaintFilter, getStationAliasMap } from '@/lib/admin-auth';
import { GROUPS, complaintTypeLabels } from '@/lib/complaint-services';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTabs, parseStatusTab, mongoFilterForStatusTab } from '@/components/ui/StatusTabs';
import { LIST_PAGE_SIZE, parsePageParam, getPaginationMeta } from '@/lib/pagination';

function serializeComplaint(c: {
    _id: { toString(): string };
    complaintId?: string | null;
    complaintType: string;
    name: string;
    phoneNumber: string;
    policeStation?: string;
    remarks?: string;
    status: string;
    source?: string;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        _id: c._id.toString(),
        complaintId: (c.complaintId as string) || null,
        complaintType: c.complaintType as string,
        name: c.name as string,
        phoneNumber: c.phoneNumber as string,
        policeStation: (c.policeStation as string) || '',
        remarks: (c.remarks as string) || '',
        status: c.status as string,
        source: (c.source as string) || 'whatsapp',
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    };
}

export default async function ComplaintsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string }>;
}) {
    const user = await requireSection('complaints');
    const params = await searchParams;
    const page = parsePageParam(params.page);
    const activeStatus = parseStatusTab(params.status);
    const baseFilter = await buildComplaintFilter(user);
    const statusFilter = mongoFilterForStatusTab(activeStatus);
    const listFilter = { ...baseFilter, ...statusFilter };

    await connectDB();

    const [totalAll, pending, inProgress, resolved, listTotal] = await Promise.all([
        Complaint.countDocuments(baseFilter),
        Complaint.countDocuments({ ...baseFilter, status: 'pending' }),
        Complaint.countDocuments({ ...baseFilter, status: 'in_progress' }),
        Complaint.countDocuments({ ...baseFilter, status: { $in: ['resolved', 'closed'] } }),
        Complaint.countDocuments(listFilter),
    ]);

    const { safePage, skip, pageSize, totalPages } = getPaginationMeta(listTotal, page, LIST_PAGE_SIZE);

    const raw = await Complaint.find(listFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

    const complaints = raw.map(c => serializeComplaint(c));
    const stationAliasMap = await getStationAliasMap();

    return (
        <DashboardLayout section="complaints">
            <PageHeader title="Complaints & Reports" />

            <StatusTabs
                basePath="/dashboard/complaints"
                active={activeStatus}
                counts={{ pending, inProgress, resolved, all: totalAll }}
            />

            <ComplaintsClient
                complaints={complaints}
                groups={GROUPS}
                complaintTypeLabels={complaintTypeLabels}
                stationAliasMap={stationAliasMap}
                activeStatus={activeStatus}
                pagination={{
                    basePath: '/dashboard/complaints',
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
