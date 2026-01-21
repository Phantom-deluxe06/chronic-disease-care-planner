/**
 * Reports Page
 * View health reports and export data
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileNav from '../components/MobileNav';
import SidebarRail from '../components/SidebarRail';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, HeartPulse, Activity, Pill, FileDown, FileSpreadsheet } from 'lucide-react';

const Reports = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

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
                        <h1><BarChart3 size={28} color="#06B6D4" style={{ display: 'inline', marginRight: '10px' }} /> {t('Health Reports')}</h1>
                        <p>{t('View your health trends and export data')}</p>
                    </div>
                </header>

                <section className="reports-section">
                    <div className="reports-grid">
                        <div className="report-card">
                            <div className="report-icon"><BarChart3 size={32} color="#06B6D4" /></div>
                            <h3>{t('Blood Sugar Report')}</h3>
                            <p>{t('View your glucose trends over time')}</p>
                            <div className="report-stats">
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">{t('Avg mg/dL')}</span>
                                </div>
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">{t('Readings')}</span>
                                </div>
                            </div>
                            <button className="report-btn">{t('View Report')}</button>
                        </div>

                        <div className="report-card">
                            <div className="report-icon"><HeartPulse size={32} color="#06B6D4" /></div>
                            <h3>{t('Blood Pressure Report')}</h3>
                            <p>{t('Track your BP patterns')}</p>
                            <div className="report-stats">
                                <div className="stat">
                                    <span className="value">--/--</span>
                                    <span className="label">{t('Avg BP')}</span>
                                </div>
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">{t('Readings')}</span>
                                </div>
                            </div>
                            <button className="report-btn">{t('View Report')}</button>
                        </div>

                        <div className="report-card">
                            <div className="report-icon"><Activity size={32} color="#06B6D4" /></div>
                            <h3>{t('Activity Report')}</h3>
                            <p>{t('Exercise and activity summary')}</p>
                            <div className="report-stats">
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">{t('Total Min')}</span>
                                </div>
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">{t('Sessions')}</span>
                                </div>
                            </div>
                            <button className="report-btn">{t('View Report')}</button>
                        </div>

                        <div className="report-card">
                            <div className="report-icon"><Pill size={32} color="#06B6D4" /></div>
                            <h3>{t('Medication Adherence')}</h3>
                            <p>{t('Track your medication consistency')}</p>
                            <div className="report-stats">
                                <div className="stat">
                                    <span className="value">--%</span>
                                    <span className="label">{t('Adherence')}</span>
                                </div>
                                <div className="stat">
                                    <span className="value">--</span>
                                    <span className="label">{t('Missed')}</span>
                                </div>
                            </div>
                            <button className="report-btn">{t('View Report')}</button>
                        </div>
                    </div>
                </section>

                <section className="export-section">
                    <h2><FileDown size={24} color="#06B6D4" style={{ display: 'inline', marginRight: '10px' }} /> {t('Export Your Data')}</h2>
                    <p>{t('Download your health data for doctor visits')}</p>
                    <div className="export-options">
                        <button className="export-btn">
                            <FileDown size={20} />
                            <span>{t('Export as PDF')}</span>
                        </button>
                        <button className="export-btn">
                            <FileSpreadsheet size={20} />
                            <span>{t('Export as CSV')}</span>
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Reports;
