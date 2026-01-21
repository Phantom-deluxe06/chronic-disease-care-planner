/**
 * Mobile Navigation Component
 * Hamburger menu with slide-out drawer for mobile devices
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Home, Droplet, HeartPulse, ClipboardList, BarChart3, Settings, LogOut, X, Menu, User as UserIcon } from 'lucide-react';

const MobileNav = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { t } = useLanguage();

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
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
                    <span className="brand-text">HealthBuddy</span>
                </div>
                <div className="mobile-header-spacer"></div>
            </header>

            {/* Overlay */}
            <div
                className={`nav-overlay ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Slide-out Drawer */}
            <nav className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <div className="drawer-brand">
                        <img src="/logo192.png" alt="Health Buddy" className="brand-logo-img" />
                        <span className="brand-text">HealthBuddy</span>
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
        </>
    );
};

export default MobileNav;
