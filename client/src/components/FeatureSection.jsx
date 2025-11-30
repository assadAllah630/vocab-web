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

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

    return (
        <section ref={ref} className="lg:min-h-screen flex items-center justify-center py-16 md:py-32 relative overflow-hidden">
            {/* Background Blobs */}
            <div className={`absolute top-1/2 ${align === 'left' ? 'right-0' : 'left-0'} -translate-y-1/2 w-[800px] h-[800px] bg-${color}-500/5 rounded-full blur-3xl -z-10`} />

            <div className="container mx-auto px-4 md:px-6 lg:px-12">
                <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${align === 'right' ? 'lg:flex-row-reverse' : ''}`}>

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 space-y-8"
                    >
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${color}-50 border border-${color}-100 text-${color}-700 font-bold text-sm uppercase tracking-wide shadow-sm`}>
                            <SparklesIcon className="w-5 h-5" />
                            {subtitle}
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight tracking-tight">
                            {title}
                        </h2>
                        <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
                            {description}
                        </p>

                        <ul className="space-y-5">
                            {['Interactive Learning', 'Real-time Feedback', 'AI-Powered'].map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                                    className="flex items-center gap-4 text-slate-700 font-medium text-lg"
                                >
                                    <div className={`p-1 rounded-full bg-${color}-100`}>
                                        <CheckCircleIcon className={`w-6 h-6 text-${color}-600`} />
                                    </div>
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Interactive Component */}
                    <motion.div
                        style={{ y }}
                        className="flex-1 w-full max-w-3xl perspective-1000"
                    >
                        <SpotlightCard className={`shadow-2xl shadow-${color}-500/20 transform transition-transform hover:rotate-y-1 hover:rotate-x-1 duration-700`}>
                            <div className="min-h-[400px] lg:min-h-0 lg:aspect-[16/9] h-full">
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
