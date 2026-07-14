import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import TrafficViolationForm from '../../TrafficViolationForm';
import connectDB from '@/lib/db';
import TrafficViolation from '@/models/TrafficViolation';

async function getViolation(id: string) {
    await connectDB();
    const violation = await TrafficViolation.findById(id).lean();
    if (!violation) return null;

    return {
        _id: violation._id.toString(),
        crime: violation.crime,
        crimeHindi: violation.crimeHindi,
        section: violation.section,
        penalty: violation.penalty,
        description: violation.description || '',
        descriptionHindi: violation.descriptionHindi || '',
        isActive: violation.isActive,
    };
}

export default async function EditTrafficRulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const violation = await getViolation(id);

    if (!violation) {
        redirect('/dashboard/traffic-rules');
    }

    return (
        <DashboardLayout section="traffic_rules">
            <PageHeader title="Edit Traffic Rule" />

            <Card className="p-4">
                <TrafficViolationForm initialData={violation} />
            </Card>
        </DashboardLayout>
    );
}
