/**
 * Weekly Summary Component
 * AI-powered weekly health summary with insights
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, TrendingUp, TrendingDown, Minus, Utensils, Activity, Pill, Droplet, Star, AlertCircle, Info } from 'lucide-react';

const WeeklySummary = ({ token }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const { t, translateAsync, language } = useLanguage();

    const translateSummary = async (data) => {
        if (language === 'en') return data;

        try {
            const translatedSuggestions = await Promise.all(
                (data.ai_suggestions || []).map(s => translateAsync(s))
            );
            const translatedDisclaimer = await translateAsync(data.disclaimer);

            return {
                ...data,
                ai_suggestions: translatedSuggestions,
                disclaimer: translatedDisclaimer
            };
        } catch (err) {
            console.error('Failed to translate weekly summary:', err);
            return data;
        }
    };

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(apiUrl('/weekly-summary'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const translatedData = await translateSummary(data);
                setSummary(translatedData);
            }
        } catch (err) {
            console.error('Failed to fetch weekly summary:', err);
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

    const getRatingColor = (rating) => {
        switch (rating) {
            case 'Excellent': return '#06B6D4';
            case 'Good': return '#22c55e';
            case 'Fair': return '#f59e0b';
            case 'Needs Improvement': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving': return <TrendingUp size={16} color="#22c55e" />;
            case 'stable': return <Minus size={16} color="#9ca3af" />;
            case 'worsening': return <TrendingDown size={16} color="#ef4444" />;
            default: return <Info size={16} />;
        }
    };

    if (loading) {
        return (
            <div className="weekly-summary loading">
                <div className="loading-spinner">{t('Analyzing...')}</div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="weekly-summary no-data">
                <h3><BarChart3 size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Weekly Health Summary')}</h3>
                <p>{t('No data available yet. Start logging your health data to see insights.')}</p>
            </div>
        );
    }

    return (
        <div className="weekly-summary">
            <div className="summary-header">
                <h3><BarChart3 size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Weekly Health Summary')}</h3>
                <span className="summary-date">{t('Week of {date}').replace('{date}', summary.week_of)}</span>
            </div>

            <div className="summary-grid">
                {/* Diet Score */}
                <div className="summary-card diet-card">
                    <div className="card-icon"><Utensils size={24} color="#06B6D4" /></div>
                    <div className="card-content">
                        <h4>{t('Diet')}</h4>
                        <div
                            className="score-badge"
                            style={{ backgroundColor: getRatingColor(summary.summary.diet.rating) }}
                        >
                            {t(summary.summary.diet.rating)}
                        </div>
                        <p className="stat">{t('{count} meals logged').replace('{count}', summary.summary.diet.meals_logged)}</p>
                        {summary.summary.diet.avg_calories > 0 && (
                            <p className="stat-detail">{t('Avg: {value} kcal/meal').replace('{value}', summary.summary.diet.avg_calories)}</p>
                        )}
                    </div>
                </div>

                {/* Exercise Score */}
                <div className="summary-card exercise-card">
                    <div className="card-icon"><Activity size={24} color="#06B6D4" /></div>
                    <div className="card-content">
                        <h4>{t('Exercise')}</h4>
                        <div
                            className="score-badge"
                            style={{ backgroundColor: getRatingColor(summary.summary.exercise.rating) }}
                        >
                            {t(summary.summary.exercise.rating)}
                        </div>
                        <p className="stat">
                            {t('min / {target} min')
                                .replace('min', `${summary.summary.exercise.total_minutes} ${t('min')}`)
                                .replace('{target} min', `${summary.summary.exercise.target_minutes} ${t('min')}`)}
                        </p>
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
                    <div className="card-icon"><Pill size={24} color="#06B6D4" /></div>
                    <div className="card-content">
                        <h4>{t('Medications')}</h4>
                        <div
                            className="score-badge"
                            style={{ backgroundColor: getRatingColor(summary.summary.medication_adherence.rating) }}
                        >
                            {t(summary.summary.medication_adherence.rating)}
                        </div>
                        <p className="stat">{t('% adherence').replace('%', `${summary.summary.medication_adherence.percentage}%`)}</p>
                    </div>
                </div>

                {/* Blood Sugar */}
                <div className="summary-card glucose-card">
                    <div className="card-icon"><Droplet size={24} color="#06B6D4" /></div>
                    <div className="card-content">
                        <h4>{t('Blood Sugar')}</h4>
                        {summary.summary.blood_sugar.readings > 0 ? (
                            <>
                                <div className="glucose-trend">
                                    {getTrendIcon(summary.summary.blood_sugar.trend)}
                                    <span className="trend-text">{t(summary.summary.blood_sugar.trend)}</span>
                                </div>
                                <p className="stat">{t('Avg: {value} mg/dL').replace('{value}', summary.summary.blood_sugar.average)}</p>
                                <p className="stat-detail">
                                    {t('% in range').replace('%', summary.summary.blood_sugar.in_range_percentage)}
                                </p>
                                <p className="stat-detail">
                                    {t('Range: {min} - {max}')
                                        .replace('{min}', summary.summary.blood_sugar.min)
                                        .replace('{max}', summary.summary.blood_sugar.max)}
                                </p>
                            </>
                        ) : (
                            <p className="no-readings">{t('No readings this week')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Suggestions */}
            <div className="ai-suggestions">
                <h4><Star size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('AI Insights & Suggestions')}</h4>
                <ul className="suggestions-list">
                    {summary.ai_suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                    ))}
                </ul>
            </div>

            {/* Disclaimer */}
            <div className="summary-disclaimer">
                <AlertCircle size={14} style={{ marginRight: '6px' }} />
                {summary.disclaimer}
            </div>
        </div>
    );
};

export default WeeklySummary;
