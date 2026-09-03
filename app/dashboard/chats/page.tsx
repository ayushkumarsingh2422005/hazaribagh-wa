import ContactsList from './ContactsList';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ChatsPage() {
    return (
        <DashboardLayout section="chats">
            <PageHeader title="WhatsApp Chats" subtitle="Operations" />
            <ContactsList />
        </DashboardLayout>
    );
}
