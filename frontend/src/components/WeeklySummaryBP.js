/**
 * Weekly Summary BP Component
 * AI-generated insights for hypertension management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, TrendingUp, TrendingDown, Minus, Activity, Pill, Star, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

const WeeklySummaryBP = ({ token }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const { t, translateAsync, language } = useLanguage();

    const translateSummary = async (data) => {
        if (language === 'en') return data;

        try {
            const translatedInsights = await Promise.all(
                (data.insights || []).map(insight => translateAsync(insight))
            );
            const translatedAlerts = await Promise.all(
                (data.alerts || []).map(alert => translateAsync(alert))
            );

            return {
                ...data,
                insights: translatedInsights,
                alerts: translatedAlerts
            };
        } catch (err) {
            console.error('Failed to translate summary:', err);
            return data;
        }
    };

    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/summary/hypertension'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const translatedData = await translateSummary(data);
                setSummary(translatedData);
            }
        } catch (err) {
            console.error('Failed to fetch summary:', err);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, language]);

    useEffect(() => {
        if (token) {
            fetchSummary();
        }
    }, [token, fetchSummary]);

    const generateNewSummary = async () => {
        setGenerating(true);
        try {
            const response = await fetch(apiUrl('/summary/hypertension/generate'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const translatedData = await translateSummary(data);
                setSummary(translatedData);
            }
        } catch (err) {
            console.error('Failed to generate summary:', err);
        } finally {
            setGenerating(false);
        }
    };

    const getBPTrendIcon = (trend) => {
        if (trend === 'improving') return <TrendingDown size={18} />;
        if (trend === 'stable') return <Minus size={18} />;
        if (trend === 'worsening') return <TrendingUp size={18} />;
        return <BarChart3 size={18} />;
    };

    const getBPTrendColor = (trend) => {
        if (trend === 'improving') return '#06B6D4';
        if (trend === 'stable') return '#f59e0b';
        if (trend === 'worsening') return '#ef4444';
        return '#6b7280';
    };

    if (loading) {
        return (
            <div className="weekly-summary loading">
                <div className="loading-spinner"></div>
                <p>{t('Analyzing...')}</p>
            </div>
        );
    }

    return (
        <div className="weekly-summary bp-summary">
            <div className="summary-header">
                <h3><Star size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('AI Weekly Summary')}</h3>
                <button
                    className="refresh-btn"
                    onClick={generateNewSummary}
                    disabled={generating}
                >
                    {generating ? <><RefreshCw size={14} className="spin" /> {t('Generating...')}</> : <><RefreshCw size={14} /> {t('Refresh')}</>}
                </button>
            </div>

            {summary ? (
                <>
                    {/* BP Trend Overview */}
                    <div className="summary-section bp-trend-section">
                        <h4><BarChart3 size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Blood Pressure Trend')}</h4>
                        <div className="bp-trend-card">
                            <div className="trend-main">
                                <span
                                    className="trend-icon"
                                    style={{ color: getBPTrendColor(summary.bp_trend?.direction) }}
                                >
                                    {getBPTrendIcon(summary.bp_trend?.direction)}
                                </span>
                                <div className="trend-info">
                                    <span className="trend-label">{t('This Week\'s Trend')}</span>
                                    <span
                                        className="trend-value"
                                        style={{ color: getBPTrendColor(summary.bp_trend?.direction) }}
                                    >
                                        {summary.bp_trend?.direction ? t(summary.bp_trend.direction.charAt(0).toUpperCase() + summary.bp_trend.direction.slice(1)) : t('Not enough data')}
                                    </span>
                                </div>
                            </div>
                            <div className="bp-averages">
                                <div className="avg-item">
                                    <span className="avg-value">
                                        {summary.bp_trend?.avg_systolic || '--'}/{summary.bp_trend?.avg_diastolic || '--'}
                                    </span>
                                    <span className="avg-label">{t('Avg BP')}</span>
                                </div>
                                <div className="avg-item">
                                    <span className="avg-value">{summary.bp_trend?.readings_count || 0}</span>
                                    <span className="avg-label">{t('Readings')}</span>
                                </div>
                                <div className="avg-item">
                                    <span className="avg-value">{summary.bp_trend?.in_range_percent || 0}%</span>
                                    <span className="avg-label">{t('In Range')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medication Adherence */}
                    <div className="summary-section">
                        <h4><Pill size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Medication Adherence')}</h4>
                        <div className="adherence-bar">
                            <div
                                className="adherence-fill"
                                style={{
                                    width: `${summary.medication_adherence || 0}%`,
                                    backgroundColor: (summary.medication_adherence || 0) >= 80 ? '#06B6D4' : '#f59e0b'
                                }}
                            />
                        </div>
                        <p className="adherence-text">
                            {summary.medication_adherence || 0}% {t('of scheduled doses taken')}
                            {summary.medication_adherence >= 80 ? ` ✅ ${t('Great job!')}` : ` ⚠️ ${t('Try to improve consistency')}`}
                        </p>
                    </div>

                    {/* Sodium Intake */}
                    <div className="summary-section">
                        <h4>🧂 {t('Diet - Sodium Levels')}</h4>
                        <div className="sodium-summary">
                            <div className="sodium-stat">
                                <span className="stat-value">{summary.avg_daily_sodium || '--'}mg</span>
                                <span className="stat-label">{t('Avg Daily Sodium')}</span>
                            </div>
                            <div className="sodium-goal">
                                <span>{t('Target: <2,300mg/day')}</span>
                                {summary.avg_daily_sodium && (
                                    <span className={summary.avg_daily_sodium <= 2300 ? 'good' : 'warning'}>
                                        {summary.avg_daily_sodium <= 2300 ? `✅ ${t('On Track')}` : `⚠️ ${t('Reduce sodium')}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Exercise */}
                    <div className="summary-section">
                        <h4><Activity size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Physical Activity')}</h4>
                        <div className="exercise-summary">
                            <div className="exercise-stat">
                                <span className="stat-value">{summary.exercise_minutes || 0}</span>
                                <span className="stat-label">{t('Minutes this week')}</span>
                            </div>
                            <div className="exercise-goal">
                                <span>{t('Goal: 150 min/week (AHA)')}</span>
                                {summary.exercise_minutes >= 150 ?
                                    <span className="good">✅ {t('Goal Met!')}</span> :
                                    <span className="info">{t('min remaining').replace('min', `${150 - (summary.exercise_minutes || 0)} min`)}</span>
                                }
                            </div>
                        </div>
                    </div>

                    {/* AI Insights */}
                    {summary.insights && summary.insights.length > 0 && (
                        <div className="summary-section insights-section">
                            <h4><Star size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('AI Insights & Recommendations')}</h4>
                            <ul className="insights-list">
                                {summary.insights.map((insight, i) => (
                                    <li key={i}>
                                        <span className="insight-icon">💡</span>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Alerts */}
                    {summary.alerts && summary.alerts.length > 0 && (
                        <div className="summary-section alerts-section">
                            <h4><AlertTriangle size={18} color="#ef4444" style={{ display: 'inline', marginRight: '8px' }} /> {t('Attention Required')}</h4>
                            <ul className="alerts-list">
                                {summary.alerts.map((alert, i) => (
                                    <li key={i}>
                                        <span className="alert-icon">⚠️</span>
                                        <span>{alert}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="summary-disclaimer">
                        <AlertCircle size={14} style={{ marginRight: '6px' }} />
                        {t('AI insights are informational only. They are not medical advice and do not replace consultation with your healthcare provider.')}
                    </div>
                </>
            ) : (
                <div className="no-summary">
                    <p>📊 {t('Not enough data to generate a weekly summary yet.')}</p>
                    <p>{t('Keep logging your blood pressure, meals, and activities to get personalized insights!')}</p>
                    <button
                        className="btn-primary"
                        onClick={generateNewSummary}
                        disabled={generating}
                    >
                        {generating ? t('Generating...') : t('Generate Summary')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default WeeklySummaryBP;
