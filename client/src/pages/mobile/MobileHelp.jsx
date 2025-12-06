import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MessageCircle, FileText, ExternalLink, Zap } from 'lucide-react';

const MobileHelp = () => {
    const navigate = useNavigate();

    const helpItems = [
        {
            icon: Zap,
            title: 'Getting Started',
            description: 'Learn how to add words, practice vocabulary, and track your progress'
        },
        {
            icon: FileText,
            title: 'FAQs',
            description: 'Answers to commonly asked questions about VocabMaster'
        },
        {
            icon: MessageCircle,
            title: 'Contact Support',
            description: 'Get help from our support team',
            action: () => window.open('mailto:support@vocabmaster.app', '_blank')
        }
    ];

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div
                className="sticky top-0 z-20 px-4 py-4 flex items-center gap-4"
                style={{
                    backgroundColor: 'rgba(10, 10, 11, 0.9)',
                    backdropFilter: 'blur(10px)',
                    paddingTop: 'env(safe-area-inset-top, 16px)'
                }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-xl"
                    style={{ backgroundColor: '#18181B' }}
                >
                    <ArrowLeft size={20} style={{ color: '#A1A1AA' }} />
                </button>
                <h1 className="text-lg font-semibold" style={{ color: '#FAFAFA' }}>
                    Help & Support
                </h1>
            </div>

            <div className="px-5 pt-6">
                {/* Header Card */}
                <div
                    className="rounded-2xl p-6 mb-6 text-center"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                >
                    <h2 className="text-xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
                        How can we help?
                    </h2>
                    <p className="text-sm opacity-90" style={{ color: '#FFFFFF' }}>
                        Find answers to your questions or contact our support team
                    </p>
                </div>

                {/* Help Items */}
                <div className="space-y-3">
                    {helpItems.map((item, index) => (
                        <motion.button
                            key={index}
                            whileTap={{ scale: 0.98 }}
                            onClick={item.action}
                            className="w-full flex items-start gap-4 p-4 rounded-xl text-left"
                            style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: '#6366F115' }}
                            >
                                <item.icon size={20} style={{ color: '#6366F1' }} />
                            </div>
                            <div>
                                <h3 className="font-medium mb-1" style={{ color: '#FAFAFA' }}>
                                    {item.title}
                                </h3>
                                <p className="text-sm" style={{ color: '#71717A' }}>
                                    {item.description}
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Contact Email */}
                <div className="mt-8 text-center">
                    <p className="text-sm mb-2" style={{ color: '#71717A' }}>
                        Need more help?
                    </p>
                    <a
                        href="mailto:support@vocabmaster.app"
                        className="inline-flex items-center gap-2 text-sm font-medium"
                        style={{ color: '#6366F1' }}
                    >
                        <Mail size={16} />
                        support@vocabmaster.app
                    </a>
                </div>
            </div>
        </div>
    );
};

export default MobileHelp;
