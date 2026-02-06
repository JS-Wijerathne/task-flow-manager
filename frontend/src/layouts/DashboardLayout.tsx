import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../shared/hooks/usePermissions';
import { FolderKanban, Users, LogOut, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * DashboardLayout - Main application layout
 * 
 * Pattern: Role-aware navigation similar to Spring Security's authorize tags
 * - Conditionally renders nav items based on user role
 * - Shows role-specific indicators (Admin Mode, View-Only Mode)
 */
export const DashboardLayout = () => {
    const { logout } = useAuthStore();
    const { user, isAdmin, canViewMembersList } = usePermissions();

    // Navigation items with optional visibility rules
    const navItems = [
        {
            to: '/projects',
            label: 'Projects',
            icon: FolderKanban,
            visible: true, // Always visible for authenticated users
        },
        {
            to: '/members',
            label: 'Members',
            icon: Users,
            visible: canViewMembersList, // Admin only
        },
    ];

    // Filter to only visible nav items
    const visibleNavItems = navItems.filter(item => item.visible);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-lg">
                            T
                        </span>
                        Temp Ops
                    </h1>
                </div>

                <nav className="px-4 space-y-1 flex-1">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary-50 text-primary-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                )
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {user?.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <div className="flex items-center gap-1">
                                <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full font-medium",
                                    user?.role === 'ADMIN' ? "bg-red-100 text-red-700" :
                                        user?.role === 'MEMBER' ? "bg-blue-100 text-blue-700" :
                                            "bg-gray-200 text-gray-700"
                                )}>
                                    {user?.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Admin Mode Indicator */}
                    {isAdmin && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold mb-1">
                                <ShieldAlert className="w-4 h-4" />
                                Admin Mode
                            </div>
                            <p className="text-xs text-amber-700">
                                You have full write access. All actions are audited.
                            </p>
                        </div>
                    )}



                    <button
                        onClick={logout}
                        className="flex items-center w-full gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
                </header>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
