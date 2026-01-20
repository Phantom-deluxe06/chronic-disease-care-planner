/**
 * Sidebar Component
 * PC-style navigation sidebar for authenticated pages
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FiHome, FiFileText, FiHeart, FiBarChart2, FiSettings, FiLogOut
} from 'react-icons/fi';
import { MdMedication } from 'react-icons/md';

const Sidebar = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        { path: '/home', label: 'Home', icon: FiHome },
        { path: '/logs', label: 'Logs', icon: FiFileText },
        { path: '/care-plan', label: 'Care Plan', icon: MdMedication },
        { path: '/reports', label: 'Reports', icon: FiBarChart2 },
        { path: '/settings', label: 'Settings', icon: FiSettings },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/logo192.png" alt="Health Buddy" className="brand-logo-img" />
                    <span className="logo-text">HealthBuddy</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon"><Icon /></span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                        <p className="user-name">{user?.name || 'User'}</p>
                        <p className="user-email">{user?.email || 'user@example.com'}</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <FiLogOut /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
