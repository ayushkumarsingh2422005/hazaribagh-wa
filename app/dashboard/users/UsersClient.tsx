'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAdminUser } from '@/app/actions/users';
import AdminUserForm from './AdminUserForm';
import type { SerializedAdminUser } from '@/lib/admin-permissions';
import { ADMIN_SECTION_META } from '@/lib/admin-permissions';
import { SERVICE_GROUPS } from '@/lib/complaint-services';
import { Shield, Pencil, Trash2, X, Users, Phone } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, ListRow } from '@/components/ui/Card';

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
    const toast = useToast();
    const router = useRouter();
    const [editing, setEditing] = useState<SerializedAdminUser | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const handleDelete = async (userId: string) => {
        if (confirmDelete !== userId) {
            setConfirmDelete(userId);
            return;
        }
        setDeleting(userId);
        const result = await deleteAdminUser(userId);
        setDeleting(null);
        setConfirmDelete(null);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Admin user deleted');
            router.refresh();
        }
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
        <div className="space-y-4">
            {!actorCanManage && (
                <AlertBanner variant="info">
                    You can view administrator accounts but cannot create or delete users. Contact a manager for
                    changes.
                </AlertBanner>
            )}

            {actorCanManage ? (
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
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
                        <Button type="button" onClick={() => setShowCreate(true)}>
                            + Create admin
                        </Button>
                    )}
                </Card>
            ) : null}

            <Card>
                <CardHeader title="All Administrators" count={users.length} />
                <CardBody divided>
                    {users.length === 0 ? (
                        <EmptyState icon={Users} title="No administrators yet" />
                    ) : (
                    users.map(user => (
                        <ListRow key={user._id}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div
                                    className={`w-9 h-9 flex items-center justify-center font-bold uppercase text-sm shrink-0 ${
                                        user.isSuperAdmin
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    {user.isSuperAdmin ? <Shield className="w-6 h-6" /> : user.username.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
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
                                    {user.phoneNumber ? (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Phone className="w-3 h-3 shrink-0" aria-hidden />
                                            {user.phoneNumber}
                                        </p>
                                    ) : null}
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
                                            className={`p-2 disabled:opacity-50 ${
                                                confirmDelete === user._id
                                                    ? 'text-red-600'
                                                    : 'text-slate-500 hover:text-red-600'
                                            }`}
                                            aria-label="Delete admin user"
                                            title={confirmDelete === user._id ? 'Click again to confirm' : 'Delete'}
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
                        </ListRow>
                    ))
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
