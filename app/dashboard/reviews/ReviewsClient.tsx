'use client';

import { useState } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { SELECT_CLASS } from '@/components/ui/field-styles';
import { TH_CLASS, TD_CLASS } from '@/components/ui/Card';
import { useToast } from '@/components/providers/ToastProvider';

interface Review {
    _id: string;
    phoneNumber: string;
    name: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

export default function ReviewsClient({
    policeStations,
    initialReviews,
}: {
    policeStations: string[];
    initialReviews: Review[];
}) {
    const toast = useToast();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [policeStationFilter, setPoliceStationFilter] = useState('all');
    const [updating, setUpdating] = useState<string | null>(null);

    const filteredReviews = reviews.filter(review =>
        policeStationFilter === 'all'
            ? true
            : review.content.toLowerCase().includes(policeStationFilter.toLowerCase())
    );

    const updateStatus = async (id: string, status: Review['status']) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/reviews/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) {
                setReviews(prev => prev.map(r => (r._id === id ? { ...r, status } : r)));
                toast.success(`Review marked as ${status}`);
            } else {
                toast.error(data.error || 'Failed to update review');
            }
        } catch {
            toast.error('Failed to update review');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                    <label htmlFor="review-station-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        Police Station:
                    </label>
                    <select
                        id="review-station-filter"
                        value={policeStationFilter}
                        onChange={e => setPoliceStationFilter(e.target.value)}
                        className={SELECT_CLASS}
                    >
                        <option value="all">All Stations</option>
                        {policeStations.map(station => (
                            <option key={station} value={station}>
                                {station}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {filteredReviews.length === 0 ? (
                <EmptyState
                    icon={Star}
                    title="No reviews found"
                    description={
                        reviews.length === 0
                            ? 'Citizen feedback will appear here once submitted.'
                            : 'Try changing the police station filter.'
                    }
                />
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase font-medium text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className={TH_CLASS}>User</th>
                                    <th className={TH_CLASS}>Review/Suggestion</th>
                                    <th className={TH_CLASS}>Status</th>
                                    <th className={TH_CLASS}>Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredReviews.map(review => (
                                    <tr key={review._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className={TD_CLASS}>
                                            <div className="font-medium text-slate-900 dark:text-white">{review.name}</div>
                                            <div className="text-xs mt-1">{review.phoneNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="whitespace-pre-wrap">{review.content}</div>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <select
                                                value={review.status}
                                                disabled={updating === review._id}
                                                onChange={e => updateStatus(review._id, e.target.value as Review['status'])}
                                                className={`text-xs font-medium px-2 py-1 rounded border-0 ${
                                                    review.status === 'approved'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : review.status === 'rejected'
                                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}
                                                aria-label={`Status for review by ${review.name}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(review.createdAt).toLocaleDateString('en-IN')}
                                            <div className="text-xs mt-0.5">
                                                {new Date(review.createdAt).toLocaleTimeString('en-IN')}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {policeStationFilter !== 'all' && filteredReviews.length === 0 && reviews.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4" />
                    Station filter matches text in review content — not a structured field.
                </div>
            )}
        </div>
    );
}
