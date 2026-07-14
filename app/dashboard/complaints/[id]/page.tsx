import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Complaint from '@/models/Complaint';
import connectDB from '@/lib/db';
import StatusUpdateForm from '@/components/dashboard/StatusUpdateForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { requireSection, buildComplaintFilter } from '@/lib/admin-auth';
import { COMPLAINT_TYPE_LABELS } from '@/lib/complaint-services';

const complaintTypeLabels = COMPLAINT_TYPE_LABELS;

async function getComplaint(id: string, filter: Record<string, unknown> = {}) {
    await connectDB();
    const complaint = await Complaint.findOne({ _id: id, ...filter }).lean();
    if (!complaint) return null;

    return {
        ...complaint,
        _id: complaint._id.toString(),
        complaintId: complaint.complaintId || null,
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
        resolvedAt: complaint.resolvedAt?.toISOString(),
    };
}

import type { ReactNode } from 'react';

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="text-xs text-slate-500 dark:text-slate-400">{label}</label>
            <div className="text-sm text-slate-900 dark:text-white mt-0.5">{children}</div>
        </div>
    );
}

export default async function ComplaintDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await requireSection('complaints');
    const complaintFilter = await buildComplaintFilter(user);

    const { id } = await params;
    const complaint = await getComplaint(id, complaintFilter);

    if (!complaint) {
        redirect('/dashboard/complaints');
    }

    const missingPhotoPath = (complaint as { missingPersonPhotoUrl?: string }).missingPersonPhotoUrl;
    const publicBase = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const missingPersonPhotoSrc =
        missingPhotoPath &&
        (missingPhotoPath.startsWith('http://') || missingPhotoPath.startsWith('https://'))
            ? missingPhotoPath
            : missingPhotoPath
              ? `${publicBase}${missingPhotoPath.startsWith('/') ? missingPhotoPath : `/${missingPhotoPath}`}`
              : '';

    return (
        <DashboardLayout section="complaints">
            <PageHeader
                title="Complaint Details"
                size="detail"
                backLink={{ href: '/dashboard/complaints', label: 'Back to Complaints' }}
                meta={
                    <>
                        {complaint.complaintId && (
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded">
                                {complaint.complaintId}
                            </span>
                        )}
                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                            {complaintTypeLabels[complaint.complaintType]}
                        </span>
                        <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${(complaint as { source?: string }).source === 'app' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}
                        >
                            {(complaint as { source?: string }).source === 'app' ? 'Sathi App' : 'WhatsApp'}
                        </span>
                    </>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card className="p-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                            Complaint Information
                        </h2>
                        <div className="space-y-3">
                            <Field label="Type">{complaintTypeLabels[complaint.complaintType]}</Field>
                            <Field label="Name">{complaint.name}</Field>
                            {complaint.fatherName && <Field label="Father's Name">{complaint.fatherName}</Field>}
                            {complaint.address && <Field label="Address">{complaint.address}</Field>}
                            <Field label="Phone Number">{complaint.phoneNumber}</Field>
                            {complaint.applicationNumber && (
                                <Field label="Application Number">{complaint.applicationNumber}</Field>
                            )}
                            {complaint.applicationDate && (
                                <Field label="Application Date">{complaint.applicationDate}</Field>
                            )}
                            {complaint.policeStation && (
                                <Field label="Concerned Police Station">{complaint.policeStation}</Field>
                            )}
                            {'location' in complaint && (complaint as { location?: string }).location && (
                                <Field label="Place name / landmark">
                                    {(complaint as { location?: string }).location}
                                </Field>
                            )}
                            {complaint.lostMobileNumber && (
                                <Field label="Lost Mobile Number">{complaint.lostMobileNumber}</Field>
                            )}
                            {complaint.challanNumber && (
                                <Field label="Challan Number">{complaint.challanNumber}</Field>
                            )}
                            {missingPersonPhotoSrc && (
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400">
                                        {complaint.complaintType === 'missing_person'
                                            ? 'Missing person photo'
                                            : complaint.complaintType === 'info_misbehavior'
                                              ? 'Harasser photo'
                                              : 'Photo attachment'}
                                    </label>
                                    <img
                                        src={missingPersonPhotoSrc}
                                        alt="Attachment"
                                        className="mt-1.5 max-h-64 max-w-full rounded border border-slate-200 dark:border-slate-700 object-contain"
                                    />
                                </div>
                            )}
                            {complaint.remarks && (
                                <Field label="Remarks">
                                    <span className="whitespace-pre-wrap">{complaint.remarks}</span>
                                </Field>
                            )}
                            {complaint.suggestion && (
                                <Field label="Suggestion">
                                    <span className="whitespace-pre-wrap">{complaint.suggestion}</span>
                                </Field>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="p-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Status</h2>
                        <StatusUpdateForm
                            entityId={complaint._id}
                            apiPath="/api/complaints"
                            currentStatus={complaint.status}
                            assignedTo={complaint.assignedTo || ''}
                            successMessage="Complaint updated successfully!"
                        />
                    </Card>

                    <Card className="p-4">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Timeline</h2>
                        <div className="space-y-2 text-sm">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Submitted</p>
                                <p className="text-slate-900 dark:text-white">
                                    {new Date(complaint.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                                <p className="text-slate-900 dark:text-white">
                                    {new Date(complaint.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </p>
                            </div>
                            {complaint.resolvedAt && (
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Resolved</p>
                                    <p className="text-slate-900 dark:text-white">
                                        {new Date(complaint.resolvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
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
