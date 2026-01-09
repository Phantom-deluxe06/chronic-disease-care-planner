/**
 * Reports Page
 * View health reports and export data
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MobileNav from '../components/MobileNav';

const Reports = () => {
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
                    <Link to="/logs" className="nav-link">
                        <span className="nav-icon">📊</span>
                        <span>Health Logs</span>
                    </Link>
                    <Link to="/reports" className="nav-link active">
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
                        <h1>📈 Health Reports</h1>
                        <p>View your health trends and export data</p>
                    </div>
                </header>

                <section className="reports-section">
                    <div className="reports-grid">
                        <div className="report-card">
                            <div className="report-icon">📊</div>
                            <h3>Blood Sugar Report</h3>
                            <p>View your glucose trends over time</p>
                            <div className="report-stats">
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">Avg mg/dL</span>
                                </div>
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">Readings</span>
                                </div>
                            </div>
                            <button className="report-btn">View Report</button>
                        </div>

                        <div className="report-card">
                            <div className="report-icon">💓</div>
                            <h3>Blood Pressure Report</h3>
                            <p>Track your BP patterns</p>
                            <div className="report-stats">
                                <div className="stat">
                                    <span className="value">--/--</span>
                                    <span className="label">Avg BP</span>
                                </div>
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">Readings</span>
                                </div>
                            </div>
                            <button className="report-btn">View Report</button>
                        </div>

                        <div className="report-card">
                            <div className="report-icon">🏃</div>
                            <h3>Activity Report</h3>
                            <p>Exercise and activity summary</p>
                            <div className="report-stats">
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">Total Min</span>
                                </div>
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">Sessions</span>
                                </div>
                            </div>
                            <button className="report-btn">View Report</button>
                        </div>

                        <div className="report-card">
                            <div className="report-icon">💊</div>
                            <h3>Medication Adherence</h3>
                            <p>Track your medication consistency</p>
                            <div className="report-stats">
                                <div className="stat">
                                    <span className="value">--%</span>
                                    <span className="label">Adherence</span>
                                </div>
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">Missed</span>
                                </div>
                            </div>
                            <button className="report-btn">View Report</button>
                        </div>
                    </div>
                </section>

                <section className="export-section">
                    <h2>📥 Export Your Data</h2>
                    <p>Download your health data for doctor visits</p>
                    <div className="export-options">
                        <button className="export-btn">
                            <span>📄</span>
                            <span>Export as PDF</span>
                        </button>
                        <button className="export-btn">
                            <span>📊</span>
                            <span>Export as CSV</span>
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Reports;
