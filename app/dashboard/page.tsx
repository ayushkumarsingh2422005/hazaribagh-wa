import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ADMIN_SECTION_META } from '@/lib/admin-permissions';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { getWhatsAppHealth } from '@/lib/whatsapp-health';
import { getDashboardOverview } from '@/lib/dashboard-stats';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { requireAuthAdminUser } from '@/lib/admin-auth';
import Link from 'next/link';

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ access?: string; section?: string }>;
}) {
    const user = await requireAuthAdminUser();
    const params = await searchParams;
    const [overview, health] = await Promise.all([getDashboardOverview(user), Promise.resolve(getWhatsAppHealth())]);

    const deniedSection = params.section
        ? ADMIN_SECTION_META.find(s => s.key === params.section)?.label || params.section
        : null;

    return (
        <DashboardLayout>
            {params.access === 'denied' ? (
                <AlertBanner variant="warning" className="mb-5">
                    You do not have access to {deniedSection ? `"${deniedSection}"` : 'that section'}. Contact your
                    administrator if you need permission.
                </AlertBanner>
            ) : null}

            {!health.configured && (user.isSuperAdmin || user.permissions.settings) && (
                <AlertBanner variant="warning" className="mb-5">
                    {health.message}{' '}
                    <Link href="/dashboard/settings" className="underline font-semibold">
                        View settings
                    </Link>
                </AlertBanner>
            )}

            <DashboardOverview overview={overview} />
        </DashboardLayout>
    );
}
