/**
 * Mobile Navigation Component
 * Hamburger menu with slide-out drawer for mobile devices
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileNav = ({ user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

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
        { path: '/home', icon: '🏠', label: 'Home' },
        { path: '/dashboard/diabetes', icon: '🩸', label: 'Diabetes' },
        { path: '/dashboard/hypertension', icon: '💓', label: 'Hypertension' },
        { path: '/logs', icon: '📊', label: 'Health Logs' },
        { path: '/reports', icon: '📈', label: 'Reports' },
        { path: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <>
            {/* Mobile Header - Always visible on mobile */}
            <header className="mobile-header">
                <button
                    className="hamburger-btn"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
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
                        aria-label="Close menu"
                    >
                        ✕
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
                            <div className="user-avatar">👤</div>
                            <div className="user-info">
                                <span className="user-name">{user.name || 'User'}</span>
                                <span className="user-email">{user.email}</span>
                            </div>
                        </div>
                    )}
                    <button className="drawer-logout-btn" onClick={onLogout}>
                        🚪 Sign Out
                    </button>
                </div>
            </nav>
        </>
    );
};

export default MobileNav;
