import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/solid';
import ParticleBrain from './ParticleBrain';
import HeroDashboardPreview from './HeroDashboardPreview';
import MobileHeroDashboardPreview from './MobileHeroDashboardPreview';

const RotatingTitle = () => {
    const words = ["Supercharged", "Optimized", "Unleashed", "Intelligent"];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-[1.4em] overflow-hidden inline-block align-bottom relative w-full max-w-[600px] [mask-image:linear-gradient(transparent,black_10%,black_90%,transparent)]">
            <AnimatePresence mode="wait">
                <motion.span
                    key={words[index]}
                    initial={{ y: '100%', opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: '-100%', opacity: 0, filter: "blur(8px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} // Apple-style ease
                    className="absolute top-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text bg-[length:200%_auto] animate-gradient-x py-1"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 pt-32 lg:pt-0">
            {/* Organic Particle Background */}
            <ParticleBrain />

            {/* Content Container */}
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Column: Text */}
                    <div className="text-left">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-indigo-100 shadow-sm mb-8"
                        >
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                            </span>
                            <span className="text-sm font-semibold text-slate-600 tracking-wide">
                                New: AI Story Generation 2.0
                            </span>
                        </motion.div>

                        {/* Main Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 tracking-tighter leading-tight mb-8"
                        >
                            Your Language Brain. <br />
                            <RotatingTitle />
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="text-lg md:text-xl text-slate-600 max-w-xl mb-10 leading-relaxed font-light"
                        >
                            Stop memorizing lists. Start building a neural network for language.
                            VocabMaster uses <span className="font-semibold text-slate-800">adaptive AI</span> to wire fluency directly into your brain.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="flex flex-col sm:flex-row items-start gap-6"
                        >
                            <Link
                                to="/signup"
                                className="group relative px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-full overflow-hidden shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto text-center"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Start Wiring
                                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Link>

                            <Link
                                to="/demo"
                                className="group px-8 py-4 bg-white text-slate-900 text-lg font-bold rounded-full border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <SparklesIcon className="w-5 h-5 text-indigo-500" />
                                See How It Works
                            </Link>
                        </motion.div>
                    </div>

                    {/* Right Column: Flat Pro Simulation */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.5, type: "spring" }}
                        className="relative mt-12 lg:mt-0 pointer-events-none select-none"
                    >
                        {/* Glow Effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-2xl opacity-20 animate-pulse"></div>

                        {/* Desktop Simulation */}
                        <div className="hidden lg:block relative rounded-xl overflow-hidden shadow-2xl border border-slate-200/50 bg-white">
                            <HeroDashboardPreview />
                        </div>

                        {/* Mobile Simulation */}
                        <div className="block lg:hidden w-full flex justify-center px-4 mt-8 md:mt-12">
                            <MobileHeroDashboardPreview />
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </section>
    );
};

export default HeroSection;
