/**
 * Hypertension Dashboard Component
 * Comprehensive AI-powered care planner for blood pressure management
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BPEntryModal from '../components/BPEntryModal';
import HypertensionFoodModal from '../components/HypertensionFoodModal';
import FoodImageAnalysisModal from '../components/FoodImageAnalysisModal';
import WaterTracker from '../components/WaterTracker';
import MedicationManager from '../components/MedicationManager';
import StressTracker from '../components/StressTracker';
import WeeklySummaryBP from '../components/WeeklySummaryBP';
import { apiUrl } from '../config/api';
import MobileNav from '../components/MobileNav';
import NutritionDashboard from '../components/NutritionDashboard';
import WorkoutAnalytics from '../components/WorkoutAnalytics';
import SidebarRail from '../components/SidebarRail';
import {
    HeartPulse,
    LayoutDashboard,
    Utensils,
    Activity,
    Pill,
    Wind,
    Bot,
    AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HypertensionDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBPModal, setShowBPModal] = useState(false);
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [showFoodImageModal, setShowFoodImageModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [alert, setAlert] = useState(null);
    const { t, language, translateAsync } = useLanguage();

    // Real data from API
    const [bpLogs, setBpLogs] = useState([]);
    const [carePlan, setCarePlan] = useState([]);
    const [translatedCarePlan, setTranslatedCarePlan] = useState([]);
    const [tips, setTips] = useState([
        'Target BP: Below 120/80 mmHg',
        'Reduce sodium intake to less than 2,300mg/day',
        'Manage stress with deep breathing',
        'Limit alcohol and caffeine consumption',
        'Maintain a healthy weight'
    ]);
    const [translatedTips, setTranslatedTips] = useState([]);
    const [weeklyStats, setWeeklyStats] = useState(null);

    const token = localStorage.getItem('token');

    const fetchBPLogs = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/logs/bp?days=1'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const formattedLogs = (data.logs || []).map(log => ({
                    time: new Date(log.logged_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    systolic: log.systolic,
                    diastolic: log.diastolic,
                    pulse: log.pulse,
                    status: classifyBPStatus(log.systolic, log.diastolic)
                }));
                setBpLogs(formattedLogs);
                setWeeklyStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch BP logs:', err);
        }
    }, [token]);

    const fetchCarePlan = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/care-plan?condition=hypertension'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const formattedTasks = (data.tasks || []).map(task => ({
                    time: task.time,
                    task: task.task,
                    icon: task.category === 'medication' ? '💊' :
                        task.category === 'monitoring' ? '💓' :
                            task.category === 'diet' ? '🥗' :
                                task.category === 'exercise' ? '🚶' :
                                    task.category === 'stress' ? '🧘' : '📋',
                    done: false
                }));
                setCarePlan(formattedTasks);
                if (data.tips) setTips(data.tips);
            }
        } catch (err) {
            console.error('Failed to fetch care plan:', err);
            // Use default care plan
            setCarePlan([
                { time: '6:30 AM', task: 'Morning BP check (before meds)', icon: '💓', done: false },
                { time: '7:00 AM', task: 'Take BP medication', icon: '💊', done: false },
                { time: '7:30 AM', task: 'Low-sodium breakfast', icon: '🥗', done: false },
                { time: '8:00 AM', task: 'Potassium-rich foods (banana)', icon: '🍌', done: false },
                { time: '12:00 PM', task: 'Limit salt at lunch', icon: '🧂', done: false },
                { time: '3:00 PM', task: 'Afternoon BP check', icon: '💓', done: false },
                { time: '5:00 PM', task: 'Stress-relief activity', icon: '🧘', done: false },
                { time: '6:00 PM', task: 'Light cardio exercise', icon: '🏃', done: false },
                { time: '9:00 PM', task: 'Evening BP check', icon: '💓', done: false },
                { time: '10:00 PM', task: 'Relaxation before sleep', icon: '😴', done: false },
            ]);
        }
    }, [token]);

    const classifyBPStatus = (systolic, diastolic) => {
        if (systolic >= 180 || diastolic >= 120) return 'crisis';
        if (systolic >= 140 || diastolic >= 90) return 'high';
        if (systolic >= 130 || diastolic >= 80) return 'elevated';
        return 'normal';
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(storedUser));

        Promise.all([
            fetchBPLogs(),
            fetchCarePlan()
        ]).finally(() => setLoading(false));
    }, [navigate, token, fetchBPLogs, fetchCarePlan]);

    // Translate care plan and tips when language changes
    useEffect(() => {
        const translateContent = async () => {
            if (language === 'en') {
                setTranslatedCarePlan(carePlan);
                setTranslatedTips(tips);
                return;
            }

            // Translate care plan tasks
            const translatedTasks = await Promise.all(
                carePlan.map(async (task) => ({
                    ...task,
                    task: await translateAsync(task.task)
                }))
            );
            setTranslatedCarePlan(translatedTasks);

            // Translate tips
            const translatedTipsArray = await Promise.all(
                tips.map(async (tip) => await translateAsync(tip))
            );
            setTranslatedTips(translatedTipsArray);
        };

        if (carePlan.length > 0 || tips.length > 0) {
            translateContent();
        }
    }, [language, carePlan, tips, translateAsync]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleBPSuccess = (data) => {
        fetchBPLogs();
        if (data.alert) {
            setAlert(data.alert);
        }
    };

    const toggleTask = (index) => {
        const updatedPlan = [...carePlan];
        updatedPlan[index].done = !updatedPlan[index].done;
        setCarePlan(updatedPlan);
    };

    const completedTasks = carePlan.filter(t => t.done).length;
    const progress = carePlan.length > 0 ? Math.round((completedTasks / carePlan.length) * 100) : 0;

    if (loading) {
        return <div className="dashboard-loading">{t('Loading...')}</div>;
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="dashboard-grid">
                        {/* Progress Card */}
                        <div className="dash-card progress-card enhanced-progress">
                            <h3>{t("Today's Progress")}</h3>
                            <div className="progress-content">
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
                                <div className="progress-details">
                                    <p className="progress-status">{completedTasks} {t('of')} {carePlan.length} {t('tasks done')}</p>

                                    {/* Motivational Message */}
                                    <div className="motivation-box">
                                        {progress === 0 && <span className="motivation-text">🌅 {t("Let's start your healthy day!")}</span>}
                                        {progress > 0 && progress < 50 && <span className="motivation-text">💪 {t("Great start! Keep going!")}</span>}
                                        {progress >= 50 && progress < 100 && <span className="motivation-text">🔥 {t("You're on fire! Almost there!")}</span>}
                                        {progress === 100 && <span className="motivation-text">🎉 {t("Amazing! All tasks completed!")}</span>}
                                    </div>

                                    {/* Next Task Preview */}
                                    {translatedCarePlan.length > 0 && (
                                        <div className="next-task-preview">
                                            <span className="next-label">{t('Next task')}:</span>
                                            <span className="next-task-name">
                                                {translatedCarePlan.find(task => !task.done)?.task || t('All done!')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Water Tracker */}
                        <WaterTracker token={token} />

                        {/* BP Readings */}
                        <div className="dash-card readings-card bp-card">
                            <h3>{t("Today's BP Readings")}</h3>
                            <div className="readings-list">
                                {bpLogs.length > 0 ? bpLogs.map((log, i) => (
                                    <div key={i} className={`reading-item bp-reading ${log.status}`}>
                                        <span className="reading-time">{log.time}</span>
                                        <div className="bp-values">
                                            <span className="bp-main">{log.systolic}/{log.diastolic}</span>
                                            <span className="bp-unit">mmHg</span>
                                        </div>
                                        {log.pulse && <span className="pulse-value">❤️ {log.pulse} bpm</span>}
                                    </div>
                                )) : (
                                    <p className="no-data">{t('No readings yet today. Log your first BP reading!')}</p>
                                )}
                            </div>
                            <button className="add-reading-btn" onClick={() => setShowBPModal(true)}>+ {t('Log BP Reading')}</button>
                        </div>

                        {/* Quick Actions */}
                        <div className="dash-card quick-actions-card">
                            <h3>{t('Quick Actions')}</h3>
                            <div className="quick-actions-grid">
                                <button className="quick-action" onClick={() => setShowBPModal(true)}>
                                    💓 {t('Log BP')}
                                </button>
                                <button className="quick-action" onClick={() => setShowFoodModal(true)}>
                                    🍽️ {t('Log Food')}
                                </button>
                                <button className="quick-action" onClick={() => setActiveTab('exercise')}>
                                    🏃 {t('Log Activity')}
                                </button>
                                <button className="quick-action" onClick={() => setActiveTab('stress')}>
                                    🧘 {t('Stress Check-in')}
                                </button>
                            </div>
                        </div>

                        {/* Care Plan */}
                        <div className="dash-card care-plan-card">
                            <h3>{t("Today's Care Plan")}</h3>
                            <div className="care-plan-list">
                                {(translatedCarePlan.length > 0 ? translatedCarePlan : carePlan).slice(0, 6).map((task, i) => (
                                    <div key={i} className={`care-task ${task.done ? 'done' : ''}`}>
                                        <span className="task-icon">{task.icon}</span>
                                        <div className="task-content">
                                            <span className="task-time">{task.time}</span>
                                            <span className="task-name">{task.task}</span>
                                        </div>
                                        <button className="task-check" onClick={() => toggleTask(i)}>
                                            {task.done ? '✓' : '○'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="dash-card tips-card">
                            <h3>💡 {t('Blood Pressure Tips')}</h3>
                            <ul className="tips-list">
                                {(translatedTips.length > 0 ? translatedTips : tips).map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Quick Stats */}
                        <div className="dash-card stats-card">
                            <h3>{t('Weekly Overview')}</h3>
                            <div className="quick-stats">
                                <div className="stat">
                                    <span className="stat-value">
                                        {weeklyStats?.avg_systolic || '--'}/{weeklyStats?.avg_diastolic || '--'}
                                    </span>
                                    <span className="stat-label">{t('Avg BP')}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{weeklyStats?.avg_pulse || '--'}</span>
                                    <span className="stat-label">{t('Avg Pulse')}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{weeklyStats?.in_range_percent || '--'}%</span>
                                    <span className="stat-label">{t('In Range')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'diet':
                return (
                    <div className="tab-content">
                        <div className="section-intro">
                            <h3>🥗 {t('DASH Diet Tracking')}</h3>
                            <p>{t('Track your sodium intake and macros for heart-healthy eating.')}</p>
                            <div className="food-action-buttons">
                                <button className="btn-primary" onClick={() => setShowFoodModal(true)}>
                                    + {t('Log a Meal')}
                                </button>
                                <button className="btn-secondary scan-food-btn" onClick={() => setShowFoodImageModal(true)}>
                                    📷 {t('Scan Food Plate')}
                                </button>
                            </div>
                        </div>
                        <NutritionDashboard token={token} />
                        <div className="dash-tips">
                            <h4>🍽️ DASH Diet Principles</h4>
                            <ul>
                                <li>🧂 Limit sodium to &lt;2,300mg/day (ideally &lt;1,500mg)</li>
                                <li>🍌 Eat potassium-rich foods: bananas, oranges, spinach</li>
                                <li>🥬 Increase fruits and vegetables (4-5 servings each)</li>
                                <li>🍞 Choose whole grains over refined</li>
                                <li>🥛 Include low-fat dairy products</li>
                                <li>🍖 Limit saturated fats and red meat</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'exercise':
                return (
                    <div className="tab-content">
                        <WorkoutAnalytics token={token} />
                        <div className="exercise-bp-info">
                            <h4>🫀 Exercise & Blood Pressure</h4>
                            <p>Regular physical activity helps lower blood pressure by making your heart stronger.
                                A stronger heart can pump more blood with less effort, reducing pressure on arteries.</p>
                            <ul>
                                <li>✅ Aim for 150 minutes/week of moderate activity (AHA recommendation)</li>
                                <li>✅ Walking, swimming, and cycling are excellent choices</li>
                                <li>⚠️ Avoid heavy weightlifting which can spike BP</li>
                                <li>⚠️ Stop if you feel dizzy or short of breath</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'medications':
                return (
                    <div className="tab-content">
                        <MedicationManager token={token} />
                        <div className="med-bp-info">
                            <h4>💊 Antihypertensive Medications</h4>
                            <p>Common BP medications include:</p>
                            <ul>
                                <li><strong>ACE Inhibitors</strong> - Lisinopril, Enalapril</li>
                                <li><strong>ARBs</strong> - Losartan, Valsartan</li>
                                <li><strong>Beta Blockers</strong> - Metoprolol, Atenolol</li>
                                <li><strong>Calcium Channel Blockers</strong> - Amlodipine</li>
                                <li><strong>Diuretics</strong> - Hydrochlorothiazide</li>
                            </ul>
                            <div className="med-warning">
                                ⚠️ Never stop or change your medication without consulting your doctor.
                            </div>
                        </div>
                    </div>
                );

            case 'stress':
                return (
                    <div className="tab-content">
                        <StressTracker token={token} />
                    </div>
                );

            case 'summary':
                return (
                    <div className="tab-content">
                        <WeeklySummaryBP token={token} />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="disease-dashboard hypertension-theme">
            {/* Mobile Navigation */}
            <MobileNav user={user} onLogout={handleLogout} onScanClick={() => setShowFoodImageModal(true)} />

            {/* Sidebar Rail */}
            <SidebarRail user={user} />

            {/* Main Content */}
            <main className="dashboard-main home-main">
                <header className="dashboard-header">
                    <div className="header-title">
                        <span className="disease-icon"><HeartPulse size={32} color="#06B6D4" strokeWidth={2} /></span>
                        <div>
                            <h1>{t('Hypertension Care')}</h1>
                            <p>{t('Monitor your blood pressure and heart health')}</p>
                        </div>
                    </div>
                    <div className="header-date">
                        {new Date().toLocaleDateString(language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US', {
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
                        <LayoutDashboard size={18} strokeWidth={2} /> {t('Overview')}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'diet' ? 'active' : ''}`}
                        onClick={() => setActiveTab('diet')}
                    >
                        <Utensils size={18} strokeWidth={2} /> {t('Diet & Sodium')}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'exercise' ? 'active' : ''}`}
                        onClick={() => setActiveTab('exercise')}
                    >
                        <Activity size={18} strokeWidth={2} /> {t('Exercise')}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'medications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('medications')}
                    >
                        <Pill size={18} strokeWidth={2} /> {t('Medications')}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'stress' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stress')}
                    >
                        <Wind size={18} strokeWidth={2} /> {t('Stress & Lifestyle')}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        <Bot size={18} strokeWidth={2} /> {t('AI Summary')}
                    </button>
                </div>

                {/* Tab Content */}
                {renderTabContent()}

                {/* Alert Banner */}
                {alert && (
                    <div className="alert-banner">
                        <span className="alert-icon"><AlertTriangle size={20} color="#f59e0b" /></span>
                        <span>{alert}</span>
                        <button onClick={() => setAlert(null)}>×</button>
                    </div>
                )}

                {/* Medical Disclaimer */}
                <div className="disclaimer-banner">
                    ⚠️ This app does not provide medical diagnosis. Always consult your healthcare provider for personalized guidance.
                </div>
            </main>

            {/* BP Entry Modal */}
            <BPEntryModal
                isOpen={showBPModal}
                onClose={() => setShowBPModal(false)}
                onSuccess={handleBPSuccess}
                token={token}
            />

            {/* Food Analysis Modal */}
            <HypertensionFoodModal
                isOpen={showFoodModal}
                onClose={() => setShowFoodModal(false)}
                onSuccess={() => { }}
                token={token}
            />

            {/* Food Image Analysis Modal */}
            <FoodImageAnalysisModal
                isOpen={showFoodImageModal}
                onClose={() => setShowFoodImageModal(false)}
                onSuccess={() => { }}
                token={token}
                condition="hypertension"
            />
        </div>
    );
};

export default HypertensionDashboard;
