import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import api from '../api';
import { isRTLLanguage } from '../utils/bidi';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

// RTL languages list for quick checks
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export const LanguageProvider = ({ children, user, setUser }) => {
    const [currentLanguage, setCurrentLanguage] = useState('de'); // Target language (being learned)
    const [nativeLanguage, setNativeLanguage] = useState('en'); // Native language
    const [availableLanguages, setAvailableLanguages] = useState([
        { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
        { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    ]);
    const [loading, setLoading] = useState(true);

    // RTL computed properties
    const isNativeRTL = useMemo(() =>
        RTL_LANGUAGES.includes(nativeLanguage),
        [nativeLanguage]
    );

    const isTargetRTL = useMemo(() =>
        RTL_LANGUAGES.includes(currentLanguage),
        [currentLanguage]
    );

    const nativeTextDirection = useMemo(() =>
        isNativeRTL ? 'rtl' : 'ltr',
        [isNativeRTL]
    );

    // Initialize from user profile
    useEffect(() => {
        if (user) {
            if (user.target_language) setCurrentLanguage(user.target_language);
            if (user.native_language) setNativeLanguage(user.native_language);
        }
        setLoading(false);
    }, [user]);

    // Automatically update document direction when native language changes
    useEffect(() => {
        const dir = RTL_LANGUAGES.includes(nativeLanguage) ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = nativeLanguage;
    }, [nativeLanguage]);

    const switchLanguage = async (langCode) => {
        try {
            // Optimistic update
            setCurrentLanguage(langCode);

            // Update backend
            if (user) {
                await api.post('update_profile/', {
                    target_language: langCode
                });

                // Update local user object to reflect change
                const updatedUser = { ...user, target_language: langCode };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error("Failed to update language preference:", error);
            // Revert on failure
            if (user) setCurrentLanguage(user.target_language);
        }
    };

    const switchNativeLanguage = async (langCode) => {
        try {
            setNativeLanguage(langCode);

            if (user) {
                await api.post('update_profile/', {
                    native_language: langCode
                });

                const updatedUser = { ...user, native_language: langCode };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error("Failed to update native language:", error);
            if (user) setNativeLanguage(user.native_language);
        }
    };

    const value = {
        // Target language (being learned)
        currentLanguage,
        availableLanguages,
        switchLanguage,
        isTargetRTL,

        // Native language
        nativeLanguage,
        switchNativeLanguage,
        isNativeRTL,
        nativeTextDirection,

        // Utility
        loading,
        RTL_LANGUAGES,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
