/**
 * LanguageSelector - Dropdown for selecting UI language
 * Supports English, Tamil (தமிழ்), and Hindi (हिन्दी)
 * Dropdown opens to the RIGHT to avoid sidebar overflow
 */

import { useState, useRef, useEffect } from 'react';
import { Languages, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = () => {
    const { language, setLanguage, isTranslating } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                triggerRef.current && !triggerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Position dropdown to the LEFT of the trigger (changed from right)
            setDropdownStyle({
                top: `${rect.top}px`,
                right: `${window.innerWidth - rect.left + 8}px`, // 8px gap from trigger, aligned to left edge
            });
        }
    }, [isOpen]);

    const handleLanguageSelect = (langCode) => {
        setLanguage(langCode);
        setIsOpen(false);
    };

    const currentLang = LANGUAGES[language];

    return (
        <div className="language-selector" ref={dropdownRef}>
            <button
                ref={triggerRef}
                className="language-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select language"
            >
                {isTranslating ? (
                    <Loader2 size={18} className="spinner" />
                ) : (
                    <Languages size={18} />
                )}
                <span className="language-current">{currentLang.native}</span>
                <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="language-dropdown"
                    style={dropdownStyle}
                >
                    {Object.values(LANGUAGES).map((lang) => (
                        <button
                            key={lang.code}
                            className={`language-option ${language === lang.code ? 'active' : ''}`}
                            onClick={() => handleLanguageSelect(lang.code)}
                        >
                            <span className="lang-native">{lang.native}</span>
                            <span className="lang-name">{lang.name}</span>
                            {language === lang.code && <Check size={16} className="check-icon" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
