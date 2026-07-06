import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Users, MessageSquare, Zap } from 'lucide-react';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuthAdminUser } from '@/lib/admin-auth';
import { canManageAdminUsers } from '@/lib/admin-permissions';
import Link from 'next/link';

async function getUserCount() {
    await connectDB();
    return User.countDocuments({ isActive: { $ne: false } });
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ access?: string }>;
}) {
    const user = await requireAuthAdminUser();
    const params = await searchParams;
    const userCount = await getUserCount();

    return (
        <DashboardLayout>
            {params.access === 'denied' ? (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
                    You do not have access to that section. Contact your administrator.
                </div>
            ) : null}

            <section className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    Welcome Back, {user.username}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base">
                    {user.isSuperAdmin
                        ? 'You have full super admin access to all modules.'
                        : user.policeStationNames.length
                          ? `Scoped to ${user.policeStationNames.length} police station(s).`
                          : 'Manage your assigned dashboard modules.'}
                </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Admins</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{userCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">WhatsApp Status</p>
                            <p className="text-base font-semibold text-green-600 dark:text-green-400 mt-1">Connected</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your Role</p>
                            <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                                {user.isSuperAdmin ? 'Super Admin' : user.canManageAdmins ? 'Manager' : 'Admin'}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </div>
            </div>

            {canManageAdminUsers(user) ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Admin Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                        Create admins with custom section access, chat permissions, and police station scope.
                    </p>
                    <Link
                        href="/dashboard/users"
                        className="inline-flex px-4 py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                    >
                        Manage Admin Users
                    </Link>
                </div>
            ) : null}
        </DashboardLayout>
    );
}
