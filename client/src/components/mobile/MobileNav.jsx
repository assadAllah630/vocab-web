import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    House,
    BookText,
    GraduationCap,
    UserCircle,
    LayoutDashboard,
    PlusCircle,
    Swords,
    School,
    // Filled variants for active state
    Home,
    BookOpen,
    Sparkles,
    User
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { checkTeacherStatus } from '../../api';

function MobileNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isTeacher, setIsTeacher] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Check teacher status on mount
    useEffect(() => {
        const fetchTeacherStatus = async () => {
            try {
                const res = await checkTeacherStatus();
                setIsTeacher(res.data?.is_teacher || false);
            } catch (err) {
                // Not a teacher or not logged in
                setIsTeacher(false);
            }
        };
        fetchTeacherStatus();
    }, []);

    // Tabs with translated labels - Home path changes based on teacher status
    const tabs = isTeacher ? [
        { id: 'home', path: '/m/dashboard', label: 'Dashboard', icon: LayoutDashboard, activeIcon: LayoutDashboard },
        { id: 'classes', path: '/m/teacher/classes', label: 'Classes', icon: School, activeIcon: School },
        ((user.is_staff || user.is_superuser) ?
            { id: 'create', path: '/m/path/create/build', label: 'Create', icon: PlusCircle, activeIcon: PlusCircle } :
            { id: 'studio', path: '/m/teacher/workspace', label: 'Studio', icon: LayoutDashboard, activeIcon: LayoutDashboard }
        ),
        { id: 'profile', path: '/m/teacher/profile', label: 'Profile', icon: UserCircle, activeIcon: User }
    ] : [
        { id: 'home', path: '/m', label: t('home'), icon: House, activeIcon: Home },
        { id: 'classes', path: '/m/classes', label: 'Classes', icon: School, activeIcon: School },
        { id: 'practice', path: '/m/practice', label: 'Practice', icon: BookText, activeIcon: Sparkles },
        { id: 'profile', path: '/m/me', label: t('profile'), icon: UserCircle, activeIcon: User }
    ];

    const getActiveTab = () => {
        const path = location.pathname;
        if (path.startsWith('/m/words')) return 'words';
        if (path.startsWith('/m/practice')) return 'practice';

        // Fix for teacher navigation active states
        if (isTeacher) {
            if (path.startsWith('/m/dashboard')) return 'home';
            if (path.startsWith('/m/teacher/workspace') || path.startsWith('/m/teacher/edit')) return 'studio';
            if (path.startsWith('/m/teacher/classes') || path.startsWith('/m/classroom')) return 'classes';
            if (path.startsWith('/m/teacher/profile')) return 'profile';
        }

        if (path.startsWith('/m/teacher') || path.startsWith('/m/classroom')) return 'teacher'; // Fallback logic?
        if (path.startsWith('/m/me')) return 'me';
        // For teachers, dashboard is home
        if (isTeacher && path.startsWith('/m/dashboard')) return 'home';
        if (path === '/m') return 'home';
        return 'home';
    };

    const activeTab = getActiveTab();

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 px-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
                className="rounded-3xl mx-auto max-w-sm"
                style={{
                    backgroundColor: 'rgba(24, 24, 27, 0.9)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
            >
                <div className="flex items-center justify-around h-[68px] px-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = isActive ? tab.activeIcon : tab.icon;

                        return (
                            <motion.button
                                key={tab.id}
                                whileTap={{ scale: 0.85 }}
                                onClick={() => navigate(tab.path)}
                                className="flex flex-col items-center justify-center flex-1 h-full relative py-2"
                            >
                                {/* Active background pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="navPill"
                                        className="absolute inset-x-2 inset-y-1.5 rounded-2xl"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)'
                                        }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 500,
                                            damping: 35
                                        }}
                                    />
                                )}

                                {/* Icon with bounce animation */}
                                <motion.div
                                    animate={{
                                        y: isActive ? -3 : 0,
                                        scale: isActive ? 1.1 : 1
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 20
                                    }}
                                    className="relative z-10"
                                >
                                    <Icon
                                        size={24}
                                        strokeWidth={isActive ? 2.5 : 1.8}
                                        style={{
                                            color: isActive ? '#A5B4FC' : '#6B7280',
                                            filter: isActive ? 'drop-shadow(0 0 6px rgba(165, 180, 252, 0.4))' : 'none'
                                        }}
                                    />
                                </motion.div>

                                {/* Label with fade animation */}
                                <motion.span
                                    animate={{
                                        opacity: isActive ? 1 : 0.5,
                                        y: isActive ? 0 : 2
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[11px] mt-1.5 font-semibold relative z-10 tracking-wide"
                                    style={{ color: isActive ? '#C7D2FE' : '#6B7280' }}
                                >
                                    {tab.label}
                                </motion.span>

                                {/* Active dot indicator */}
                                {isActive && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                                        style={{ backgroundColor: '#818CF8' }}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.nav>
        </div>
    );
}

export default MobileNav;
