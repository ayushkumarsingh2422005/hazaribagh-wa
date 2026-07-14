'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Phone } from 'lucide-react';
import { statusBadgeClass } from '@/lib/complaint-status-sections';
import { Pagination } from '@/components/ui/Pagination';
import { Card, CardBody, ListRow } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FILTER_INPUT_CLASS, SELECT_CLASS } from '@/components/ui/field-styles';
import type { StatusTabValue } from '@/components/ui/StatusTabs';

interface RawComplaintRow {
    _id: string;
    rawComplaintId?: string | null;
    flowStep: string;
    complaintTypeKey: string;
    phoneNumber: string;
    rawText: string;
    status: string;
    createdAt: string;
}

interface Group {
    label: string;
    color: string;
    types: string[];
}

interface Props {
    rawComplaints: RawComplaintRow[];
    groups: Group[];
    complaintTypeLabels: Record<string, string>;
    policeStations: string[];
    activeStatus: StatusTabValue;
    pagination?: {
        basePath: string;
        page: number;
        totalPages: number;
        total: number;
        pageSize: number;
        status: StatusTabValue;
    };
}

function Highlight({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5">
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}

function RawComplaintCard({
    row,
    complaintTypeLabels,
    searchQuery,
}: {
    row: RawComplaintRow;
    complaintTypeLabels: Record<string, string>;
    searchQuery: string;
}) {
    const typeLabel = complaintTypeLabels[row.complaintTypeKey] || row.flowStep;
    const preview = row.rawText.replace(/\s+/g, ' ').trim().slice(0, 160);

    return (
        <ListRow>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        {row.rawComplaintId && (
                            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold">
                                <Highlight text={row.rawComplaintId} query={searchQuery} />
                            </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 rounded border border-amber-200/80 dark:border-amber-800">
                            {typeLabel}
                        </span>
                        <span className={statusBadgeClass(row.status)}>{row.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        <Highlight text={row.phoneNumber} query={searchQuery} />
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-3 whitespace-pre-wrap">
                        <Highlight text={preview + (row.rawText.length > 160 ? '…' : '')} query={searchQuery} />
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {new Date(row.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                </div>
                <Link
                    href={`/dashboard/raw-complaints/${row._id}`}
                    className="shrink-0 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                >
                    View →
                </Link>
            </div>
        </ListRow>
    );
}

const STATUS_LABELS: Record<StatusTabValue, string> = {
    pending: 'pending',
    in_progress: 'in progress',
    resolved: 'resolved',
    all: '',
};

export default function RawComplaintsClient({
    rawComplaints,
    groups,
    complaintTypeLabels,
    policeStations,
    activeStatus,
    pagination,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [policeStationFilter, setPoliceStationFilter] = useState('all');

    const filtered = useMemo(() => {
        let result = rawComplaints;

        if (categoryFilter !== 'all') {
            const group = groups.find(g => g.label === categoryFilter);
            if (group) result = result.filter(c => group.types.includes(c.complaintTypeKey));
        }

        if (policeStationFilter !== 'all') {
            const stationQuery = policeStationFilter.toLowerCase();
            result = result.filter(c => c.rawText.toLowerCase().includes(stationQuery));
        }

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(
                c =>
                    c.rawComplaintId?.toLowerCase().includes(q) ||
                    c.phoneNumber.toLowerCase().includes(q) ||
                    c.rawText.toLowerCase().includes(q) ||
                    c.flowStep.toLowerCase().includes(q)
            );
        }

        return result;
    }, [rawComplaints, categoryFilter, policeStationFilter, searchQuery, groups]);

    const hasActiveFilters = categoryFilter !== 'all' || policeStationFilter !== 'all' || searchQuery.trim() !== '';

    const clearAll = () => {
        setSearchQuery('');
        setCategoryFilter('all');
        setPoliceStationFilter('all');
    };

    const totalShown = filtered.length;
    const statusLabel = STATUS_LABELS[activeStatus];

    return (
        <div>
            <div className="space-y-2 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        id="raw-complaint-search"
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by reference ID, phone, or message text…"
                        className={`${FILTER_INPUT_CLASS} pr-9`}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
                    <div className="flex items-center gap-2">
                        <label htmlFor="raw-category-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            Category:
                        </label>
                        <select
                            id="raw-category-filter"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            <option value="all">All Categories</option>
                            {groups.map(g => (
                                <option key={g.label} value={g.label}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="raw-station-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            Police Station:
                        </label>
                        <select
                            id="raw-station-filter"
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

                    <div className="flex items-center gap-3 sm:ml-auto">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            {totalShown} on this page
                            {pagination && pagination.totalPages > 1 && (
                                <> · page {pagination.page} of {pagination.totalPages}</>
                            )}
                        </span>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAll}
                                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <Card>
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No raw submissions found"
                        description={
                            hasActiveFilters
                                ? 'Try adjusting your search or filters.'
                                : statusLabel
                                  ? `No ${statusLabel} entries on this page.`
                                  : 'No entries on this page.'
                        }
                    />
                ) : (
                    <CardBody divided>
                        {filtered.map(row => (
                            <RawComplaintCard
                                key={row._id}
                                row={row}
                                complaintTypeLabels={complaintTypeLabels}
                                searchQuery={searchQuery}
                            />
                        ))}
                    </CardBody>
                )}
            </Card>

            {pagination && pagination.totalPages > 1 && (
                <Pagination
                    basePath={pagination.basePath}
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    pageSize={pagination.pageSize}
                    shown={totalShown}
                    query={{ status: pagination.status }}
                />
            )}
        </div>
    );
}
