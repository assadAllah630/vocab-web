import React from 'react';
import { containsRTL, isMixedDirection, isRTLLanguage, getAutoDirectionStyle } from '../utils/bidi';

/**
 * BiDiText - Renders text with proper bidirectional isolation
 * 
 * Handles:
 * - Pure RTL text (Arabic, Hebrew)
 * - Pure LTR text (English, German)
 * - Mixed direction text (German with Arabic translations)
 * 
 * @param {string} text - The text content to render
 * @param {string} lang - Optional language code (auto-detected if not provided)
 * @param {string} className - Additional CSS classes
 * @param {string} as - HTML element to render as (default: 'span')
 */
const BiDiText = ({
    text,
    lang,
    className = '',
    as: Component = 'span',
    showBadge = false,
    ...props
}) => {
    if (!text && text !== 0) return null;

    const textStr = String(text);

    // Determine direction: explicit lang > auto-detect
    const isRTL = lang ? isRTLLanguage(lang) : containsRTL(textStr);
    const hasMixed = isMixedDirection(textStr);

    // Get language badge if needed
    const getBadge = () => {
        if (!showBadge || !lang) return null;

        const badgeClass = {
            ar: 'lang-badge-ar',
            de: 'lang-badge-de',
            en: 'lang-badge-en',
            ru: 'lang-badge-ru',
        }[lang] || '';

        const badgeText = {
            ar: 'AR',
            de: 'DE',
            en: 'EN',
            ru: 'RU',
        }[lang] || lang.toUpperCase();

        return (
            <span className={`lang-badge ${badgeClass}`}>
                {badgeText}
            </span>
        );
    };

    // For mixed content, use <bdi> for automatic isolation
    if (hasMixed && !lang) {
        return (
            <Component
                className={`bidi-isolate ${className}`}
                {...props}
            >
                {showBadge && getBadge()}
                <bdi>{textStr}</bdi>
            </Component>
        );
    }

    // For pure RTL or LTR with known direction
    const style = getAutoDirectionStyle(textStr);

    return (
        <Component
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`${isRTL ? 'rtl-text' : 'ltr-text'} ${className}`}
            style={style}
            {...props}
        >
            {showBadge && getBadge()}
            {textStr}
        </Component>
    );
};

/**
 * BiDiParagraph - For longer text blocks with automatic direction
 */
export const BiDiParagraph = ({ children, className = '', ...props }) => {
    const text = typeof children === 'string' ? children : '';

    return (
        <p
            className={`bidi-plaintext ${className}`}
            style={{ unicodeBidi: 'plaintext' }}
            {...props}
        >
            {children}
        </p>
    );
};

/**
 * BiDiTableCell - Smart table cell with auto-direction
 */
export const BiDiTableCell = ({ children, as: Component = 'td', className = '', ...props }) => {
    const text = typeof children === 'string' ? children :
        React.Children.toArray(children).join('');
    const isRTL = containsRTL(text);

    return (
        <Component
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`${isRTL ? 'rtl-text' : ''} ${className}`}
            style={{
                unicodeBidi: 'isolate',
                textAlign: isRTL ? 'right' : 'left',
            }}
            {...props}
        >
            {children}
        </Component>
    );
};

/**
 * TranslationText - Specifically for translation display
 */
export const TranslationText = ({ text, nativeLanguage = 'en', className = '', ...props }) => {
    const isRTL = isRTLLanguage(nativeLanguage);

    return (
        <span
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`${isRTL ? 'translation-arabic' : ''} ${className}`}
            style={{
                direction: isRTL ? 'rtl' : 'ltr',
                textAlign: isRTL ? 'right' : 'left',
                unicodeBidi: 'isolate',
                fontFamily: isRTL ? "'Cairo', 'Noto Sans Arabic', sans-serif" : 'inherit',
                lineHeight: isRTL ? 1.8 : 1.6,
            }}
            {...props}
        >
            {text}
        </span>
    );
};

export default BiDiText;
