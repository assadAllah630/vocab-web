import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MobileNav from './MobileNav';
import MobileFloatingExamTimer from './MobileFloatingExamTimer';
import InstallPrompt from '../InstallPrompt';

function MobileLayout() {
    const location = useLocation();
    return (
        <div
            className="min-h-screen flex flex-col relative overflow-hidden"
            style={{ backgroundColor: '#09090B' }}
        >
            {/* Subtle gradient background orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Top right blur */}
                <div
                    className="absolute -top-32 -right-32 w-80 h-80 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                        filter: 'blur(60px)'
                    }}
                />
                {/* Bottom left blur */}
                <div
                    className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
                        filter: 'blur(80px)'
                    }}
                />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto pb-24 relative z-10 no-scrollbar">
                <AnimatePresence mode="wait">
                    <Outlet />
                </AnimatePresence>
            </main>

            {/* Floating Exam Timer - shows when exam is active but user is on another page */}
            <MobileFloatingExamTimer />

            {/* PWA Install Prompt */}
            <InstallPrompt />

            {!location.pathname.includes('/session/') && <MobileNav />}
        </div>
    );
}

export default MobileLayout;

