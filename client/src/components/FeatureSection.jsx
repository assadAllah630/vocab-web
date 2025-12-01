import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import SpotlightCard from './SpotlightCard';

const FeatureSection = ({ title, subtitle, description, component: Component, align = 'left', color = 'indigo' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

    return (
        <section ref={ref} className="flex items-center justify-center py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
            {/* Background Blobs */}
            <div className={`absolute top-1/2 ${align === 'left' ? 'right-0' : 'left-0'} -translate-y-1/2 w-[600px] h-[600px] bg-${color}-500/5 rounded-full blur-3xl -z-10`} />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex flex-col ${align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-start lg:items-center gap-6 sm:gap-8 md:gap-12 lg:gap-16`}>

                    {/* Text Content - Takes less space for natural flow */}
                    <motion.div
                        initial={{ opacity: 0, x: align === 'left' ? -30 : 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full lg:w-5/12 space-y-4 sm:space-y-6"
                    >
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-${color}-50 border border-${color}-100 text-${color}-700 font-bold text-xs uppercase tracking-wide`}>
                            <SparklesIcon className="w-4 h-4" />
                            {subtitle}
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                            {title}
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">
                            {description}
                        </p>

                        <ul className="space-y-3 sm:space-y-4 pt-2">
                            {['Interactive Learning', 'Real-time Feedback', 'AI-Powered'].map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -15 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.1 + (i * 0.08), duration: 0.4 }}
                                    className="flex items-center gap-3 text-slate-700 font-medium text-sm sm:text-base"
                                >
                                    <div className={`p-0.5 rounded-full bg-${color}-100`}>
                                        <CheckCircleIcon className={`w-5 h-5 text-${color}-600`} />
                                    </div>
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Interactive Component - Smaller, more natural */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        style={{ y }}
                        className="w-full lg:w-7/12 relative"
                    >
                        {/* Floating decoration */}
                        <div className={`absolute -inset-4 bg-gradient-to-r from-${color}-500/10 to-${color}-600/10 rounded-3xl blur-2xl opacity-50`}></div>

                        <SpotlightCard className={`relative shadow-2xl shadow-${color}-500/10 rounded-2xl overflow-hidden hover:shadow-${color}-500/20 transition-all duration-500`}>
                            <div className="w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9]">
                                <Component />
                            </div>
                        </SpotlightCard>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default FeatureSection;
