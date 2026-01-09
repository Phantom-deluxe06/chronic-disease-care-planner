/**
 * Health Logs Page
 * View and manage all health log entries
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import MobileNav from '../components/MobileNav';

const HealthLogs = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [logs, setLogs] = useState([]);
    const token = localStorage.getItem('token');

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
            case 'glucose': return '🩸';
            case 'blood_pressure': return '💓';
            case 'activity': return '🏃';
            case 'food': return '🍽️';
            case 'water': return '💧';
            default: return '📋';
        }
    };

    const filteredLogs = activeFilter === 'all'
        ? logs
        : logs.filter(log => log.log_type === activeFilter);

    if (loading) {
        return <div className="dashboard-loading">Loading...</div>;
    }

    return (
        <div className="home-dashboard">
            {/* Mobile Navigation */}
            <MobileNav user={user} onLogout={handleLogout} />

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
                    <Link to="/logs" className="nav-link active">
                        <span className="nav-icon">📊</span>
                        <span>Health Logs</span>
                    </Link>
                    <Link to="/reports" className="nav-link">
                        <span className="nav-icon">📈</span>
                        <span>Reports</span>
                    </Link>
                    <Link to="/settings" className="nav-link">
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
                        <h1>📊 Health Logs</h1>
                        <p>View all your health entries</p>
                    </div>
                </header>

                {/* Filter Tabs */}
                <div className="logs-filter-tabs">
                    <button
                        className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'glucose' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('glucose')}
                    >
                        🩸 Glucose
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'blood_pressure' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('blood_pressure')}
                    >
                        💓 BP
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'activity' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('activity')}
                    >
                        🏃 Activity
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'food' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('food')}
                    >
                        🍽️ Food
                    </button>
                </div>

                {/* Logs List */}
                <section className="logs-list-section">
                    {filteredLogs.length === 0 ? (
                        <div className="no-logs">
                            <p>No logs found for the selected filter.</p>
                            <p>Start logging your health data to see entries here.</p>
                        </div>
                    ) : (
                        <div className="logs-list">
                            {filteredLogs.map((log, i) => (
                                <div key={i} className="log-entry">
                                    <span className="log-icon">{getLogIcon(log.log_type)}</span>
                                    <div className="log-details">
                                        <span className="log-type">{log.log_type?.replace('_', ' ')}</span>
                                        <span className="log-value">
                                            {log.value && `${log.value} ${log.unit || ''}`}
                                            {log.systolic && `${log.systolic}/${log.diastolic} mmHg`}
                                            {log.duration_minutes && `${log.duration_minutes} min`}
                                            {log.food_description && log.food_description}
                                        </span>
                                    </div>
                                    <span className="log-time">
                                        {new Date(log.logged_at).toLocaleString()}
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
