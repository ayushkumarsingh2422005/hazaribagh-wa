import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import PoliceStationForm from '../PoliceStationForm';

export default async function NewPoliceStationPage() {
    return (
        <DashboardLayout section="police_stations">
            <PageHeader title="Add New Police Station" />
            <Card className="p-4">
                <PoliceStationForm />
            </Card>
        </DashboardLayout>
    );
}
