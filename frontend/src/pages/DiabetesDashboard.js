/**
 * Diabetes Dashboard Component
 * Comprehensive Type-2 Diabetes management with tabbed interface
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import LogEntryModal from '../components/LogEntryModal';
import WaterTracker from '../components/WaterTracker';
import FoodAnalysisModal from '../components/FoodAnalysisModal';
import FoodImageAnalysisModal from '../components/FoodImageAnalysisModal';
import MedicationManager from '../components/MedicationManager';
import WeeklySummary from '../components/WeeklySummary';
import HealthMonitor from '../components/HealthMonitor';
import PreventiveCare from '../components/PreventiveCare';
import MobileNav from '../components/MobileNav';
import NutritionDashboard from '../components/NutritionDashboard';
import WorkoutAnalytics from '../components/WorkoutAnalytics';
import SidebarRail from '../components/SidebarRail';
import { useLanguage } from '../context/LanguageContext';
import {
    Droplet, Utensils, Activity, HeartPulse,
    LayoutDashboard, Salad, Dumbbell, Pill,
    Monitor, ShieldCheck, Brain
} from 'lucide-react';

const DiabetesDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogModal, setShowLogModal] = useState(false);
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [showFoodImageModal, setShowFoodImageModal] = useState(false);
    const [logType, setLogType] = useState('glucose');
    const [activeTab, setActiveTab] = useState('overview');
    const { t, language, translateAsync } = useLanguage();

    // Real data from API
    const [sugarLogs, setSugarLogs] = useState([]);
    const [carePlan, setCarePlan] = useState([]);
    const [tips, setTips] = useState([]);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [trends, setTrends] = useState(null);
    const [alert, setAlert] = useState(null);

    const token = localStorage.getItem('token');

    const fetchGlucoseLogs = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/logs/glucose?days=1'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const formattedLogs = data.logs.map(log => ({
                    time: new Date(log.logged_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    value: log.value,
                    type: log.reading_context === 'fasting' ? 'Fasting' :
                        log.reading_context === 'after_meal' ? 'After Meal' :
                            log.reading_context,
                    status: log.value < 70 ? 'low' :
                        log.value > 180 ? 'elevated' : 'normal'
                }));
                setSugarLogs(formattedLogs);
                setWeeklyStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch glucose logs:', err);
        }
    }, [token]);

    const fetchCarePlan = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/care-plan'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const formattedTasks = data.tasks.map(task => ({
                    time: task.time,
                    task: task.task,
                    icon: task.category === 'medication' ? '💊' :
                        task.category === 'monitoring' ? '🩸' :
                            task.category === 'diet' ? '🥗' :
                                task.category === 'exercise' ? '🚶' :
                                    task.category === 'wellness' ? '🧘' : '📋',
                    done: false
                }));
                setCarePlan(formattedTasks);
                setTips(data.tips || []);
            }
        } catch (err) {
            console.error('Failed to fetch care plan:', err);
        }
    }, [token]);

    const fetchTrends = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/trends/glucose'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTrends(data);
                if (data.alerts && data.alerts.length > 0) {
                    setAlert(data.alerts[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch trends:', err);
        }
    }, [token]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(storedUser));

        Promise.all([
            fetchGlucoseLogs(),
            fetchCarePlan(),
            fetchTrends()
        ]).finally(() => setLoading(false));
    }, [navigate, token, fetchGlucoseLogs, fetchCarePlan, fetchTrends]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const openLogModal = (type) => {
        setLogType(type);
        setShowLogModal(true);
    };

    const handleLogSuccess = (data) => {
        fetchGlucoseLogs();
        fetchTrends();
        if (data.alert) {
            setAlert(data.alert);
        }
    };

    const completedTasks = carePlan.filter(t => t.done).length;
    const progress = carePlan.length > 0 ? Math.round((completedTasks / carePlan.length) * 100) : 0;

    if (loading) {
        return <div className="dashboard-loading">Loading...</div>;
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
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

                        {/* Water Tracker */}
                        <WaterTracker token={token} />

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
                            {sugarLogs.length === 0 && (
                                <p className="no-data">No readings yet today. Log your first reading!</p>
                            )}
                            <button className="add-reading-btn" onClick={() => openLogModal('glucose')}>+ Log Glucose</button>
                        </div>

                        {/* Quick Actions */}
                        <div className="dash-card quick-actions-card">
                            <h3>Quick Actions</h3>
                            <div className="quick-actions-grid">
                                <button className="quick-action" onClick={() => openLogModal('glucose')}>
                                    🩸 Log Glucose
                                </button>
                                <button className="quick-action" onClick={() => setShowFoodModal(true)}>
                                    🍽️ Log Food
                                </button>
                                <button className="quick-action" onClick={() => openLogModal('activity')}>
                                    🏃 Log Activity
                                </button>
                                <button className="quick-action" onClick={() => openLogModal('bp')}>
                                    💓 Log BP
                                </button>
                            </div>
                        </div>

                        {/* Care Plan */}
                        <div className="dash-card care-plan-card">
                            <h3>Today's Care Plan</h3>
                            <div className="care-plan-list">
                                {carePlan.slice(0, 5).map((task, i) => (
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
                                    <span className="stat-value">{weeklyStats?.avg_value ? Math.round(weeklyStats.avg_value) : '--'}</span>
                                    <span className="stat-label">Avg Glucose</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{weeklyStats?.min_value || '--'}</span>
                                    <span className="stat-label">Min</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{weeklyStats?.max_value || '--'}</span>
                                    <span className="stat-label">Max</span>
                                </div>
                            </div>
                            {trends?.insights && trends.insights.length > 0 && (
                                <div className="trend-insight">
                                    <span className="insight-icon">📈</span>
                                    <span>{trends.insights[0]}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'food':
                return (
                    <div className="tab-content">
                        <div className="section-intro">
                            <h3>🍽️ Food & Diet Tracking</h3>
                            <p>Track your calories, macros, and get AI-powered nutritional analysis.</p>
                            <div className="food-action-buttons">
                                <button className="btn-primary" onClick={() => setShowFoodModal(true)}>
                                    + Log a Meal
                                </button>
                                <button className="btn-secondary scan-food-btn" onClick={() => setShowFoodImageModal(true)}>
                                    📷 Scan Food Plate
                                </button>
                            </div>
                        </div>
                        <NutritionDashboard token={token} />
                    </div>
                );

            case 'exercise':
                return (
                    <div className="tab-content">
                        <WorkoutAnalytics token={token} />
                    </div>
                );

            case 'medications':
                return (
                    <div className="tab-content">
                        <MedicationManager token={token} />
                    </div>
                );

            case 'health':
                return (
                    <div className="tab-content">
                        <HealthMonitor token={token} />
                    </div>
                );

            case 'preventive':
                return (
                    <div className="tab-content">
                        <PreventiveCare token={token} />
                    </div>
                );

            case 'summary':
                return (
                    <div className="tab-content">
                        <WeeklySummary token={token} />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="disease-dashboard diabetes-theme">
            {/* Mobile Navigation */}
            <MobileNav user={user} onLogout={handleLogout} />

            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">
                    <img src="/logo192.png" alt="Health Buddy" className="brand-logo-img" />
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
            <main className="dashboard-main home-main">
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

                {/* Tab Navigation */}
                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'food' ? 'active' : ''}`}
                        onClick={() => setActiveTab('food')}
                    >
                        🍽️ Food & Diet
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'exercise' ? 'active' : ''}`}
                        onClick={() => setActiveTab('exercise')}
                    >
                        🏃 Exercise
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'medications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('medications')}
                    >
                        💊 Medications
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
                        onClick={() => setActiveTab('health')}
                    >
                        📈 Health Monitor
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'preventive' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preventive')}
                    >
                        🛡️ Preventive Care and Tips
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        🤖 AI Summary
                    </button>
                </div>

                {/* Tab Content */}
                {renderTabContent()}

                {/* Alert Banner */}
                {alert && (
                    <div className="alert-banner">
                        <span className="alert-icon">⚠️</span>
                        <span>{alert}</span>
                        <button onClick={() => setAlert(null)}>×</button>
                    </div>
                )}

                {/* Medical Disclaimer */}
                <div className="disclaimer-banner">
                    ⚠️ This app does not provide medical diagnosis. Always consult your healthcare provider for personalized guidance.
                </div>
            </main>

            {/* Log Entry Modal */}
            <LogEntryModal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                logType={logType}
                onSuccess={handleLogSuccess}
            />

            {/* Food Analysis Modal */}
            <FoodAnalysisModal
                isOpen={showFoodModal}
                onClose={() => setShowFoodModal(false)}
                onSuccess={handleLogSuccess}
                token={token}
            />

            {/* Food Image Analysis Modal */}
            <FoodImageAnalysisModal
                isOpen={showFoodImageModal}
                onClose={() => setShowFoodImageModal(false)}
                token={token}
                condition="diabetes"
            />
        </div>
    );
};

export default DiabetesDashboard;

