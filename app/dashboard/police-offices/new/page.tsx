import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import PoliceOfficeForm from '../PoliceOfficeForm';

export default async function NewPoliceOfficePage() {
    return (
        <DashboardLayout section="police_offices">
            <PageHeader title="Add New Office" />
            <Card className="p-4">
                <PoliceOfficeForm />
            </Card>
        </DashboardLayout>
    );
}
