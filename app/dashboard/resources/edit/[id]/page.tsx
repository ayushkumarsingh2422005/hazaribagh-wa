import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import ResourceForm from '../../ResourceForm';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';

async function getResource(id: string) {
    await connectDB();
    const resource = await Resource.findById(id).lean();
    if (!resource) return null;

    return {
        _id: resource._id.toString(),
        type: resource.type,
        title: resource.title,
        titleHindi: resource.titleHindi,
        content: resource.content,
        contentHindi: resource.contentHindi,
        url: resource.url || '',
        order: resource.order,
        isActive: resource.isActive,
    };
}

export default async function EditResourcePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const resource = await getResource(id);

    if (!resource) {
        redirect('/dashboard/resources');
    }

    return (
        <DashboardLayout section="resources">
            <PageHeader title="Edit Resource" />

            <Card className="p-4">
                <ResourceForm initialData={resource} />
            </Card>
        </DashboardLayout>
    );
}
