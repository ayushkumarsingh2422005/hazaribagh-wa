import DashboardLayout from '@/components/dashboard/DashboardLayout';
import connectDB from '@/lib/db';
import PoliceStation from '@/models/PoliceStation';
import { requireSection } from '@/lib/admin-auth';
import { canManageAdminUsers } from '@/lib/admin-permissions';
import { listAdminUsers } from '@/app/actions/users';
import { PageHeader } from '@/components/ui/PageHeader';
import UsersClient from './UsersClient';

async function getPoliceStations() {
    await connectDB();
    const stations = await PoliceStation.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select('name nameHindi')
        .lean();
    return stations.map(s => ({ name: s.name, nameHindi: s.nameHindi }));
}

export default async function UsersPage() {
    const actor = await requireSection('admin_users');
    const users = await listAdminUsers();
    const policeStations = await getPoliceStations();

    return (
        <DashboardLayout section="admin_users">
            <PageHeader title="Admin Users" />

            <UsersClient
                users={users}
                policeStations={policeStations}
                actorId={actor._id}
                actorIsSuperAdmin={actor.isSuperAdmin}
                actorCanManage={canManageAdminUsers(actor)}
            />
        </DashboardLayout>
    );
}
