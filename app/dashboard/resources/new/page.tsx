import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import ResourceForm from '../ResourceForm';

export default async function NewResourcePage() {
    return (
        <DashboardLayout section="resources">
            <PageHeader title="Add New Resource" />
            <Card className="p-4">
                <ResourceForm />
            </Card>
        </DashboardLayout>
    );
}
