import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RawComplaint from '@/models/RawComplaint';
import connectDB from '@/lib/db';
import RawComplaintDetailClient from './RawComplaintDetailClient';
import Link from 'next/link';
import { complaintTypeLabels } from '../../complaints/page';

function flowStepToComplaintTypeKey(flowStep: string): string {
    if (flowStep === 'suggestion_form') return 'suggestion';
    return flowStep.replace(/^sub_/, '');
}

async function getRawComplaint(id: string) {
    await connectDB();
    const complaint = await RawComplaint.findById(id).lean();
    if (!complaint) return null;

    return {
        ...complaint,
        _id: complaint._id.toString(),
        rawComplaintId: complaint.rawComplaintId || null,
        complaintTypeKey: flowStepToComplaintTypeKey(complaint.flowStep),
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
        resolvedAt: complaint.resolvedAt?.toISOString(),
    };
}

export default async function RawComplaintDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    const { id } = await params;
    const row = await getRawComplaint(id);

    if (!row) {
        redirect('/dashboard/raw-complaints');
    }

    const typeLabel =
        complaintTypeLabels[row.complaintTypeKey] || row.flowStep;

    return (
        <DashboardLayout username={session.username as string}>
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/dashboard/raw-complaints"
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                        ← Back to raw submissions
                    </Link>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
                    Raw submission details
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                    {row.rawComplaintId && (
                        <span className="font-mono text-base font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 rounded border border-amber-200 dark:border-amber-800">
                            🆔 {row.rawComplaintId}
                        </span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400 text-sm">{typeLabel}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Message as received
                        </h2>

                        <div className="space-y-4">
                            {row.rawComplaintId && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                                    <label className="text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wide font-semibold">
                                        Reference ID
                                    </label>
                                    <p className="text-amber-950 dark:text-amber-100 font-mono font-bold text-lg mt-0.5">
                                        {row.rawComplaintId}
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400">Flow / form</label>
                                <p className="text-slate-900 dark:text-white font-medium">{typeLabel}</p>
                                <p className="text-xs text-slate-400 mt-0.5 font-mono">{row.flowStep}</p>
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400">Phone number</label>
                                <p className="text-slate-900 dark:text-white font-medium">{row.phoneNumber}</p>
                            </div>
                            <div>
                                <label className="text-sm text-slate-500 dark:text-slate-400">Raw text</label>
                                <pre className="mt-1 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words font-sans">
                                    {row.rawText}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Status
                        </h2>

                        <RawComplaintDetailClient
                            rawComplaintId={row._id}
                            currentStatus={row.status}
                            assignedTo={row.assignedTo || ''}
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Timeline
                        </h2>

                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Submitted</p>
                                <p className="text-slate-900 dark:text-white">
                                    {new Date(row.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Last Updated</p>
                                <p className="text-slate-900 dark:text-white">
                                    {new Date(row.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </p>
                            </div>

                            {row.resolvedAt && (
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Resolved</p>
                                    <p className="text-slate-900 dark:text-white">
                                        {new Date(row.resolvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
