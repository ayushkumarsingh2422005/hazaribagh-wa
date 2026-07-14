'use client';

import { useActionState, useState } from 'react';
import { createAdminUser, updateAdminUser } from '@/app/actions/users';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    ADMIN_SECTION_META,
    emptyPermissions,
    type AdminPermissions,
    type SerializedAdminUser,
} from '@/lib/admin-permissions';
import { SERVICE_GROUPS } from '@/lib/complaint-services';

type PoliceStation = { name: string; nameHindi: string };

type Props = {
    policeStations: PoliceStation[];
    actorIsSuperAdmin: boolean;
    editUser?: SerializedAdminUser | null;
    onCancel?: () => void;
};

const initialState: { error?: string; success?: string } = {};

export default function AdminUserForm({
    policeStations,
    actorIsSuperAdmin,
    editUser,
    onCancel,
}: Props) {
    const action = editUser ? updateAdminUser : createAdminUser;
    const [state, formAction, isPending] = useActionState(action, initialState);

    const [permissions, setPermissions] = useState<AdminPermissions>(
        editUser?.permissions || emptyPermissions()
    );
    const [selectedStations, setSelectedStations] = useState<string[]>(
        editUser?.policeStationNames || []
    );
    const [selectedServiceGroups, setSelectedServiceGroups] = useState<string[]>(() => {
        const types = editUser?.allowedComplaintTypes || [];
        if (!types.length) return [];
        return SERVICE_GROUPS.filter(g => g.types.some(t => types.includes(t))).map(g => g.id);
    });
    const [isSuperAdmin, setIsSuperAdmin] = useState(editUser?.isSuperAdmin || false);
    const [canManageAdmins, setCanManageAdmins] = useState(editUser?.canManageAdmins || false);
    const [canAccessChats, setCanAccessChats] = useState(editUser?.canAccessChats || false);

    const togglePerm = (key: keyof AdminPermissions) => {
        setPermissions(p => ({ ...p, [key]: !p[key] }));
    };

    const toggleStation = (name: string) => {
        setSelectedStations(prev =>
            prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
        );
    };

    const toggleServiceGroup = (groupId: string) => {
        setSelectedServiceGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const allStations = selectedStations.length === 0;
    const allServices = selectedServiceGroups.length === 0;
    const allowedComplaintTypes = isSuperAdmin
        ? []
        : SERVICE_GROUPS.filter(g => selectedServiceGroups.includes(g.id)).flatMap(g => g.types);

    return (
        <form action={formAction} className="space-y-6">
            {editUser ? <input type="hidden" name="userId" value={editUser._id} /> : null}
            <input type="hidden" name="policeStationNames" value={JSON.stringify(isSuperAdmin ? [] : selectedStations)} />
            <input type="hidden" name="allowedComplaintTypes" value={JSON.stringify(allowedComplaintTypes)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="username" label="Username" defaultValue={editUser?.username} required />
                <Input name="email" type="email" label="Email" defaultValue={editUser?.email} required />
            </div>

            <Input
                name="phoneNumber"
                type="tel"
                label="Phone number (optional)"
                hint="10-digit mobile for contact"
                placeholder="9876543210"
                defaultValue={editUser?.phoneNumber || ''}
            />

            <Input
                name="password"
                type="password"
                label={editUser ? 'New Password (leave blank to keep)' : 'Password'}
                placeholder="••••••••"
                required={!editUser}
            />

            {actorIsSuperAdmin ? (
                <div className="p-4 border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isSuperAdmin"
                            checked={isSuperAdmin}
                            onChange={e => setIsSuperAdmin(e.target.checked)}
                            className="mt-1"
                        />
                        <div>
                            <span className="font-semibold text-slate-900 dark:text-white">Super Admin</span>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                Full access to all sections, all police stations, all chatbot services, and admin management.
                            </p>
                        </div>
                    </label>
                </div>
            ) : null}

            {!isSuperAdmin ? (
                <>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Special roles</h3>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="canManageAdmins"
                                checked={canManageAdmins}
                                onChange={e => setCanManageAdmins(e.target.checked)}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                Managerial role — can create and edit other admin users
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="canAccessChats"
                                checked={canAccessChats}
                                onChange={e => setCanAccessChats(e.target.checked)}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                WhatsApp chat access — view and reply to citizen chats
                            </span>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Dashboard sections</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Select which modules this admin can access.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ADMIN_SECTION_META.map(section => (
                                <label
                                    key={section.key}
                                    className="flex items-start gap-2 p-3 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <input
                                        type="checkbox"
                                        name={`perm_${section.key}`}
                                        checked={permissions[section.key]}
                                        onChange={() => togglePerm(section.key)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            {section.label}
                                        </span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{section.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Police station scope</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Leave all unchecked for district-wide access. Select specific stations to limit complaints
                            and related data to those PS only.
                        </p>
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            {allStations
                                ? 'Scope: All police stations (district-wide)'
                                : `Scope: ${selectedStations.length} station(s) selected`}
                        </p>
                        <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {policeStations.map(station => (
                                <label key={station.name} className="flex items-center gap-2 cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedStations.includes(station.name)}
                                        onChange={() => toggleStation(station.name)}
                                    />
                                    <span className="text-slate-700 dark:text-slate-300">
                                        {station.name}
                                        {station.nameHindi ? (
                                            <span className="text-slate-400 ml-1">({station.nameHindi})</span>
                                        ) : null}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Chatbot service scope</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Leave all unchecked for access to every service (passport, character verification, traffic,
                            petition, cyber crime, etc.). Select specific services to limit complaints and related data.
                        </p>
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            {allServices
                                ? 'Scope: All chatbot services'
                                : `Scope: ${selectedServiceGroups.length} service group(s) selected`}
                        </p>
                        <div className="border border-slate-200 dark:border-slate-700 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {SERVICE_GROUPS.map(group => (
                                <label key={group.id} className="flex items-start gap-2 cursor-pointer text-sm p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <input
                                        type="checkbox"
                                        checked={selectedServiceGroups.includes(group.id)}
                                        onChange={() => toggleServiceGroup(group.id)}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{group.label}</span>
                                        <p className="text-xs text-slate-400">{group.types.length} complaint type(s)</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            ) : null}

            {editUser ? (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isActive" defaultChecked={editUser.isActive} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Account active</span>
                </label>
            ) : null}

            {state?.error ? (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{state.error}</div>
            ) : null}
            {state?.success ? (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
                    {state.success}
                </div>
            ) : null}

            <div className="flex gap-3">
                <Button type="submit" variant="primary" isLoading={isPending}>
                    {editUser ? 'Save Changes' : 'Create Admin'}
                </Button>
                {onCancel ? (
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                ) : null}
            </div>
        </form>
    );
}
