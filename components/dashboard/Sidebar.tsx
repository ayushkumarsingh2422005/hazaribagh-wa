'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import {
    LayoutDashboard,
    MessageSquare,
    FlaskConical,
    Users,
    SlidersHorizontal,
    LogOut,
    Star,
    FileWarning,
    Building2,
    MapPin,
    BookOpen,
    ClipboardList,
    Link2,
    X,
    Shield,
} from 'lucide-react';
import {
    ADMIN_SECTION_META,
    NAV_GROUP_LABELS,
    type NavPermissions,
    type AdminSection,
} from '@/lib/admin-permissions';

const SECTION_ICONS: Record<AdminSection, React.ComponentType<{ className?: string }>> = {
    dashboard: LayoutDashboard,
    chats: MessageSquare,
    test_whatsapp: FlaskConical,
    police_stations: MapPin,
    police_offices: Building2,
    traffic_rules: BookOpen,
    complaints: ClipboardList,
    raw_complaints: FileWarning,
    reviews: Star,
    resources: Link2,
    admin_users: Users,
    settings: SlidersHorizontal,
};

const GROUP_ORDER = ['overview', 'operations', 'directory', 'administration'] as const;

interface SidebarProps {
    username: string;
    nav: NavPermissions;
    mobileOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ username, nav, mobileOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();

    const isVisible = (key: AdminSection) => {
        if (key === 'dashboard') return true;
        if (key === 'chats') return nav.canAccessChats && nav.sections.chats;
        if (key === 'admin_users') return nav.sections.admin_users || nav.canManageAdmins;
        return nav.sections[key];
    };

    const visibleItems = ADMIN_SECTION_META.filter(item => isVisible(item.key));

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href;
        return pathname.startsWith(href);
    };

    const roleLabel = nav.isSuperAdmin
        ? 'Super Admin'
        : nav.canManageAdmins
          ? 'Manager'
          : 'Administrator';

    return (
        <aside
            className={`
                fixed left-0 top-0 h-screen w-64 flex flex-col z-50 border-r
                bg-white text-slate-700 border-slate-200
                dark:bg-[#0b1f3a] dark:text-slate-300 dark:border-slate-800/80
                transition-colors duration-200
                transition-transform ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25 shrink-0">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-bold text-sm leading-tight truncate text-slate-900 dark:text-white">
                            Hazaribagh Police
                        </h1>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            WhatsApp Admin
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    aria-label="Close menu"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto">
                {GROUP_ORDER.map(group => {
                    const items = visibleItems.filter(i => i.group === group);
                    if (items.length === 0) return null;

                    return (
                        <div key={group} className="mb-5">
                            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                {NAV_GROUP_LABELS[group]}
                            </p>
                            <div className="space-y-0.5">
                                {items.map(item => {
                                    const Icon = SECTION_ICONS[item.key];
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`
                                                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                                                ${
                                                    active
                                                        ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-500/20 dark:text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                                                }
                                            `}
                                        >
                                            <span
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                    active
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 dark:border-white/10">
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm uppercase shadow-md">
                            {username.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-slate-900 dark:text-white">
                                {username}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{roleLabel}</p>
                        </div>
                    </div>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors
                                text-slate-600 bg-slate-50 hover:bg-slate-100
                                dark:text-slate-300 dark:bg-white/5 dark:hover:bg-white/10"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>

            <div className="px-4 pb-4">
                <p className="text-[10px] text-center leading-relaxed text-slate-400 dark:text-slate-500">
                    Suraksha · Seva · Vishwas
                    <br />
                    <a
                        href="https://digicraft.one"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    >
                        DigiCraft Innovation
                    </a>
                </p>
            </div>
        </aside>
    );
}
