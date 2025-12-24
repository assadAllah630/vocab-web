import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * GameVX - Visual Effects Engine
 * Handles:
 * - Screen Shake
 * - Particle Bursts (Confetti)
 * - Reactive Backgrounds
 * - Haptics
 */

export const GameVX = ({
    shakeTrigger,
    streak,
    children
}) => {
    const controls = useAnimation();

    // Haptics Helper
    const vibrate = (pattern) => {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    // Shake Effect
    useEffect(() => {
        if (shakeTrigger > 0) {
            // Intensity based on streak or error type
            const intensity = shakeTrigger === 2 ? 20 : 10;

            controls.start({
                x: [0, -intensity, intensity, -intensity, intensity, 0],
                transition: { duration: 0.4 }
            });

            // Heavy thud haptic
            vibrate([50, 50, 50]);
        }
    }, [shakeTrigger, controls]);

    // Streak / Win Effects
    useEffect(() => {
        if (streak > 0 && streak % 5 === 0) {
            // Milestone confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            });
            vibrate([50, 50, 100]);
        }
    }, [streak]);

    // Dynamic Background Colors based on Streak
    const getBgColor = () => {
        if (streak >= 15) return 'from-red-900 via-orange-900 to-amber-900'; // ON FIRE
        if (streak >= 10) return 'from-indigo-900 via-purple-900 to-pink-900'; // LEGENDARY
        if (streak >= 5) return 'from-blue-900 via-indigo-900 to-purple-900'; // HEATING UP
        return 'from-gray-900 via-[#0A0A0B] to-black'; // BASE
    };

    return (
        <motion.div
            animate={controls}
            className={`min-h-screen bg-gradient-to-br transition-colors duration-1000 ${getBgColor()} overflow-hidden relative`}
        >
            {/* Ambient Particles Layer could go here */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

            {children}
        </motion.div>
    );
};

export const spawnParticles = (x, y, type = 'spark') => {
    const colors = type === 'correct' ? ['#4ADE80', '#22C55E'] : ['#F87171', '#EF4444'];

    confetti({
        particleCount: 15,
        startVelocity: 20,
        spread: 360,
        origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight
        },
        colors: colors,
        disableForReducedMotion: true,
        drift: 0,
        ticks: 50
    });
};
