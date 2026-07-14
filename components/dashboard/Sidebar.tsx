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
    ChevronRight,
    Star,
    FileWarning,
    Building2,
    MapPin,
    BookOpen,
    ClipboardList,
    Link2,
    X,
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
    // DISABLED: police_offices: Building2,
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

    const sidebarClasses = `
        fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50
        transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
    `;

    return (
        <aside className={sidebarClasses}>
            <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        H
                    </div>
                    <h1 className="font-bold text-base text-slate-900 dark:text-white">Hazaribagh WA</h1>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="lg:hidden p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
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
                        <div key={group} className="mb-4">
                            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {NAV_GROUP_LABELS[group]}
                            </p>
                            <div className="space-y-1">
                                {items.map(item => {
                                    const Icon = SECTION_ICONS[item.key];
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={`
                                                group flex items-center justify-between px-3 py-2.5 transition-colors
                                                ${active
                                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-400'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border-l-2 border-transparent'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                                                <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                            {active ? (
                                                <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            ) : null}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 dark:border-slate-800">
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-sm uppercase">
                            {username.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{username}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                        </div>
                    </div>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>

            <div className="px-4 pb-3 pt-1">
                <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center leading-relaxed">
                    Powered by{' '}
                    <a
                        href="https://digicraft.one"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-slate-500 dark:hover:text-slate-500 transition-colors"
                    >
                        DigiCraft Innovation Pvt. Ltd.
                    </a>
                </p>
            </div>
        </aside>
    );
}
