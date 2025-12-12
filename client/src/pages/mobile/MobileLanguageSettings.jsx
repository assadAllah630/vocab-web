import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Check, ChevronRight } from 'lucide-react';
import api from '../../api';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' }
];

const MobileLanguageSettings = ({ user, setUser }) => {
    const navigate = useNavigate();
    const {
        currentLanguage,
        nativeLanguage: contextNativeLang,
        switchLanguage,
        switchNativeLanguage,
        isNativeRTL
    } = useLanguage();
    const { t } = useTranslation();

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('de');
    const [showNativePicker, setShowNativePicker] = useState(false);
    const [showTargetPicker, setShowTargetPicker] = useState(false);

    useEffect(() => {
        // Initialize from context or user profile
        setNativeLang(contextNativeLang || user?.profile?.native_language || 'en');
        setTargetLang(currentLanguage || user?.profile?.target_language || 'de');
    }, [contextNativeLang, currentLanguage, user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Use context functions for proper RTL updates
            if (nativeLang !== contextNativeLang) {
                await switchNativeLanguage(nativeLang);
            }
            if (targetLang !== currentLanguage) {
                await switchLanguage(targetLang);
            }

            // Update document direction based on native language
            const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];
            document.documentElement.dir = RTL_LANGUAGES.includes(nativeLang) ? 'rtl' : 'ltr';

            setSaved(true);
            setTimeout(() => navigate(-1), 1000);
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getLanguage = (code) => LANGUAGES.find(l => l.code === code) || LANGUAGES[0];

    const LanguagePicker = ({ selected, onSelect, onClose, title }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="w-full rounded-t-3xl p-5 pb-10"
                style={{ backgroundColor: '#18181B' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: '#3F3F46' }} />
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#FAFAFA' }}>{title}</h3>
                <div className="space-y-2">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                onSelect(lang.code);
                                onClose();
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-xl"
                            style={{
                                backgroundColor: selected === lang.code ? '#6366F120' : '#141416',
                                border: selected === lang.code ? '1px solid #6366F1' : '1px solid #27272A'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="font-medium" style={{ color: '#FAFAFA' }}>{lang.name}</span>
                            </div>
                            {selected === lang.code && (
                                <Check size={20} style={{ color: '#6366F1' }} />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
            {/* Header */}
            <div
                className="sticky top-0 z-20 px-4 py-4 flex items-center justify-between"
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
                    {t('languageSettings')}
                </h1>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="px-4 py-2 rounded-xl font-medium text-sm"
                    style={{
                        background: saved ? '#22C55E' : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    {saving ? t('saving') : saved ? t('saved') : t('save')}
                </motion.button>
            </div>

            <div className="px-5 pt-6">
                {/* Info */}
                <div
                    className="rounded-xl p-4 mb-6 flex items-start gap-3"
                    style={{ backgroundColor: '#6366F110', border: '1px solid #6366F130' }}
                >
                    <Globe size={20} style={{ color: '#6366F1' }} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm" style={{ color: '#A1A1AA' }}>
                        {t('languageInfo')}
                    </p>
                </div>

                {/* Language Cards */}
                <div className="space-y-4">
                    {/* Native Language */}
                    <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#71717A' }}>
                            {t('iSpeak')}
                        </label>
                        <button
                            onClick={() => setShowNativePicker(true)}
                            className="w-full flex items-center justify-between p-4 rounded-xl"
                            style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getLanguage(nativeLang).flag}</span>
                                <span className="font-medium" style={{ color: '#FAFAFA' }}>
                                    {getLanguage(nativeLang).name}
                                </span>
                            </div>
                            <ChevronRight size={20} style={{ color: '#52525B' }} />
                        </button>
                    </div>

                    {/* Target Language */}
                    <div>
                        <label className="text-sm font-medium mb-2 block" style={{ color: '#71717A' }}>
                            {t('imLearning')}
                        </label>
                        <button
                            onClick={() => setShowTargetPicker(true)}
                            className="w-full flex items-center justify-between p-4 rounded-xl"
                            style={{ backgroundColor: '#18181B', border: '1px solid #27272A' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getLanguage(targetLang).flag}</span>
                                <span className="font-medium" style={{ color: '#FAFAFA' }}>
                                    {getLanguage(targetLang).name}
                                </span>
                            </div>
                            <ChevronRight size={20} style={{ color: '#52525B' }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Pickers */}
            {
                showNativePicker && (
                    <LanguagePicker
                        selected={nativeLang}
                        onSelect={setNativeLang}
                        onClose={() => setShowNativePicker(false)}
                        title="Select Native Language"
                    />
                )
            }
            {
                showTargetPicker && (
                    <LanguagePicker
                        selected={targetLang}
                        onSelect={setTargetLang}
                        onClose={() => setShowTargetPicker(false)}
                        title="Select Target Language"
                    />
                )
            }
        </div >
    );
};

export default MobileLanguageSettings;
