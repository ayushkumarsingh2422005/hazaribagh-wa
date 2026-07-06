import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Complaint from '@/models/Complaint';
import connectDB from '@/lib/db';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import ComplaintsClient from './ComplaintsClient';
import { requireSection, buildComplaintFilter, getStationAliasMap } from '@/lib/admin-auth';
import { GROUPS, complaintTypeLabels } from '@/lib/complaint-services';

async function getComplaints(filter: Record<string, unknown>) {
    await connectDB();
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return complaints.map(c => ({
        _id: c._id.toString(),
        complaintId: c.complaintId || null,
        complaintType: c.complaintType,
        name: c.name,
        phoneNumber: c.phoneNumber,
        policeStation: c.policeStation || '',
        remarks: c.remarks || '',
        status: c.status,
        source: (c as { source?: string }).source || 'whatsapp',
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }));
}

async function getStationAliasMapLocal(): Promise<Record<string, string>> {
    return getStationAliasMap();
}

export default async function ComplaintsPage() {
    const user = await requireSection('complaints');
    const complaintFilter = await buildComplaintFilter(user);
    const complaints = await getComplaints(complaintFilter);
    const stationAliasMap = await getStationAliasMapLocal();
    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        inProgress: complaints.filter(c => c.status === 'in_progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
    };

    return (
        <DashboardLayout section="complaints">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    Complaints &amp; Reports
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">
                    Manage citizen complaints and suggestions — grouped by category
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-slate-400" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">In Progress</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Resolved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>
            </div>

            {/* Client-side filterable grouped list */}
            <ComplaintsClient
                complaints={complaints}
                groups={GROUPS}
                complaintTypeLabels={complaintTypeLabels}
                stationAliasMap={stationAliasMap}
            />
        </DashboardLayout>
    );
}
