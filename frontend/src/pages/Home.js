/**
 * Home Page Component
 * Overview dashboard with links to disease-specific dashboards
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MobileNav from '../components/MobileNav';
import SidebarRail from '../components/SidebarRail';
import {
    Droplet,
    HeartPulse,
    BarChart3,
    Pill,
    Utensils,
    Waves,
    ClipboardList,
    CheckCircle2,
    TrendingUp,
    Bell,
    Lightbulb,
    Footprints,
    Moon,
    Heart,
    ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t, language } = useLanguage();

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
        if (hour < 12) return t('Good Morning');
        if (hour < 17) return t('Good Afternoon');
        return t('Good Evening');
    };

    if (loading) {
        return <div className="dashboard-loading">{t('Loading...')}</div>;
    }

    // Get user's diseases from stored user data
    const userDiseases = user?.diseases || [];

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
                        <h1>{getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
                        <p>{t('Welcome to your health dashboard')}</p>
                    </div>
                    <div className="header-date">
                        {new Date().toLocaleDateString(language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </header>

                {/* Disease Dashboard Cards */}
                <section className="dashboard-cards-section">
                    <h2>{t('Your Health Dashboards')}</h2>
                    <p className="section-subtitle">{t('Select a condition to view detailed care plan and tracking')}</p>

                    <div className="dashboard-cards">
                        <Link to="/dashboard/diabetes" className="dashboard-card diabetes-card">
                            <div className="card-icon"><Droplet size={32} strokeWidth={2} /></div>
                            <div className="card-content">
                                <h3>{t('Diabetes Care')}</h3>
                                <p>{t('Track blood sugar, manage diet, and follow your care plan')}</p>
                                <ul className="card-features">
                                    <li><BarChart3 size={14} /> {t('Blood sugar tracking')}</li>
                                    <li><Pill size={14} /> {t('Medication reminders')}</li>
                                    <li><Utensils size={14} /> {t('AI Diet analysis')}</li>
                                    <li><Waves size={14} /> {t('Water intake')}</li>
                                </ul>
                            </div>
                            <span className="card-arrow"><ArrowRight size={20} /></span>
                        </Link>

                        <Link to="/dashboard/hypertension" className="dashboard-card hypertension-card">
                            <div className="card-icon"><HeartPulse size={32} strokeWidth={2} /></div>
                            <div className="card-content">
                                <h3>{t('Hypertension Care')}</h3>
                                <p>{t('Monitor BP, track heart rate, and manage your health')}</p>
                                <ul className="card-features">
                                    <li><BarChart3 size={14} /> {t('Blood pressure readings')}</li>
                                    <li><Heart size={14} /> {t('Heart rate monitoring')}</li>
                                    <li><Utensils size={14} /> {t('Low-sodium diet tips')}</li>
                                </ul>
                            </div>
                            <span className="card-arrow"><ArrowRight size={20} /></span>
                        </Link>
                    </div>
                </section>

                {/* Quick Stats */}
                <section className="quick-stats-section">
                    <h2>{t('Quick Overview')}</h2>
                    <div className="quick-stats-grid">
                        <div className="quick-stat-card">
                            <span className="stat-icon"><ClipboardList size={24} color="#06B6D4" /></span>
                            <div className="stat-info">
                                <span className="stat-value">{userDiseases.length}</span>
                                <span className="stat-label">{t('Conditions')}</span>
                            </div>
                        </div>
                        <div className="quick-stat-card">
                            <span className="stat-icon"><CheckCircle2 size={24} color="#22c55e" /></span>
                            <div className="stat-info">
                                <span className="stat-value">0</span>
                                <span className="stat-label">{t('Tasks Done Today')}</span>
                            </div>
                        </div>
                        <div className="quick-stat-card">
                            <span className="stat-icon"><TrendingUp size={24} color="#8b5cf6" /></span>
                            <div className="stat-info">
                                <span className="stat-value">-</span>
                                <span className="stat-label">{t('Last Reading')}</span>
                            </div>
                        </div>
                        <div className="quick-stat-card">
                            <span className="stat-icon"><Bell size={24} color="#f59e0b" /></span>
                            <div className="stat-info">
                                <span className="stat-value">0</span>
                                <span className="stat-label">{t('Reminders')}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tips Section */}
                <section className="tips-section">
                    <h2><Lightbulb size={24} color="#f59e0b" style={{ display: 'inline', marginRight: '8px' }} /> {t('Health Tips')}</h2>
                    <div className="tips-grid">
                        <div className="tip-card">
                            <span className="tip-icon"><Waves size={24} color="#06B6D4" /></span>
                            <p>{t('Stay hydrated - drink at least 8 glasses of water daily')}</p>
                        </div>
                        <div className="tip-card">
                            <span className="tip-icon"><Footprints size={24} color="#22c55e" /></span>
                            <p>{t('Take short walks every hour if you sit for long periods')}</p>
                        </div>
                        <div className="tip-card">
                            <span className="tip-icon"><Moon size={24} color="#8b5cf6" /></span>
                            <p>{t('Get 7-8 hours of quality sleep for better health')}</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
