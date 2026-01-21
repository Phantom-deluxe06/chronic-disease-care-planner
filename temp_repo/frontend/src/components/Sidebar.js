/**
 * Sidebar Component
 * PC-style navigation sidebar for authenticated pages
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        { path: '/home', label: 'Home', icon: '🏠' },
        { path: '/logs', label: 'Logs', icon: '📋' },
        { path: '/care-plan', label: 'Care Plan', icon: '💊' },
        { path: '/reports', label: 'Reports', icon: '📊' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <span className="logo-icon">💚</span>
                    <span className="logo-text">CarePlanner</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </Link>
                ))}
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
                    <span>🚪</span> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
