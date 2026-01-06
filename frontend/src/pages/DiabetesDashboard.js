/**
 * Diabetes Dashboard Component
 * Orange/warm theme for diabetes management
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DiabetesDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sample data - would come from API
    const [sugarLogs, setSugarLogs] = useState([
        { time: '6:00 AM', value: 95, type: 'Fasting', status: 'normal' },
        { time: '9:00 AM', value: 140, type: 'After Breakfast', status: 'normal' },
        { time: '1:00 PM', value: 165, type: 'After Lunch', status: 'elevated' },
    ]);

    const carePlan = [
        { time: '6:00 AM', task: 'Check fasting blood sugar', icon: '🩸', done: true },
        { time: '6:30 AM', task: 'Take morning insulin/medication', icon: '💊', done: true },
        { time: '7:00 AM', task: 'Low-glycemic breakfast', icon: '🥗', done: true },
        { time: '10:00 AM', task: 'Light snack (nuts/fruit)', icon: '🍎', done: false },
        { time: '12:00 PM', task: 'Balanced lunch', icon: '🍽️', done: false },
        { time: '3:00 PM', task: 'Check afternoon sugar', icon: '🩸', done: false },
        { time: '6:00 PM', task: 'Evening walk (30 mins)', icon: '🚶', done: false },
        { time: '7:00 PM', task: 'Dinner (low carb)', icon: '🥗', done: false },
        { time: '10:00 PM', task: 'Bedtime sugar check', icon: '🩸', done: false },
    ];

    const tips = [
        'Keep sugar levels between 80-130 mg/dL before meals',
        'Stay hydrated - drink 8 glasses of water daily',
        'Monitor for hypoglycemia symptoms',
        'Exercise helps regulate blood sugar',
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
        <div className="disease-dashboard diabetes-theme">
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
                    <Link to="/dashboard/diabetes" className="nav-link active">
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
                        <span className="disease-icon">🩸</span>
                        <div>
                            <h1>Diabetes Care</h1>
                            <p>Track your blood sugar and manage your daily routine</p>
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

                    {/* Sugar Readings */}
                    <div className="dash-card readings-card">
                        <h3>Today's Sugar Readings</h3>
                        <div className="readings-list">
                            {sugarLogs.map((log, i) => (
                                <div key={i} className={`reading-item ${log.status}`}>
                                    <span className="reading-time">{log.time}</span>
                                    <span className="reading-value">{log.value} mg/dL</span>
                                    <span className="reading-type">{log.type}</span>
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
                        <h3>💡 Diabetes Tips</h3>
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
                                <span className="stat-value">102</span>
                                <span className="stat-label">Avg Fasting</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">145</span>
                                <span className="stat-label">Avg Post-Meal</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">5.8%</span>
                                <span className="stat-label">Est. HbA1c</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DiabetesDashboard;
