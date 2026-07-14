'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { useToast } from '@/components/providers/ToastProvider';

interface StatusUpdateFormProps {
    entityId: string;
    apiPath: string;
    currentStatus: string;
    assignedTo: string;
    successMessage?: string;
}

export default function StatusUpdateForm({
    entityId,
    apiPath,
    currentStatus,
    assignedTo,
    successMessage = 'Updated successfully!',
}: StatusUpdateFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [status, setStatus] = useState(currentStatus);
    const [assigned, setAssigned] = useState(assignedTo);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleUpdateStatus = async () => {
        setSaving(true);
        setError('');

        try {
            const response = await fetch(`${apiPath}/${entityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, assignedTo: assigned }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(successMessage);
                router.refresh();
            } else {
                setError(data.error || 'Failed to update');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && <AlertBanner variant="error">{error}</AlertBanner>}

            <div>
                <label htmlFor="status-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status
                </label>
                <select
                    id="status-select"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
                >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            <Input
                label="Assigned To"
                value={assigned}
                onChange={e => setAssigned(e.target.value)}
                placeholder="Officer name/ID"
            />

            <Button type="button" onClick={handleUpdateStatus} disabled={saving} isLoading={saving} className="w-full">
                {saving ? 'Updating...' : 'Update Status'}
            </Button>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div
                    className={`px-3 py-2 text-sm text-center rounded ${
                        status === 'resolved' || status === 'closed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                >
                    {status.replace('_', ' ').toUpperCase()}
                </div>
            </div>
        </div>
    );
}
