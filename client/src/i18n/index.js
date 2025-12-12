/**
 * i18n - Translation System
 * Uses native language from LanguageContext to display UI in user's language
 */

import { en } from './en';
import { ar } from './ar';
import { de } from './de';
import { ru } from './ru';

// All translations
export const translations = {
    en,
    ar,
    de,
    ru,
};

/**
 * Get translation for a key
 * @param {string} lang - Language code (en, ar, de, ru)
 * @param {string} key - Translation key
 * @returns {string} - Translated string or key if not found
 */
export const t = (lang, key) => {
    const langTranslations = translations[lang] || translations.en;
    return langTranslations[key] || translations.en[key] || key;
};

/**
 * Get all translations for a language
 * @param {string} lang - Language code
 * @returns {object} - All translations for that language
 */
export const getTranslations = (lang) => {
    return translations[lang] || translations.en;
};

export default translations;
