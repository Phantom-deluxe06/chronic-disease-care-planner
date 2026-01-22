/**
 * Mobile Navigation Component
 * Top header with brand + actions, and Bottom Navigation Bar
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import BottomNavBar from './BottomNavBar';
import { Home, Droplet, HeartPulse, ClipboardList, BarChart3, Settings, LogOut, X, Menu, User as UserIcon, Globe } from 'lucide-react';

const MobileNav = ({ user, onLogout, onScanClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const location = useLocation();
    const { t, language, setLanguage } = useLanguage();

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
        setShowLanguageMenu(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const navLinks = [
        { path: '/home', icon: <Home size={20} />, label: t('Home') },
        { path: '/dashboard/diabetes', icon: <Droplet size={20} />, label: t('Diabetes') },
        { path: '/dashboard/hypertension', icon: <HeartPulse size={20} />, label: t('Hypertension') },
        { path: '/logs', icon: <ClipboardList size={20} />, label: t('Health Logs') },
        { path: '/reports', icon: <BarChart3 size={20} />, label: t('Reports') },
        { path: '/settings', icon: <Settings size={20} />, label: t('Settings') },
    ];

    const languages = [
        { code: 'en', label: 'EN', name: 'English' },
        { code: 'ta', label: 'த', name: 'தமிழ்' },
        { code: 'hi', label: 'हि', name: 'हिंदी' },
    ];

    const currentLang = languages.find(l => l.code === language) || languages[0];

    const handleLanguageChange = (langCode) => {
        setLanguage(langCode);
        setShowLanguageMenu(false);
    };

    return (
        <>
            {/* Mobile Header - Always visible on mobile */}
            <header className="mobile-header">
                <button
                    className="hamburger-btn"
                    onClick={() => setIsOpen(true)}
                    aria-label={t('Open menu')}
                >
                    <Menu size={24} color="#06B6D4" />
                </button>
                <div className="mobile-brand">
                    <img src="/logo192.png" alt="Health Buddy" className="brand-logo-img" />
                    <span className="brand-text">Health Buddy</span>
                </div>
                <div className="mobile-header-actions">
                    {/* Language Selector */}
                    <div className="language-selector-mobile">
                        <button
                            className="language-btn-mobile"
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            aria-label={t('Change language')}
                        >
                            {currentLang.label}
                        </button>
                        {showLanguageMenu && (
                            <div className="language-dropdown-mobile">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        className={`language-option ${language === lang.code ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange(lang.code)}
                                    >
                                        <span className="lang-label">{lang.label}</span>
                                        <span className="lang-name">{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Profile Icon */}
                    <Link to="/settings" className="profile-btn-mobile">
                        <UserIcon size={18} />
                    </Link>
                </div>
            </header>

            {/* Overlay */}
            <div
                className={`nav-overlay ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Slide-out Drawer (for Settings, Logs, etc.) */}
            <nav className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div className="drawer-brand">
                        <img src="/logo192.png" alt="Health Buddy" className="brand-logo-img" />
                        <span className="brand-text">Health Buddy</span>
                    </div>
                    <button
                        className="close-drawer-btn"
                        onClick={() => setIsOpen(false)}
                        aria-label={t('Close menu')}
                    >
                        <X size={24} color="#06B6D4" />
                    </button>
                </div>

                <div className="drawer-nav">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`drawer-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            <span className="nav-label">{link.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="drawer-footer">
                    {user && (
                        <div className="drawer-user">
                            <div className="user-avatar">
                                <UserIcon size={20} color="#06B6D4" />
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user.name || t('User')}</span>
                                <span className="user-email">{user.email}</span>
                            </div>
                        </div>
                    )}
                    <button className="drawer-logout-btn" onClick={onLogout}>
                        <LogOut size={18} style={{ marginRight: '8px' }} /> {t('Sign Out')}
                    </button>
                </div>
            </nav>

            {/* Bottom Navigation Bar */}
            <BottomNavBar onScanClick={onScanClick} />
        </>
    );
};

export default MobileNav;
