import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import DashboardShell from './DashboardShell';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { requireAuthAdminUser } from '@/lib/admin-auth';
import { hasSectionAccess, toNavPermissions, type AdminSection } from '@/lib/admin-permissions';

interface DashboardLayoutProps {
    children: ReactNode;
    section?: AdminSection;
}

export default async function DashboardLayout({ children, section }: DashboardLayoutProps) {
    const user = await requireAuthAdminUser();

    if (section && !hasSectionAccess(user, section)) {
        redirect(`/dashboard?access=denied&section=${section}`);
    }

    const nav = toNavPermissions(user);

    return (
        <ToastProvider>
            <DashboardShell username={user.username} nav={nav}>
                {children}
            </DashboardShell>
        </ToastProvider>
    );
}
