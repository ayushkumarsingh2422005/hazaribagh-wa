'use client';

import { useState } from 'react';
import { deleteAdminUser } from '@/app/actions/users';
import AdminUserForm from './AdminUserForm';
import type { SerializedAdminUser } from '@/lib/admin-permissions';
import { ADMIN_SECTION_META } from '@/lib/admin-permissions';
import { SERVICE_GROUPS } from '@/lib/complaint-services';
import { Shield, Pencil, Trash2, X } from 'lucide-react';

type PoliceStation = { name: string; nameHindi: string };

type Props = {
    users: SerializedAdminUser[];
    policeStations: PoliceStation[];
    actorId: string;
    actorIsSuperAdmin: boolean;
    actorCanManage: boolean;
};

export default function UsersClient({
    users,
    policeStations,
    actorId,
    actorIsSuperAdmin,
    actorCanManage,
}: Props) {
    const [editing, setEditing] = useState<SerializedAdminUser | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (userId: string) => {
        if (!confirm('Delete this admin user? This cannot be undone.')) return;
        setDeleting(userId);
        await deleteAdminUser(userId);
        setDeleting(null);
    };

    const permSummary = (user: SerializedAdminUser) => {
        if (user.isSuperAdmin) return 'Super Admin — full access';
        const enabled = ADMIN_SECTION_META.filter(s => user.permissions[s.key]).map(s => s.label);
        const scope =
            user.policeStationNames.length === 0
                ? 'All PS'
                : `${user.policeStationNames.length} PS`;
        const serviceScope =
            user.allowedComplaintTypes.length === 0
                ? 'All services'
                : `${SERVICE_GROUPS.filter(g => g.types.some(t => user.allowedComplaintTypes.includes(t))).length} services`;
        const extras = [
            user.canManageAdmins ? 'Manager' : null,
            user.canAccessChats ? 'Chats' : null,
        ].filter(Boolean);
        return `${enabled.length} sections · ${scope} · ${serviceScope}${extras.length ? ` · ${extras.join(', ')}` : ''}`;
    };

    return (
        <div className="space-y-8">
            {actorCanManage ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {showCreate || editing ? (editing ? 'Edit Admin' : 'New Admin') : 'Add Admin User'}
                        </h2>
                        {(showCreate || editing) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreate(false);
                                    setEditing(null);
                                }}
                                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {showCreate || editing ? (
                        <AdminUserForm
                            policeStations={policeStations}
                            actorIsSuperAdmin={actorIsSuperAdmin}
                            editUser={editing}
                            onCancel={() => {
                                setShowCreate(false);
                                setEditing(null);
                            }}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            + Create admin with custom permissions
                        </button>
                    )}
                </div>
            ) : null}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        All Administrators
                        <span className="ml-2 text-sm px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {users.length}
                        </span>
                    </h2>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map(user => (
                        <div
                            key={user._id}
                            className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className={`w-12 h-12 flex items-center justify-center font-bold uppercase text-lg ${
                                        user.isSuperAdmin
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    {user.isSuperAdmin ? <Shield className="w-6 h-6" /> : user.username.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-900 dark:text-white text-lg">
                                            {user.username}
                                        </p>
                                        {user.isSuperAdmin ? (
                                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                                                Super Admin
                                            </span>
                                        ) : null}
                                        {!user.isActive ? (
                                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 font-medium">
                                                Inactive
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{permSummary(user)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:ml-4">
                                {actorCanManage && user._id !== actorId && !user.isSuperAdmin ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreate(false);
                                                setEditing(user);
                                            }}
                                            className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(user._id)}
                                            disabled={deleting === user._id}
                                            className="p-2 text-slate-500 hover:text-red-600 disabled:opacity-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : actorCanManage && (user._id === actorId || user.isSuperAdmin) ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreate(false);
                                            setEditing(user);
                                        }}
                                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Edit profile
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
