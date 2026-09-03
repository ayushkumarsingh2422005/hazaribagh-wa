import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Resource from '@/models/Resource';
import connectDB from '@/lib/db';
import { Link2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card, CardBody, ListRow } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

async function getResources() {
    await connectDB();
    const resources = await Resource.find({}).sort({ type: 1, order: 1 }).lean();
    return resources.map(r => ({
        ...r,
        _id: r._id.toString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
    }));
}

const typeLabels: Record<string, string> = {
    important_link: 'Important Link',
    disclaimer: 'Disclaimer',
    cyber_info: 'Cyber Information',
    traffic_info: 'Traffic Information',
    general_info: 'General Information',
};

export default async function ResourcesPage() {
    const resources = await getResources();

    return (
        <DashboardLayout section="resources">
            <PageHeader
                title="Resources & Information"
                subtitle="Directory"
                actions={<ButtonLink href="/dashboard/resources/new">Add Resource</ButtonLink>}
            />

            <Card>
                <CardBody divided>
                    {resources.length === 0 ? (
                        <EmptyState
                            icon={Link2}
                            title="No resources yet"
                            action={<ButtonLink href="/dashboard/resources/new">Add Resource</ButtonLink>}
                        />
                    ) : (
                        resources.map(resource => (
                            <ListRow key={resource._id}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {resource.title}
                                            </h3>
                                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {typeLabels[resource.type]}
                                            </span>
                                            <span
                                                className={`text-xs px-1.5 py-0.5 ${
                                                    resource.isActive
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                                                }`}
                                            >
                                                {resource.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{resource.titleHindi}</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                            {resource.content}
                                        </p>
                                        {resource.url && (
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                                                {resource.url}
                                            </p>
                                        )}
                                    </div>
                                    <Link
                                        href={`/dashboard/resources/edit/${resource._id}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 shrink-0"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </ListRow>
                        ))
                    )}
                </CardBody>
            </Card>
        </DashboardLayout>
    );
}
