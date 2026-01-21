/**
 * SidebarRail Component
 * Mini-sidebar that expands on hover with Lucide React icons
 * Includes LanguageSelector for multilingual support
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Droplet,
    HeartPulse,
    ClipboardList,
    BarChart3,
    Settings,
    LogOut,
    User
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';
import './SidebarRail.css';

const SidebarRail = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { path: '/home', label: 'Overview', icon: LayoutDashboard },
        { path: '/dashboard/diabetes', label: 'Diabetes', icon: Droplet },
        { path: '/dashboard/hypertension', label: 'Hypertension', icon: HeartPulse },
        { path: '/logs', label: 'Health Logs', icon: ClipboardList },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const isActive = (path) => {
        if (path === '/home') {
            return location.pathname === '/home' || location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="sidebar-rail group">
            {/* Logo */}
            <div className="rail-logo">
                <img src="/logo192.png" alt="Health Buddy" className="rail-logo-img" />
                <span className="rail-logo-text">HealthBuddy</span>
            </div>

            {/* Language Selector - visible when expanded */}
            <div className="rail-language">
                <LanguageSelector />
            </div>

            {/* Navigation */}
            <nav className="rail-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`rail-nav-item ${active ? 'active' : ''}`}
                            title={t(item.label)}
                        >
                            <span className="rail-nav-icon">
                                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                            </span>
                            <span className="rail-nav-label">{t(item.label)}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="rail-footer">
                <div className="rail-user">
                    <div className="rail-user-avatar">
                        <User size={18} />
                    </div>
                    <div className="rail-user-info">
                        <span className="rail-user-name">{user?.name || 'User'}</span>
                        <span className="rail-user-email">{user?.email || ''}</span>
                    </div>
                </div>
                <button className="rail-logout" onClick={handleLogout} title={t('Sign Out')}>
                    <LogOut size={20} />
                    <span className="rail-logout-text">{t('Sign Out')}</span>
                </button>
            </div>
        </aside>
    );
};

export default SidebarRail;
