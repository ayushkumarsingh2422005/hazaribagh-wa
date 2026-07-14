import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RawComplaint from '@/models/RawComplaint';
import connectDB from '@/lib/db';
import StatusUpdateForm from '@/components/dashboard/StatusUpdateForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { complaintTypeLabels, flowStepToComplaintTypeKey } from '@/lib/complaint-services';
import { requireSection, buildRawComplaintFilter } from '@/lib/admin-auth';

async function getRawComplaint(id: string, filter: Record<string, unknown> = {}) {
    await connectDB();
    const complaint = await RawComplaint.findOne({ _id: id, ...filter }).lean();
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
    const user = await requireSection('raw_complaints');
    const rawFilter = await buildRawComplaintFilter(user);

    const { id } = await params;
    const row = await getRawComplaint(id, rawFilter);

    if (!row) {
        redirect('/dashboard/raw-complaints');
    }

    const typeLabel = complaintTypeLabels[row.complaintTypeKey] || row.flowStep;

    return (
        <DashboardLayout section="raw_complaints">
            <PageHeader
                title="Raw submission details"
                size="detail"
                backLink={{ href: '/dashboard/raw-complaints', label: 'Back to raw submissions' }}
                meta={
                    <>
                        {row.rawComplaintId && (
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 rounded border border-amber-200 dark:border-amber-800">
                                {row.rawComplaintId}
                            </span>
                        )}
                        <span className="text-slate-500 dark:text-slate-400 text-xs">{typeLabel}</span>
                    </>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card className="p-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                            Message as received
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400">Flow / form</label>
                                <p className="text-slate-900 dark:text-white font-medium">{typeLabel}</p>
                                <p className="text-xs text-slate-400 font-mono">{row.flowStep}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400">Phone number</label>
                                <p className="text-slate-900 dark:text-white font-medium">{row.phoneNumber}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400">Raw text</label>
                                <pre className="mt-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm whitespace-pre-wrap break-words font-sans">
                                    {row.rawText}
                                </pre>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="p-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Status</h2>
                        <StatusUpdateForm
                            entityId={row._id}
                            apiPath="/api/raw-complaints"
                            currentStatus={row.status}
                            assignedTo={row.assignedTo || ''}
                        />
                    </Card>

                    <Card className="p-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Timeline</h2>
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Submitted</p>
                                <p className="text-slate-900 dark:text-white">
                                    {new Date(row.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                                <p className="text-slate-900 dark:text-white">
                                    {new Date(row.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </p>
                            </div>
                            {row.resolvedAt && (
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Resolved</p>
                                    <p className="text-slate-900 dark:text-white">
                                        {new Date(row.resolvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
