/**
 * Home Page Component
 * Overview dashboard with links to disease-specific dashboards
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return <div className="dashboard-loading">Loading...</div>;
    }

    // Get user's diseases from stored user data
    const userDiseases = user?.diseases || [];
    const hasDiabetes = userDiseases.includes('diabetes');
    const hasHypertension = userDiseases.includes('hypertension');

    return (
        <div className="home-dashboard">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <span className="brand-icon">💚</span>
                    <span className="brand-text">HealthBuddy</span>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/home" className="nav-link active">
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
                        <h1>{getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
                        <p>Welcome to your health dashboard</p>
                    </div>
                    <div className="header-date">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </header>

                {/* Disease Dashboard Cards */}
                <section className="dashboard-cards-section">
                    <h2>Your Health Dashboards</h2>
                    <p className="section-subtitle">Select a condition to view detailed care plan and tracking</p>

                    <div className="dashboard-cards">
                        <Link to="/dashboard/diabetes" className="dashboard-card diabetes-card">
                            <div className="card-icon">🩸</div>
                            <div className="card-content">
                                <h3>Diabetes Care</h3>
                                <p>Track blood sugar, manage diet, and follow your care plan</p>
                                <ul className="card-features">
                                    <li>📊 Blood sugar tracking</li>
                                    <li>💊 Medication reminders</li>
                                    <li>🥗 AI Diet analysis</li>
                                    <li>💧 Water intake</li>
                                </ul>
                            </div>
                            <span className="card-arrow">→</span>
                        </Link>

                        <Link to="/dashboard/hypertension" className="dashboard-card hypertension-card">
                            <div className="card-icon">💓</div>
                            <div className="card-content">
                                <h3>Hypertension Care</h3>
                                <p>Monitor BP, track heart rate, and manage your health</p>
                                <ul className="card-features">
                                    <li>📊 Blood pressure readings</li>
                                    <li>❤️ Heart rate monitoring</li>
                                    <li>🧂 Low-sodium diet tips</li>
                                </ul>
                            </div>
                            <span className="card-arrow">→</span>
                        </Link>
                    </div>
                </section>

                {/* Quick Stats */}
                <section className="quick-stats-section">
                    <h2>Quick Overview</h2>
                    <div className="quick-stats-grid">
                        <div className="quick-stat-card">
                            <span className="stat-icon">📋</span>
                            <div className="stat-info">
                                <span className="stat-value">{userDiseases.length}</span>
                                <span className="stat-label">Conditions</span>
                            </div>
                        </div>
                        <div className="quick-stat-card">
                            <span className="stat-icon">✅</span>
                            <div className="stat-info">
                                <span className="stat-value">0</span>
                                <span className="stat-label">Tasks Done Today</span>
                            </div>
                        </div>
                        <div className="quick-stat-card">
                            <span className="stat-icon">📈</span>
                            <div className="stat-info">
                                <span className="stat-value">-</span>
                                <span className="stat-label">Last Reading</span>
                            </div>
                        </div>
                        <div className="quick-stat-card">
                            <span className="stat-icon">🔔</span>
                            <div className="stat-info">
                                <span className="stat-value">0</span>
                                <span className="stat-label">Reminders</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tips Section */}
                <section className="tips-section">
                    <h2>💡 Health Tips</h2>
                    <div className="tips-grid">
                        <div className="tip-card">
                            <span className="tip-icon">💧</span>
                            <p>Stay hydrated - drink at least 8 glasses of water daily</p>
                        </div>
                        <div className="tip-card">
                            <span className="tip-icon">🚶</span>
                            <p>Take short walks every hour if you sit for long periods</p>
                        </div>
                        <div className="tip-card">
                            <span className="tip-icon">😴</span>
                            <p>Get 7-8 hours of quality sleep for better health</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
