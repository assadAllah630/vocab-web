import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    HomeIcon,
    UsersIcon,
    BookOpenIcon,
    ChartBarIcon,
    CogIcon,
    ArrowRightOnRectangleIcon,
    ClipboardDocumentListIcon,
    BoltIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../api';
import { ToastProvider } from './ui/Toast';
import { CommandPalette } from './common/CommandPalette';
import { ThemeToggle } from './ui/ThemeToggle';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Vocabulary', href: '/content/vocabulary', icon: BookOpenIcon },
    { name: 'AI Content', href: '/content/generated', icon: BookOpenIcon },
    { name: 'User Analytics', href: '/analytics/users', icon: ChartBarIcon },
    { name: 'AI Analytics', href: '/analytics/ai', icon: ChartBarIcon },
    { name: 'Content Stats', href: '/analytics/content', icon: ChartBarIcon },
    { name: 'System Health', href: '/monitoring/health', icon: BoltIcon },
    { name: 'Error Logs', href: '/monitoring/errors', icon: ArrowRightOnRectangleIcon },
    { name: 'Audit Logs', href: '/monitoring/audit', icon: ClipboardDocumentListIcon },
    { name: 'General Settings', href: '/settings/general', icon: CogIcon },
    { name: 'Admin Users', href: '/settings/admins', icon: UsersIcon },
];

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const handleLogout = async () => {
        try {
            await api.post('/api/admin/auth/logout/');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            navigate('/login');
        }
    };

    return (
        <ToastProvider>
            <div className="min-h-screen bg-muted/30 transition-colors duration-200">
                <CommandPalette />

                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 transform bg-background border-r border-border transition-transform duration-200 ease-in-out md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex h-16 items-center justify-between px-4 border-b border-border-light dark:border-border-dark">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            VocabMaster
                        </h1>
                        <button
                            className="md:hidden text-text-secondary-light dark:text-text-secondary-dark"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex flex-col h-[calc(100%-4rem)]">
                        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
                            {navigation.map((item) => {
                                const isActive = location.pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            "group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-150",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-primary-light dark:hover:text-text-primary-dark"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                                isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400"
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="border-t border-border-light dark:border-border-dark p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Avatar
                                        alt={user.username}
                                        className="h-8 w-8 mr-3"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                                            {user.username}
                                        </p>
                                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark capitalize">
                                            {user.role}
                                        </p>
                                    </div>
                                </div>
                                <ThemeToggle />
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-text-muted-light dark:text-text-muted-dark hover:text-error hover:bg-error/10"
                                onClick={handleLogout}
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex flex-col md:pl-64 min-h-screen">
                    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border md:hidden">
                        <button
                            type="button"
                            className="px-4 text-text-secondary-light dark:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>

                    <main className="flex-1">
                        <div className="h-full">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
