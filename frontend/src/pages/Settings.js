/**
 * Settings Page
 * User preferences and account settings
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Settings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        glucoseUnit: 'mg/dL',
        reminderEnabled: true,
        darkMode: true,
        language: 'en'
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(storedUser));
        setLoading(false);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return <div className="dashboard-loading">Loading...</div>;
    }

    return (
        <div className="home-dashboard">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <span className="brand-icon">💚</span>
                    <span className="brand-text">HealthBuddy</span>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/home" className="nav-link">
                        <span className="nav-icon">🏠</span>
                        <span>Overview</span>
                    </Link>
                    <Link to="/dashboard/diabetes" className="nav-link">
                        <span className="nav-icon">🩸</span>
                        <span>Diabetes</span>
                    </Link>
                    <Link to="/dashboard/hypertension" className="nav-link">
                        <span className="nav-icon">💓</span>
                        <span>Hypertension</span>
                    </Link>
                    <Link to="/logs" className="nav-link">
                        <span className="nav-icon">📊</span>
                        <span>Health Logs</span>
                    </Link>
                    <Link to="/reports" className="nav-link">
                        <span className="nav-icon">📈</span>
                        <span>Reports</span>
                    </Link>
                    <Link to="/settings" className="nav-link active">
                        <span className="nav-icon">⚙️</span>
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className="sidebar-user">
                    <div className="user-avatar">👤</div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'User'}</span>
                        <span className="user-email">{user?.email}</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Sign Out">
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main home-main">
                <header className="home-header">
                    <div>
                        <h1>⚙️ Settings</h1>
                        <p>Manage your preferences and account</p>
                    </div>
                </header>

                <section className="settings-section">
                    {/* Profile Settings */}
                    <div className="settings-card">
                        <h3>👤 Profile Information</h3>
                        <div className="settings-group">
                            <div className="setting-item">
                                <label>Name</label>
                                <input type="text" value={user?.name || ''} readOnly />
                            </div>
                            <div className="setting-item">
                                <label>Email</label>
                                <input type="email" value={user?.email || ''} readOnly />
                            </div>
                            <div className="setting-item">
                                <label>Age</label>
                                <input type="number" value={user?.age || ''} readOnly />
                            </div>
                        </div>
                    </div>

                    {/* Measurement Settings */}
                    <div className="settings-card">
                        <h3>📏 Measurement Units</h3>
                        <div className="settings-group">
                            <div className="setting-item">
                                <label>Blood Sugar Unit</label>
                                <select
                                    value={settings.glucoseUnit}
                                    onChange={(e) => handleSettingChange('glucoseUnit', e.target.value)}
                                >
                                    <option value="mg/dL">mg/dL</option>
                                    <option value="mmol/L">mmol/L</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="settings-card">
                        <h3>🔔 Notifications</h3>
                        <div className="settings-group">
                            <div className="setting-item toggle-item">
                                <div>
                                    <label>Medication Reminders</label>
                                    <p className="setting-desc">Get notified when it's time to take medication</p>
                                </div>
                                <button
                                    className={`toggle-btn ${settings.reminderEnabled ? 'active' : ''}`}
                                    onClick={() => handleSettingChange('reminderEnabled', !settings.reminderEnabled)}
                                >
                                    {settings.reminderEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Actions */}
                    <div className="settings-card danger-zone">
                        <h3>⚠️ Account</h3>
                        <div className="settings-group">
                            <button className="settings-action-btn logout" onClick={handleLogout}>
                                🚪 Sign Out
                            </button>
                        </div>
                    </div>
                </section>

                <div className="settings-footer">
                    <p>HealthBuddy v1.0.0</p>
                    <p>Made with ❤️ for better health management</p>
                </div>
            </main>
        </div>
    );
};

export default Settings;
