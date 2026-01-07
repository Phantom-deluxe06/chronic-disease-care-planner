/**
 * Weekly Summary Component
 * AI-powered weekly health summary with insights
 */

import { useState, useEffect, useCallback } from 'react';

const WeeklySummary = ({ token }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/weekly-summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSummary(data);
            }
        } catch (err) {
            console.error('Failed to fetch weekly summary:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchSummary();
        }
    }, [token, fetchSummary]);

    const getRatingColor = (rating) => {
        switch (rating) {
            case 'Excellent': return '#22c55e';
            case 'Good': return '#84cc16';
            case 'Fair': return '#f59e0b';
            case 'Needs Improvement': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving': return '📈';
            case 'stable': return '➡️';
            case 'worsening': return '📉';
            default: return '❓';
        }
    };

    if (loading) {
        return (
            <div className="weekly-summary loading">
                <div className="loading-spinner">Loading weekly summary...</div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="weekly-summary no-data">
                <h3>📊 Weekly Health Summary</h3>
                <p>No data available yet. Start logging your health data to see insights.</p>
            </div>
        );
    }

    return (
        <div className="weekly-summary">
            <div className="summary-header">
                <h3>📊 Weekly Health Summary</h3>
                <span className="summary-date">Week of {summary.week_of}</span>
            </div>

            <div className="summary-grid">
                {/* Diet Score */}
                <div className="summary-card diet-card">
                    <div className="card-icon">🍽️</div>
                    <div className="card-content">
                        <h4>Diet</h4>
                        <div
                            className="score-badge"
                            style={{ backgroundColor: getRatingColor(summary.summary.diet.rating) }}
                        >
                            {summary.summary.diet.rating}
                        </div>
                        <p className="stat">{summary.summary.diet.meals_logged} meals logged</p>
                        {summary.summary.diet.avg_calories > 0 && (
                            <p className="stat-detail">Avg: {summary.summary.diet.avg_calories} kcal/meal</p>
                        )}
                    </div>
                </div>

                {/* Exercise Score */}
                <div className="summary-card exercise-card">
                    <div className="card-icon">🏃</div>
                    <div className="card-content">
                        <h4>Exercise</h4>
                        <div
                            className="score-badge"
                            style={{ backgroundColor: getRatingColor(summary.summary.exercise.rating) }}
                        >
                            {summary.summary.exercise.rating}
                        </div>
                        <p className="stat">{summary.summary.exercise.total_minutes} min / {summary.summary.exercise.target_minutes} min</p>
                        <div className="progress-mini">
                            <div
                                className="progress-fill-mini"
                                style={{ width: `${Math.min(summary.summary.exercise.percentage_of_goal, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Medication Adherence */}
                <div className="summary-card medication-card">
                    <div className="card-icon">💊</div>
                    <div className="card-content">
                        <h4>Medications</h4>
                        <div
                            className="score-badge"
                            style={{ backgroundColor: getRatingColor(summary.summary.medication_adherence.rating) }}
                        >
                            {summary.summary.medication_adherence.rating}
                        </div>
                        <p className="stat">{summary.summary.medication_adherence.percentage}% adherence</p>
                    </div>
                </div>

                {/* Blood Sugar */}
                <div className="summary-card glucose-card">
                    <div className="card-icon">🩸</div>
                    <div className="card-content">
                        <h4>Blood Sugar</h4>
                        {summary.summary.blood_sugar.readings > 0 ? (
                            <>
                                <div className="glucose-trend">
                                    {getTrendIcon(summary.summary.blood_sugar.trend)}
                                    <span className="trend-text">{summary.summary.blood_sugar.trend}</span>
                                </div>
                                <p className="stat">Avg: {summary.summary.blood_sugar.average} mg/dL</p>
                                <p className="stat-detail">
                                    {summary.summary.blood_sugar.in_range_percentage}% in range
                                </p>
                                <p className="stat-detail">
                                    Range: {summary.summary.blood_sugar.min} - {summary.summary.blood_sugar.max}
                                </p>
                            </>
                        ) : (
                            <p className="no-readings">No readings this week</p>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Suggestions */}
            <div className="ai-suggestions">
                <h4>🤖 AI Insights & Suggestions</h4>
                <ul className="suggestions-list">
                    {summary.ai_suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                    ))}
                </ul>
            </div>

            {/* Disclaimer */}
            <div className="summary-disclaimer">
                {summary.disclaimer}
            </div>
        </div>
    );
};

export default WeeklySummary;
