/**
 * Settings Page
 * User preferences and account settings
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileNav from '../components/MobileNav';
import StravaConnect from '../components/StravaConnect';
import SidebarRail from '../components/SidebarRail';
import EmergencyContacts from '../components/EmergencyContacts';
import { useLanguage } from '../context/LanguageContext';
import { Settings as SettingsIcon, User, Ruler, Link, Bell, AlertTriangle, LogOut } from 'lucide-react';

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
    const { t, language, setLanguage } = useLanguage();

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
        return <div className="dashboard-loading">{t('Loading...')}</div>;
    }

    return (
        <div className="home-dashboard">
            {/* Mobile Navigation */}
            <MobileNav user={user} onLogout={handleLogout} />

            {/* Sidebar Rail */}
            <SidebarRail user={user} />

            {/* Main Content */}
            <main className="dashboard-main home-main">
                <header className="home-header">
                    <div>
                        <h1><SettingsIcon size={28} color="#06B6D4" style={{ display: 'inline', marginRight: '10px' }} /> {t('Settings')}</h1>
                        <p>{t('Manage your preferences and account')}</p>
                    </div>
                </header>

                <section className="settings-section">
                    {/* Profile Settings */}
                    <div className="settings-card">
                        <h3><User size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Profile Information')}</h3>
                        <div className="settings-group">
                            <div className="setting-item">
                                <label>{t('Name')}</label>
                                <input type="text" value={user?.name || ''} readOnly />
                            </div>
                            <div className="setting-item">
                                <label>{t('Email')}</label>
                                <input type="email" value={user?.email || ''} readOnly />
                            </div>
                            <div className="setting-item">
                                <label>{t('Age')}</label>
                                <input type="number" value={user?.age || ''} readOnly />
                            </div>
                        </div>
                    </div>

                    {/* Regional & Units */}
                    <div className="settings-card">
                        <h3><Ruler size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Regional & Units')}</h3>
                        <div className="settings-group">
                            <div className="setting-item">
                                <label>{t('Language')}</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="en">English</option>
                                    <option value="ta">தமிழ் (Tamil)</option>
                                    <option value="hi">हिन्दी (Hindi)</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <label>{t('Blood Sugar Unit')}</label>
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

                    {/* Connected Apps */}
                    <div className="settings-card">
                        <h3><Link size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Connected Apps')}</h3>
                        <div className="settings-group">
                            <StravaConnect token={localStorage.getItem('token')} />
                        </div>
                    </div>

                    {/* Emergency SOS Contacts */}
                    <EmergencyContacts />

                    {/* Notification Settings */}
                    <div className="settings-card">
                        <h3><Bell size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Notifications')}</h3>
                        <div className="settings-group">
                            <div className="setting-item toggle-item">
                                <div>
                                    <label>{t('Medication Reminders')}</label>
                                    <p className="setting-desc">{t('Get notified when it\'s time to take medication')}</p>
                                </div>
                                <button
                                    className={`toggle-btn ${settings.reminderEnabled ? 'active' : ''}`}
                                    onClick={() => handleSettingChange('reminderEnabled', !settings.reminderEnabled)}
                                >
                                    {settings.reminderEnabled ? t('ON') : t('OFF')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Actions */}
                    <div className="settings-card danger-zone">
                        <h3><AlertTriangle size={20} color="#f59e0b" style={{ display: 'inline', marginRight: '8px' }} /> {t('Account')}</h3>
                        <div className="settings-group">
                            <button className="settings-action-btn logout" onClick={handleLogout}>
                                <LogOut size={18} style={{ marginRight: '8px' }} /> {t('Sign Out')}
                            </button>
                        </div>
                    </div>
                </section>

                <div className="settings-footer">
                    <p>HealthBuddy v1.0.0</p>
                    <p>{t('Made with')} ❤️ {t('for better health management')}</p>
                </div>
            </main>
        </div>
    );
};

export default Settings;
