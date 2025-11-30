import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const PricingCard = ({ title, price, description, features, isPopular, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className={`relative p-8 rounded-3xl border flex flex-col h-full ${isPopular
                ? 'bg-slate-900/80 border-indigo-500 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl'
                : 'bg-white/50 border-slate-200 shadow-xl backdrop-blur-sm hover:border-indigo-200 transition-colors'
                }`}
        >
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                    Most Popular
                </div>
            )}

            <div className="mb-8">
                <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                <p className={`text-sm ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
            </div>

            <div className="mb-8">
                <span className={`text-4xl font-black ${isPopular ? 'text-white' : 'text-slate-900'}`}>{price}</span>
                {price !== 'Free' && <span className={`text-sm ${isPopular ? 'text-slate-500' : 'text-slate-400'}`}>/month</span>}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                        <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${isPopular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                    </li>
                ))}
            </ul>

            <button className={`w-full py-4 rounded-xl font-bold transition-all transform active:scale-95 ${isPopular
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                }`}>
                {isPopular ? 'Start Pro Trial' : 'Get Started'}
            </button>
        </motion.div>
    );
};

const PricingSection = () => {
    const plans = [
        {
            title: "The Explorer",
            price: "Free",
            description: "Perfect for casual learners.",
            features: [
                "Access to 5 stories per day",
                "Basic vocabulary tracking",
                "Community Arcade access",
                "Ad-supported experience"
            ],
            isPopular: false,
            delay: 0
        },
        {
            title: "The Polyglot",
            price: "$9.99",
            description: "For serious fluency seekers.",
            features: [
                "Unlimited AI Story Generation",
                "Advanced Grammar Organizer",
                "Smart Reader (Unlimited)",
                "Podcast Creator",
                "University-Grade Exams",
                "No Ads"
            ],
            isPopular: true,
            delay: 0.1
        },
        {
            title: "The Guild",
            price: "$29.99",
            description: "For classrooms and groups.",
            features: [
                "Everything in Pro",
                "Up to 5 team members",
                "Team Leaderboard",
                "Progress Analytics Dashboard",
                "Priority Support"
            ],
            isPopular: false,
            delay: 0.2
        }
    ];

    return (
        <section id="pricing" className="py-16 md:py-32 bg-slate-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4"
                    >
                        Invest in Yourself
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 mb-6"
                    >
                        Simple, Transparent Pricing
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-600 max-w-2xl mx-auto"
                    >
                        Start for free, upgrade when you're ready to master the language.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                    {plans.map((plan, idx) => (
                        <PricingCard key={idx} {...plan} />
                    ))}
                </div>
            </div>

            {/* Smooth Transition Gradient */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-black pointer-events-none"></div>
        </section>
    );
};

export default PricingSection;
