import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import TrafficViolationForm from '../TrafficViolationForm';

export default async function NewTrafficRulePage() {
    return (
        <DashboardLayout section="traffic_rules">
            <PageHeader title="Add New Rule" />
            <Card className="p-4">
                <TrafficViolationForm />
            </Card>
        </DashboardLayout>
    );
}
