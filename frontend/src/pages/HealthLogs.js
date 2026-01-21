/**
 * Health Logs Page
 * View and manage all health log entries
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import MobileNav from '../components/MobileNav';
import SidebarRail from '../components/SidebarRail';
import { useLanguage } from '../context/LanguageContext';
import { ClipboardList, Droplet, HeartPulse, Activity, Utensils } from 'lucide-react';

const HealthLogs = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [logs, setLogs] = useState([]);
    const token = localStorage.getItem('token');
    const { t, language } = useLanguage();

    const fetchLogs = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/logs?days=30'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    }, [token]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(storedUser));
        fetchLogs();
        setLoading(false);
    }, [navigate, token, fetchLogs]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getLogIcon = (type) => {
        switch (type) {
            case 'glucose': return <Droplet size={20} color="#06B6D4" />;
            case 'blood_pressure': return <HeartPulse size={20} color="#06B6D4" />;
            case 'activity': return <Activity size={20} color="#22c55e" />;
            case 'food': return <Utensils size={20} color="#f59e0b" />;
            case 'water': return <Droplet size={20} color="#3b82f6" />;
            default: return <ClipboardList size={20} color="#06B6D4" />;
        }
    };

    const getLogTypeName = (type) => {
        switch (type) {
            case 'glucose': return t('Glucose');
            case 'blood_pressure': return t('Blood Pressure');
            case 'activity': return t('Activity');
            case 'food': return t('Food');
            case 'water': return t('Water');
            default: return type?.replace('_', ' ');
        }
    };

    const filteredLogs = activeFilter === 'all'
        ? logs
        : logs.filter(log => log.log_type === activeFilter);

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
                        <h1><ClipboardList size={28} color="#06B6D4" style={{ display: 'inline', marginRight: '10px' }} /> {t('Health Logs')}</h1>
                        <p>{t('View all your health entries')}</p>
                    </div>
                </header>

                {/* Filter Tabs */}
                <div className="logs-filter-tabs">
                    <button
                        className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        {t('All')}
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'glucose' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('glucose')}
                    >
                        <Droplet size={16} /> {t('Glucose')}
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'blood_pressure' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('blood_pressure')}
                    >
                        <HeartPulse size={16} /> {t('BP')}
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('activity')}
                    >
                        <Activity size={16} /> {t('Activity')}
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'food' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('food')}
                    >
                        <Utensils size={16} /> {t('Food')}
                    </button>
                </div>

                {/* Logs List */}
                <section className="logs-list-section">
                    {filteredLogs.length === 0 ? (
                        <div className="no-logs">
                            <p>{t('No logs found for the selected filter.')}</p>
                            <p>{t('Start logging your health data to see entries here.')}</p>
                        </div>
                    ) : (
                        <div className="logs-list">
                            {filteredLogs.map((log, i) => (
                                <div key={i} className="log-entry">
                                    <span className="log-icon">{getLogIcon(log.log_type)}</span>
                                    <div className="log-details">
                                        <span className="log-type">{getLogTypeName(log.log_type)}</span>
                                        <span className="log-value">
                                            {log.value && `${log.value} ${log.unit || ''}`}
                                            {log.systolic && `${log.systolic}/${log.diastolic} mmHg`}
                                            {log.duration_minutes && `${log.duration_minutes} ${t('min')}`}
                                            {log.food_description && log.food_description}
                                        </span>
                                    </div>
                                    <span className="log-time">
                                        {new Date(log.logged_at).toLocaleString(language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default HealthLogs;
