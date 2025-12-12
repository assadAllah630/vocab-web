/**
 * Bidirectional Text Utilities
 * Handles mixed RTL/LTR content without reading conflicts
 */

// RTL character ranges: Arabic, Hebrew, Persian, Urdu
const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;

// LTR character ranges: Latin, extended Latin
const LTR_REGEX = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/;

// RTL language codes
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Check if a language code represents an RTL language
 */
export const isRTLLanguage = (langCode) => {
    return RTL_LANGUAGES.includes(langCode?.toLowerCase());
};

/**
 * Detect if text contains RTL characters (Arabic, Hebrew, etc.)
 */
export const containsRTL = (text) => {
    if (!text || typeof text !== 'string') return false;
    return RTL_REGEX.test(text);
};

/**
 * Detect if text contains LTR characters (Latin, etc.)
 */
export const containsLTR = (text) => {
    if (!text || typeof text !== 'string') return false;
    return LTR_REGEX.test(text);
};

/**
 * Check if text contains both RTL and LTR characters (mixed direction)
 */
export const isMixedDirection = (text) => {
    return containsRTL(text) && containsLTR(text);
};

/**
 * Get the primary direction of text based on first strong character
 */
export const getTextDirection = (text) => {
    if (!text) return 'ltr';

    for (const char of text) {
        if (RTL_REGEX.test(char)) return 'rtl';
        if (LTR_REGEX.test(char)) return 'ltr';
    }

    return 'ltr'; // Default to LTR if no strong characters found
};

/**
 * Get direction based on language code
 */
export const getDirection = (langCode) => {
    return isRTLLanguage(langCode) ? 'rtl' : 'ltr';
};

/**
 * Get text alignment based on language code
 */
export const getTextAlign = (langCode) => {
    return isRTLLanguage(langCode) ? 'right' : 'left';
};

/**
 * Get CSS styles for proper BiDi text isolation
 */
export const getBidiStyle = (direction) => ({
    direction: direction || 'ltr',
    unicodeBidi: 'isolate',
});

/**
 * Get styles for translation display based on native language
 */
export const getTranslationStyle = (nativeLang) => {
    const isRTL = isRTLLanguage(nativeLang);
    return {
        direction: isRTL ? 'rtl' : 'ltr',
        textAlign: isRTL ? 'right' : 'left',
        unicodeBidi: 'isolate',
        fontFamily: isRTL ? "'Cairo', 'Noto Sans Arabic', sans-serif" : 'inherit',
        lineHeight: isRTL ? 1.8 : 1.6, // Arabic needs more line height
    };
};

/**
 * Get styles for auto-detected text direction
 */
export const getAutoDirectionStyle = (text) => {
    const hasRTL = containsRTL(text);
    const hasMixed = isMixedDirection(text);

    if (hasMixed) {
        return {
            unicodeBidi: 'plaintext', // Let browser handle mixed content
        };
    }

    return {
        direction: hasRTL ? 'rtl' : 'ltr',
        textAlign: hasRTL ? 'right' : 'left',
        unicodeBidi: 'isolate',
        fontFamily: hasRTL ? "'Cairo', 'Noto Sans Arabic', sans-serif" : 'inherit',
    };
};

/**
 * Get appropriate font family based on text content
 */
export const getFontFamily = (text, defaultFont = 'inherit') => {
    if (containsRTL(text)) {
        return "'Cairo', 'Noto Sans Arabic', sans-serif";
    }
    return defaultFont;
};

export default {
    RTL_LANGUAGES,
    isRTLLanguage,
    containsRTL,
    containsLTR,
    isMixedDirection,
    getTextDirection,
    getDirection,
    getTextAlign,
    getBidiStyle,
    getTranslationStyle,
    getAutoDirectionStyle,
    getFontFamily,
};
