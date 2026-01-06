/**
 * Hypertension Dashboard Component
 * Purple/blue theme for blood pressure management
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const HypertensionDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sample data - would come from API
    const [bpLogs, setBpLogs] = useState([
        { time: '7:00 AM', systolic: 128, diastolic: 82, pulse: 72, status: 'normal' },
        { time: '2:00 PM', systolic: 135, diastolic: 88, pulse: 78, status: 'elevated' },
        { time: '9:00 PM', systolic: 122, diastolic: 78, pulse: 68, status: 'normal' },
    ]);

    const carePlan = [
        { time: '6:30 AM', task: 'Morning BP check (before meds)', icon: '💓', done: true },
        { time: '7:00 AM', task: 'Take BP medication', icon: '💊', done: true },
        { time: '7:30 AM', task: 'Low-sodium breakfast', icon: '🥗', done: true },
        { time: '8:00 AM', task: 'Potassium-rich foods (banana)', icon: '🍌', done: false },
        { time: '12:00 PM', task: 'Limit salt at lunch', icon: '🧂', done: false },
        { time: '3:00 PM', task: 'Afternoon BP check', icon: '💓', done: false },
        { time: '5:00 PM', task: 'Stress-relief activity', icon: '🧘', done: false },
        { time: '6:00 PM', task: 'Light cardio exercise', icon: '🏃', done: false },
        { time: '9:00 PM', task: 'Evening BP check', icon: '💓', done: false },
        { time: '10:00 PM', task: 'Relaxation before sleep', icon: '😴', done: false },
    ];

    const tips = [
        'Target BP: Below 120/80 mmHg',
        'Reduce sodium intake to less than 2,300mg/day',
        'Manage stress with deep breathing',
        'Limit alcohol and caffeine consumption',
        'Maintain a healthy weight',
    ];

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

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

    const completedTasks = carePlan.filter(t => t.done).length;
    const progress = Math.round((completedTasks / carePlan.length) * 100);

    if (loading) {
        return <div className="dashboard-loading">Loading...</div>;
    }

    return (
        <div className="disease-dashboard hypertension-theme">
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
                    <Link to="/dashboard/hypertension" className="nav-link active">
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
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-title">
                        <span className="disease-icon">💓</span>
                        <div>
                            <h1>Hypertension Care</h1>
                            <p>Monitor your blood pressure and heart health</p>
                        </div>
                    </div>
                    <div className="header-date">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </header>

                <div className="dashboard-grid">
                    {/* Progress Card */}
                    <div className="dash-card progress-card">
                        <h3>Today's Progress</h3>
                        <div className="progress-circle">
                            <svg viewBox="0 0 100 100">
                                <circle className="progress-bg" cx="50" cy="50" r="40" />
                                <circle
                                    className="progress-fill"
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    strokeDasharray={`${progress * 2.51} 251`}
                                />
                            </svg>
                            <span className="progress-text">{progress}%</span>
                        </div>
                        <p className="progress-status">{completedTasks} of {carePlan.length} tasks done</p>
                    </div>

                    {/* BP Readings */}
                    <div className="dash-card readings-card bp-card">
                        <h3>Today's BP Readings</h3>
                        <div className="readings-list">
                            {bpLogs.map((log, i) => (
                                <div key={i} className={`reading-item bp-reading ${log.status}`}>
                                    <span className="reading-time">{log.time}</span>
                                    <div className="bp-values">
                                        <span className="bp-main">{log.systolic}/{log.diastolic}</span>
                                        <span className="bp-unit">mmHg</span>
                                    </div>
                                    <span className="pulse-value">❤️ {log.pulse} bpm</span>
                                </div>
                            ))}
                        </div>
                        <button className="add-reading-btn">+ Log New Reading</button>
                    </div>

                    {/* Care Plan */}
                    <div className="dash-card care-plan-card">
                        <h3>Today's Care Plan</h3>
                        <div className="care-plan-list">
                            {carePlan.map((task, i) => (
                                <div key={i} className={`care-task ${task.done ? 'done' : ''}`}>
                                    <span className="task-icon">{task.icon}</span>
                                    <div className="task-content">
                                        <span className="task-time">{task.time}</span>
                                        <span className="task-name">{task.task}</span>
                                    </div>
                                    <button className="task-check">{task.done ? '✓' : '○'}</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="dash-card tips-card">
                        <h3>💡 Blood Pressure Tips</h3>
                        <ul className="tips-list">
                            {tips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Stats */}
                    <div className="dash-card stats-card">
                        <h3>Weekly Overview</h3>
                        <div className="quick-stats">
                            <div className="stat">
                                <span className="stat-value">126/82</span>
                                <span className="stat-label">Avg BP</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">74</span>
                                <span className="stat-label">Avg Pulse</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">85%</span>
                                <span className="stat-label">In Range</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HypertensionDashboard;
