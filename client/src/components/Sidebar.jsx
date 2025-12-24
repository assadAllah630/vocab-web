import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    HomeIcon,
    BookOpenIcon,
    AcademicCapIcon,
    DocumentTextIcon,
    MicrophoneIcon,
    GlobeAltIcon,
    PuzzlePieceIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    PowerIcon,
    Bars3Icon,
    XMarkIcon,
    SparklesIcon,
    PencilSquareIcon,
    LanguageIcon,
    SignalIcon
} from '@heroicons/react/24/outline';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';

function Sidebar({ user, setUser }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { currentLanguage, availableLanguages, switchLanguage } = useLanguage();
    const [showLangMenu, setShowLangMenu] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    const isTeacher = user?.is_staff || user?.teacher_profile;

    const navItems = [
        // Teacher Routes
        ...(isTeacher ? [
            { to: '/teacher/dashboard', label: 'Teacher Command', icon: ChartBarIcon },
            /* { to: '/classroom/create', label: 'New Class', icon: PlusIcon }, */ // Optional shortcut
        ] : []),

        // Common/Student Routes
        { to: '/dashboard', label: isTeacher ? 'Student View' : 'Dashboard', icon: HomeIcon },
        { to: '/vocab', label: 'Vocabulary', icon: BookOpenIcon },
        { to: '/grammar', label: 'Grammar', icon: AcademicCapIcon },
        { to: '/exams', label: 'AI Exams', icon: PencilSquareIcon },
        { to: '/advanced-text-generator', label: 'AI Generator', icon: SparklesIcon },
        { to: '/podcasts', label: 'Podcasts', icon: MicrophoneIcon },
        { to: '/shared', label: 'Explore', icon: GlobeAltIcon },
        { to: '/practice', label: 'Practice', icon: PuzzlePieceIcon },
        { to: '/reader', label: 'Reader', icon: DocumentTextIcon },
        { to: '/games', label: 'Games', icon: PuzzlePieceIcon },
    ];
    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const currentLangObj = availableLanguages.find(l => l.code === currentLanguage) || availableLanguages[0];

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-slate-200">
                <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
                    <Logo />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            <Icon className={`h-5 w-5 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-slate-200 space-y-1">
                {/* Language Switcher */}
                <div className="relative mb-2">
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all duration-200 border border-slate-200"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{currentLangObj?.flag}</span>
                            <span>{currentLangObj?.name}</span>
                        </div>
                        <GlobeAltIcon className="h-4 w-4 text-slate-400" />
                    </button>

                    {showLangMenu && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
                            {availableLanguages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        switchLanguage(lang.code);
                                        setShowLangMenu(false);
                                    }}
                                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${currentLanguage === lang.code ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700'
                                        }`}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    <span>{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Link
                    to="/settings"
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/settings')
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    <Cog6ToothIcon className={`h-5 w-5 ${isActive('/settings') ? 'text-primary-600' : 'text-slate-400'}`} />
                    Settings
                </Link>
                <button
                    onClick={() => {
                        handleLogout();
                        setIsMobileOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all duration-200"
                >
                    <PowerIcon className="h-5 w-5 text-slate-400" />
                    Log Out
                </button>

                {/* User Info */}
                {user && (
                    <Link
                        to="/profile"
                        onClick={() => setIsMobileOpen(false)}
                        className="block mt-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-700 font-semibold text-sm">
                                    {user.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{user.username}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-slate-200 hover:bg-slate-50 transition-colors"
            >
                {isMobileOpen ? (
                    <XMarkIcon className="h-6 w-6 text-slate-700" />
                ) : (
                    <Bars3Icon className="h-6 w-6 text-slate-700" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 shadow-sm z-30">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <SidebarContent />
            </aside>
        </>
    );
}

export default Sidebar;
