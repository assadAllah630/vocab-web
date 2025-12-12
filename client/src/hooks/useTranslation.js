/**
 * useTranslation Hook
 * Provides translated strings based on user's native language
 */

import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { t, getTranslations } from '../i18n';

/**
 * Hook for accessing translations in components
 * @returns {object} - { t: function, translations: object, lang: string }
 */
export const useTranslation = () => {
    const { nativeLanguage } = useLanguage();

    // Memoize translations to prevent unnecessary re-renders
    const translations = useMemo(() =>
        getTranslations(nativeLanguage),
        [nativeLanguage]
    );

    // Translation function bound to current language
    const translate = useMemo(() =>
        (key) => t(nativeLanguage, key),
        [nativeLanguage]
    );

    return {
        t: translate,           // t('home') -> 'الرئيسية'
        translations,           // Access all translations directly
        lang: nativeLanguage,   // Current language code
    };
};

export default useTranslation;
