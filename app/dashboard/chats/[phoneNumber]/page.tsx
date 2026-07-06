import ChatView from './ChatView';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default async function ChatDetailPage({
    params,
}: {
    params: Promise<{ phoneNumber: string }>;
}) {
    const { phoneNumber: encodedPhoneNumber } = await params;
    const phoneNumber = decodeURIComponent(encodedPhoneNumber);

    return (
        <DashboardLayout section="chats">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {phoneNumber}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    WhatsApp Conversation
                </p>
            </div>

            <ChatView phoneNumber={phoneNumber} />
        </DashboardLayout>
    );
}
