import ChatView from './ChatView';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function ChatDetailPage({
    params,
}: {
    params: Promise<{ phoneNumber: string }>;
}) {
    const { phoneNumber: encodedPhoneNumber } = await params;
    const phoneNumber = decodeURIComponent(encodedPhoneNumber);

    return (
        <DashboardLayout section="chats">
            <PageHeader
                title={phoneNumber}
                size="detail"
                backLink={{ href: '/dashboard/chats', label: 'Back to conversations' }}
            />
            <ChatView phoneNumber={phoneNumber} />
        </DashboardLayout>
    );
}
