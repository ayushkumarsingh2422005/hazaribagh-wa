import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import TestWhatsAppClient from './TestWhatsAppClient';

export default async function TestWhatsAppPage() {
    return (
        <DashboardLayout section="test_whatsapp">
            <PageHeader title="Test WhatsApp API" subtitle="Operations" />
            <TestWhatsAppClient />
        </DashboardLayout>
    );
}
