import DashboardLayout from '@/components/dashboard/DashboardLayout';
import connectDB from '@/lib/db';
import PoliceStation from '@/models/PoliceStation';
import { requireSection } from '@/lib/admin-auth';
import { canManageAdminUsers } from '@/lib/admin-permissions';
import { listAdminUsers } from '@/app/actions/users';
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
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    Admin Users
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">
                    Create admins with section-wise access, chat permissions, and police station scope
                </p>
            </div>

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
