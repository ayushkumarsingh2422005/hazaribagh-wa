import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RawComplaint from '@/models/RawComplaint';
import PoliceStation from '@/models/PoliceStation';
import connectDB from '@/lib/db';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import RawComplaintsClient from './RawComplaintsClient';
import { complaintTypeLabels, GROUPS } from '../complaints/page';

function flowStepToComplaintTypeKey(flowStep: string): string {
    if (flowStep === 'suggestion_form') return 'suggestion';
    return flowStep.replace(/^sub_/, '');
}

async function getRawComplaints() {
    await connectDB();
    const items = await RawComplaint.find({}).sort({ createdAt: -1 }).limit(200).lean();
    return items.map(r => ({
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
}

async function getPoliceStations() {
    await connectDB();
    const stations = await PoliceStation.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select('name')
        .lean();
    return stations.map(s => s.name);
}

export default async function RawComplaintsPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const rawComplaints = await getRawComplaints();
    const policeStations = await getPoliceStations();
    const stats = {
        total: rawComplaints.length,
        pending: rawComplaints.filter(c => c.status === 'pending').length,
        inProgress: rawComplaints.filter(c => c.status === 'in_progress').length,
        resolved: rawComplaints.filter(c => c.status === 'resolved').length,
    };

    return (
        <DashboardLayout username={session.username as string}>
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    Raw / invalid-format submissions
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">
                    Entries saved when citizens did not follow the required line-by-line format. Data is stored as
                    received for manual review — same workflow as structured complaints.
                </p>
            </div>

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

            <RawComplaintsClient
                rawComplaints={rawComplaints}
                groups={GROUPS}
                complaintTypeLabels={complaintTypeLabels}
                policeStations={policeStations}
            />
        </DashboardLayout>
    );
}
