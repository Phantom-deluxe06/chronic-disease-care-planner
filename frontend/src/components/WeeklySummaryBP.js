/**
 * Weekly Summary BP Component
 * AI-generated insights for hypertension management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';

const WeeklySummaryBP = ({ token }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/summary/hypertension'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSummary(data);
            }
        } catch (err) {
            console.error('Failed to fetch summary:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

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
                setSummary(data);
            }
        } catch (err) {
            console.error('Failed to generate summary:', err);
        } finally {
            setGenerating(false);
        }
    };

    const getBPTrendIcon = (trend) => {
        if (trend === 'improving') return '📉';
        if (trend === 'stable') return '➡️';
        if (trend === 'worsening') return '📈';
        return '📊';
    };

    const getBPTrendColor = (trend) => {
        if (trend === 'improving') return '#22c55e';
        if (trend === 'stable') return '#f59e0b';
        if (trend === 'worsening') return '#ef4444';
        return '#6b7280';
    };

    if (loading) {
        return (
            <div className="weekly-summary loading">
                <div className="loading-spinner"></div>
                <p>Loading weekly summary...</p>
            </div>
        );
    }

    return (
        <div className="weekly-summary bp-summary">
            <div className="summary-header">
                <h3>🤖 AI Weekly Summary</h3>
                <button
                    className="refresh-btn"
                    onClick={generateNewSummary}
                    disabled={generating}
                >
                    {generating ? 'Generating...' : '🔄 Refresh'}
                </button>
            </div>

            {summary ? (
                <>
                    {/* BP Trend Overview */}
                    <div className="summary-section bp-trend-section">
                        <h4>📊 Blood Pressure Trend</h4>
                        <div className="bp-trend-card">
                            <div className="trend-main">
                                <span
                                    className="trend-icon"
                                    style={{ color: getBPTrendColor(summary.bp_trend?.direction) }}
                                >
                                    {getBPTrendIcon(summary.bp_trend?.direction)}
                                </span>
                                <div className="trend-info">
                                    <span className="trend-label">This Week's Trend</span>
                                    <span
                                        className="trend-value"
                                        style={{ color: getBPTrendColor(summary.bp_trend?.direction) }}
                                    >
                                        {summary.bp_trend?.direction?.charAt(0).toUpperCase() + summary.bp_trend?.direction?.slice(1) || 'Not enough data'}
                                    </span>
                                </div>
                            </div>
                            <div className="bp-averages">
                                <div className="avg-item">
                                    <span className="avg-value">
                                        {summary.bp_trend?.avg_systolic || '--'}/{summary.bp_trend?.avg_diastolic || '--'}
                                    </span>
                                    <span className="avg-label">Avg BP</span>
                                </div>
                                <div className="avg-item">
                                    <span className="avg-value">{summary.bp_trend?.readings_count || 0}</span>
                                    <span className="avg-label">Readings</span>
                                </div>
                                <div className="avg-item">
                                    <span className="avg-value">{summary.bp_trend?.in_range_percent || 0}%</span>
                                    <span className="avg-label">In Range</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medication Adherence */}
                    <div className="summary-section">
                        <h4>💊 Medication Adherence</h4>
                        <div className="adherence-bar">
                            <div
                                className="adherence-fill"
                                style={{
                                    width: `${summary.medication_adherence || 0}%`,
                                    backgroundColor: (summary.medication_adherence || 0) >= 80 ? '#22c55e' : '#f59e0b'
                                }}
                            />
                        </div>
                        <p className="adherence-text">
                            {summary.medication_adherence || 0}% of scheduled doses taken
                            {summary.medication_adherence >= 80 ? ' ✅ Great job!' : ' ⚠️ Try to improve consistency'}
                        </p>
                    </div>

                    {/* Sodium Intake */}
                    <div className="summary-section">
                        <h4>🧂 Diet - Sodium Levels</h4>
                        <div className="sodium-summary">
                            <div className="sodium-stat">
                                <span className="stat-value">{summary.avg_daily_sodium || '--'}mg</span>
                                <span className="stat-label">Avg Daily Sodium</span>
                            </div>
                            <div className="sodium-goal">
                                <span>Target: &lt;2,300mg/day</span>
                                {summary.avg_daily_sodium && (
                                    <span className={summary.avg_daily_sodium <= 2300 ? 'good' : 'warning'}>
                                        {summary.avg_daily_sodium <= 2300 ? '✅ On Track' : '⚠️ Reduce sodium'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Exercise */}
                    <div className="summary-section">
                        <h4>🏃 Physical Activity</h4>
                        <div className="exercise-summary">
                            <div className="exercise-stat">
                                <span className="stat-value">{summary.exercise_minutes || 0}</span>
                                <span className="stat-label">Minutes this week</span>
                            </div>
                            <div className="exercise-goal">
                                <span>Goal: 150 min/week (AHA)</span>
                                {summary.exercise_minutes >= 150 ?
                                    <span className="good">✅ Goal Met!</span> :
                                    <span className="info">{150 - (summary.exercise_minutes || 0)} min remaining</span>
                                }
                            </div>
                        </div>
                    </div>

                    {/* AI Insights */}
                    {summary.insights && summary.insights.length > 0 && (
                        <div className="summary-section insights-section">
                            <h4>💡 AI Insights & Recommendations</h4>
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
                            <h4>⚠️ Attention Required</h4>
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
                        ⚠️ AI insights are informational only. They are not medical advice and do not replace consultation with your healthcare provider.
                    </div>
                </>
            ) : (
                <div className="no-summary">
                    <p>📊 Not enough data to generate a weekly summary yet.</p>
                    <p>Keep logging your blood pressure, meals, and activities to get personalized insights!</p>
                    <button
                        className="btn-primary"
                        onClick={generateNewSummary}
                        disabled={generating}
                    >
                        {generating ? 'Generating...' : 'Generate Summary'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default WeeklySummaryBP;
