'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Phone } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Card, CardBody, ListRow, StatusBadge } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FILTER_INPUT_CLASS, SELECT_CLASS } from '@/components/ui/field-styles';
import type { StatusTabValue } from '@/components/ui/StatusTabs';

interface Complaint {
    _id: string;
    complaintId?: string | null;
    complaintType: string;
    name: string;
    phoneNumber: string;
    policeStation?: string;
    remarks?: string;
    status: string;
    source?: string;
    createdAt: string;
}

interface Group {
    label: string;
    color: string;
    types: string[];
}

interface Props {
    complaints: Complaint[];
    groups: Group[];
    complaintTypeLabels: Record<string, string>;
    stationAliasMap: Record<string, string>;
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

function ComplaintCard({
    complaint,
    complaintTypeLabels,
    searchQuery,
}: {
    complaint: Complaint;
    complaintTypeLabels: Record<string, string>;
    searchQuery: string;
}) {
    return (
        <ListRow>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        {complaint.complaintId && (
                            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold">
                                <Highlight text={complaint.complaintId} query={searchQuery} />
                            </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                            {complaintTypeLabels[complaint.complaintType] || complaint.complaintType}
                        </span>
                        <StatusBadge status={complaint.status} />
                        <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                complaint.source === 'app'
                                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                        >
                            {complaint.source === 'app' ? 'Saathi App' : 'WhatsApp'}
                        </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        <Highlight text={complaint.name} query={searchQuery} />
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        <Highlight text={complaint.phoneNumber} query={searchQuery} />
                        {complaint.policeStation && ` · ${complaint.policeStation}`}
                    </p>
                    {complaint.remarks && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                            {complaint.remarks}
                        </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                        {new Date(complaint.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                </div>
                <Link
                    href={`/dashboard/complaints/${complaint._id}`}
                    className="shrink-0 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
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

export default function ComplaintsClient({
    complaints,
    groups,
    complaintTypeLabels,
    stationAliasMap,
    activeStatus,
    pagination,
}: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [policeStationFilter, setPoliceStationFilter] = useState('all');
    const [flowFilter, setFlowFilter] = useState('all');

    const stationOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    complaints
                        .map(c => {
                            const raw = (c.policeStation || '').trim();
                            const key = raw.toLowerCase();
                            return stationAliasMap[key] || raw;
                        })
                        .filter(Boolean)
                )
            ).sort((a, b) => a.localeCompare(b)),
        [complaints, stationAliasMap]
    );

    const flowOptions = useMemo(
        () =>
            Array.from(new Set(complaints.map(c => c.complaintType))).sort((a, b) => {
                const la = complaintTypeLabels[a] || a;
                const lb = complaintTypeLabels[b] || b;
                return la.localeCompare(lb);
            }),
        [complaints, complaintTypeLabels]
    );

    const filtered = useMemo(() => {
        let result = complaints;

        if (categoryFilter !== 'all') {
            const group = groups.find(g => g.label === categoryFilter);
            if (group) result = result.filter(c => group.types.includes(c.complaintType));
        }

        if (flowFilter !== 'all') {
            result = result.filter(c => c.complaintType === flowFilter);
        }

        if (policeStationFilter !== 'all') {
            result = result.filter(c => {
                const raw = (c.policeStation || '').trim();
                const key = raw.toLowerCase();
                const normalized = stationAliasMap[key] || raw;
                return normalized === policeStationFilter;
            });
        }

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(
                c =>
                    c.complaintId?.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q) ||
                    c.phoneNumber.toLowerCase().includes(q)
            );
        }

        return result;
    }, [complaints, categoryFilter, flowFilter, policeStationFilter, searchQuery, groups, stationAliasMap]);

    const hasActiveFilters =
        categoryFilter !== 'all' ||
        flowFilter !== 'all' ||
        policeStationFilter !== 'all' ||
        searchQuery.trim() !== '';

    const clearAll = () => {
        setSearchQuery('');
        setCategoryFilter('all');
        setPoliceStationFilter('all');
        setFlowFilter('all');
    };

    const totalShown = filtered.length;
    const statusLabel = STATUS_LABELS[activeStatus];

    return (
        <div>
            <Card className="mb-4">
            <CardBody className="p-4 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        id="complaint-search"
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by Complaint ID, name, or phone number…"
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
                        <label htmlFor="category-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            Category:
                        </label>
                        <select
                            id="category-filter"
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
                        <label htmlFor="flow-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            Flow:
                        </label>
                        <select
                            id="flow-filter"
                            value={flowFilter}
                            onChange={e => setFlowFilter(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            <option value="all">All Flows</option>
                            {flowOptions.map(flow => (
                                <option key={flow} value={flow}>
                                    {complaintTypeLabels[flow] || flow}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="station-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            Police Station:
                        </label>
                        <select
                            id="station-filter"
                            value={policeStationFilter}
                            onChange={e => setPoliceStationFilter(e.target.value)}
                            className={SELECT_CLASS}
                        >
                            <option value="all">All Stations</option>
                            {stationOptions.map(station => (
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
                                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            </CardBody>
            </Card>

            <Card>
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No complaints found"
                        description={
                            hasActiveFilters
                                ? 'Try adjusting your search or filters.'
                                : statusLabel
                                  ? `No ${statusLabel} complaints on this page.`
                                  : 'No complaints on this page.'
                        }
                    />
                ) : (
                    <CardBody divided>
                        {filtered.map(complaint => (
                            <ComplaintCard
                                key={complaint._id}
                                complaint={complaint}
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
