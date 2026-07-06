import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Sidebar from './Sidebar';
import { requireAuthAdminUser } from '@/lib/admin-auth';
import { hasSectionAccess, toNavPermissions, type AdminSection } from '@/lib/admin-permissions';

interface DashboardLayoutProps {
    children: ReactNode;
    section?: AdminSection;
}

export default async function DashboardLayout({ children, section }: DashboardLayoutProps) {
    const user = await requireAuthAdminUser();

    if (section && !hasSectionAccess(user, section)) {
        // Home dashboard is always reachable — avoid redirect loop on ?access=denied
        redirect('/dashboard?access=denied');
    }

    const nav = toNavPermissions(user);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar username={user.username} nav={nav} />

            <main className="ml-64 min-h-screen">
                <div className="p-6 md:p-8 lg:p-10">{children}</div>
            </main>
        </div>
    );
}
