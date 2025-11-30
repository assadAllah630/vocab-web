import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
    SparklesIcon, GlobeAltIcon,
    BoltIcon, CheckCircleIcon, ChartBarIcon,
    ChevronDownIcon, ArrowRightIcon
} from '@heroicons/react/24/solid';

// Import individual simulation components
import {
    SimulatedStoryViewer,
    SimulatedDialogueViewer,
    SimulatedExam,
    SimulatedGrammar
} from '../components/AppSimulation';
import ArcadeSection from '../components/ArcadeSection';
import SmartReaderDemo from '../components/SmartReaderDemo';
import PodcastDemo from '../components/PodcastDemo';
import StatsDemo from '../components/StatsDemo';
import PricingSection from '../components/PricingSection';
import HeroSection from '../components/HeroSection';

const FeatureSection = ({ title, subtitle, description, component: Component, align = 'left', color = 'indigo' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

    return (
        <section ref={ref} className="min-h-screen flex items-center justify-center py-32 relative overflow-hidden">
            {/* Background Blobs */}
            <div className={`absolute top-1/2 ${align === 'left' ? 'right-0' : 'left-0'} -translate-y-1/2 w-[800px] h-[800px] bg-${color}-500/5 rounded-full blur-3xl -z-10`} />

            <div className="container mx-auto px-6 lg:px-12">
                <div className={`flex flex-col lg:flex-row items-center gap-20 ${align === 'right' ? 'lg:flex-row-reverse' : ''}`}>

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
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
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.4 + (i * 0.1), duration: 0.5 }}
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
                        <div className={`relative rounded-3xl shadow-2xl shadow-${color}-500/20 border border-slate-200 bg-white overflow-hidden transform transition-transform hover:rotate-y-1 hover:rotate-x-1 duration-700`}>
                            <div className="aspect-[16/10] md:aspect-[16/9]">
                                <Component />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();

    // Redirect to dashboard if user is already logged in
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
            try {
                const user = JSON.parse(storedUser);
                // Check if user has valid data (username is required)
                if (user && user.username) {
                    navigate('/dashboard');
                    return;
                }
            } catch (error) {
                console.error('Failed to parse user data:', error);
                // Clear invalid user data
                localStorage.removeItem('user');
            }
        }

        // Initialize AOS animations
        AOS.init({
            duration: 1000,
            once: true,
            easing: 'ease-out-cubic',
        });
    }, [navigate]);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="bg-white overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
            {/* Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Navbar */}
            <nav className="fixed w-full z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all duration-300">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">V</div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">VocabMaster</span>
                    </div>
                    <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-500">
                        <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#arcade" className="hover:text-indigo-600 transition-colors">Arcade</a>
                        <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Log in</Link>
                        <Link to="/signup" className="px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-all hover:scale-105 shadow-xl shadow-slate-900/20">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <HeroSection />

            {/* Trusted By Section (Placeholder for Social Proof) */}
            <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by language learners from</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Mock Logos */}
                        {['Harvard', 'Duolingo', 'Babbel', 'Google', 'TechCrunch'].map((logo, i) => (
                            <span key={i} className="text-2xl font-black text-slate-800">{logo}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature 1: Story Mode */}
            <FeatureSection
                title="One Click. Infinite Worlds."
                subtitle="Stories • Dialogues • Articles"
                description="Why wait for a textbook? Generate custom stories, articles, and dialogues in seconds. Your topics, your level, your obsession. It's not just reading; it's living the language."
                component={SimulatedStoryViewer}
                align="left"
                color="indigo"
            />

            {/* Feature 2: Dialogue Generator */}
            <FeatureSection
                title="Talk to Anyone. Anywhere."
                subtitle="AI Dialogue Generator"
                description="Create realistic conversations on any topic. From ordering coffee in Paris to business negotiations in Tokyo. Practice speaking, not just reading."
                component={SimulatedDialogueViewer}
                align="right"
                color="purple"
            />

            {/* Feature 3: Smart Exam */}
            <FeatureSection
                title="University-Grade Exams"
                subtitle="Scientific Spaced Repetition"
                description="We don't do basic quizzes. We generate rigorous, multi-format exams that challenge you like a university professor. Powered by the world's best algorithm that knows exactly when you'll forget."
                component={SimulatedExam}
                align="left"
                color="green"
            />

            {/* Feature 4: Grammar */}
            <FeatureSection
                title="The AI Grammar Organizer"
                subtitle="Notion-Style • Instantly Generated"
                description="Just type a topic, and our AI generates a concise, beautiful guide with tables and graphs. It's a Notion-style page that writes itself. Read the explanation, then click to generate examples or test your knowledge instantly."
                component={SimulatedGrammar}
                align="right"
                color="pink"
            />

            {/* Smart Reader Section */}
            <FeatureSection
                title="Instant Analysis"
                subtitle="Smart Reader"
                description="Turn any text into a lesson. Our AI scans articles, books, or documents, highlighting words you don't know and explaining complex grammar instantly."
                component={SmartReaderDemo}
                align="left"
                color="cyan"
            />

            {/* Arcade Section */}
            <div id="arcade" className="py-20">
                <ArcadeSection />
            </div>

            {/* CTA Section */}
            <section className="py-32 bg-slate-50 border-t border-slate-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-24">
                        <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Beyond Vocabulary</h3>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">Complete tools for total language immersion. Everything you need to go from beginner to fluent.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
                        {/* Podcast Creator Feature */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="bg-white rounded-[2rem] p-10 shadow-2xl border border-slate-100 h-full hover:shadow-3xl transition-shadow duration-500">
                                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-8">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                                        <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                                    </svg>
                                </div>
                                <h4 className="text-3xl font-bold text-slate-900 mb-4">Podcast Creator</h4>
                                <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                                    Turn any text into a high-quality audio lesson. Listen on your commute, at the gym, or while cooking.
                                </p>
                                <PodcastDemo />
                            </div>
                        </motion.div>

                        {/* Analytics Feature */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="bg-white rounded-[2rem] p-10 shadow-2xl border border-slate-100 h-full hover:shadow-3xl transition-shadow duration-500">
                                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-8">
                                    <ChartBarIcon className="w-8 h-8" />
                                </div>
                                <h4 className="text-3xl font-bold text-slate-900 mb-4">Deep Analytics</h4>
                                <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                                    Track every word, every session, and every milestone. Watch your fluency grow with detailed insights.
                                </p>
                                <StatsDemo />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <PricingSection />

            {/* Final CTA - "Warp Speed" Design */}
            <section className="relative py-40 overflow-hidden bg-black">
                {/* Animated Background Mesh */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-75"></div>
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]"></div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                    >
                        <h2 className="text-7xl md:text-9xl font-black text-white mb-8 tracking-tighter leading-none mix-blend-screen">
                            THE FUTURE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">IS FLUENT</span>
                        </h2>
                        <p className="text-2xl md:text-3xl text-slate-400 mb-16 max-w-3xl mx-auto font-light tracking-wide">
                            Join the evolution of language learning. <br />
                            <span className="text-white font-medium">10,000+ pioneers</span> are already there.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                            <Link to="/signup" className="group relative inline-flex items-center justify-center px-12 py-6 bg-white text-black text-xl font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]">
                                <span className="relative z-10 flex items-center gap-2">
                                    Start Evolution
                                    <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Link>
                            <span className="text-slate-500 text-sm font-mono uppercase tracking-widest">No Credit Card Required</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer - "Mega Grid" Design */}
            <footer className="bg-black border-t border-slate-900 pt-20 pb-10 overflow-hidden relative">
                <div className="container mx-auto px-6 lg:px-12 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-24">
                        <div className="col-span-2 lg:col-span-2 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-2xl">V</div>
                                <span className="text-2xl font-bold text-white tracking-tight">VocabMaster</span>
                            </div>
                            <p className="text-slate-500 max-w-xs text-lg leading-relaxed">
                                Engineering the world's most advanced language learning engine.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all">
                                    <GlobeAltIcon className="w-5 h-5" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-white hover:text-black transition-all">
                                    <BoltIcon className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-8">Product</h4>
                            <ul className="space-y-4 text-slate-400 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Arcade Mode</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Smart Reader</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-8">Company</h4>
                            <ul className="space-y-4 text-slate-400 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Manifesto</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div className="col-span-2 lg:col-span-2">
                            <h4 className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-8">System Status</h4>
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-slate-400 text-sm">AI Core</span>
                                    <span className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Online
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">Learning Engine</span>
                                    <span className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Operational
                                    </span>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-800">
                                    <div className="text-xs text-slate-600 font-mono">
                                        v2.4.0-beta • Server: US-East
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-900 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-slate-600 text-sm font-mono">© 2024 VocabMaster Inc. All rights reserved.</p>
                        <div className="flex gap-8 text-sm text-slate-600 font-mono">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Security</a>
                        </div>
                    </div>
                </div>

                {/* Giant Watermark */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 text-[20vw] font-black text-white/[0.02] pointer-events-none select-none whitespace-nowrap">
                    VOCABMASTER
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
