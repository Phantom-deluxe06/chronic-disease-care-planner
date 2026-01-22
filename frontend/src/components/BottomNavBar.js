/**
 * Bottom Navigation Bar Component
 * Fixed bottom nav for mobile devices with 5 key navigation items
 */

import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Home, Droplet, Camera, HeartPulse, BarChart3 } from 'lucide-react';

const BottomNavBar = ({ onScanClick }) => {
    const location = useLocation();
    const { t } = useLanguage();

    const navItems = [
        { path: '/home', icon: Home, label: t('Home') },
        { path: '/dashboard/diabetes', icon: Droplet, label: t('Diabetes') },
        { path: '#scan', icon: Camera, label: t('AI Scan'), isAction: true },
        { path: '/dashboard/hypertension', icon: HeartPulse, label: t('BP') },
        { path: '/reports', icon: BarChart3, label: t('Reports') },
    ];

    const isActive = (path) => {
        if (path === '#scan') return false;
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleClick = (item, e) => {
        if (item.isAction && onScanClick) {
            e.preventDefault();
            onScanClick();
        }
    };

    return (
        <nav className="bottom-nav-bar">
            {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                if (item.isAction) {
                    return (
                        <button
                            key={item.path}
                            className="bottom-nav-item scan-btn"
                            onClick={(e) => handleClick(item, e)}
                            aria-label={item.label}
                        >
                            <span className="nav-icon-wrapper scan-icon-wrapper">
                                <Icon size={24} strokeWidth={2} />
                            </span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    );
                }

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`bottom-nav-item ${active ? 'active' : ''}`}
                        aria-label={item.label}
                    >
                        <span className="nav-icon-wrapper">
                            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                        </span>
                        <span className="nav-label">{item.label}</span>
                        {active && <span className="active-indicator" />}
                    </Link>
                );
            })}
        </nav>
    );
};

export default BottomNavBar;
