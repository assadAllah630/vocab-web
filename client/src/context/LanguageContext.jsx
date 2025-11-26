import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children, user, setUser }) => {
    const [currentLanguage, setCurrentLanguage] = useState('de'); // Default to German
    const [availableLanguages, setAvailableLanguages] = useState([
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'it', name: 'Italian', flag: '🇮🇹' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' },
        { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
        { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    ]);
    const [loading, setLoading] = useState(true);

    // Initialize from user profile
    useEffect(() => {
        if (user && user.target_language) {
            setCurrentLanguage(user.target_language);
        }
        setLoading(false);
    }, [user]);

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
            // Revert on failure (optional, but good practice)
            if (user) setCurrentLanguage(user.target_language);
        }
    };

    const value = {
        currentLanguage,
        availableLanguages,
        switchLanguage,
        loading
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
