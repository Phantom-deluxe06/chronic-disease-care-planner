/**
 * Exercise Tracker Component
 * Track physical activity with duration and type
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { Activity, Plus, X, Info, Globe, TrendingUp, CheckCircle2, Star, Clock, Zap } from 'lucide-react';

const ExerciseTracker = ({ token }) => {
    const [exercises, setExercises] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const { t, language } = useLanguage();
    const [weeklyStats, setWeeklyStats] = useState({
        totalMinutes: 0,
        sessions: 0,
        targetMinutes: 150
    });

    const [newExercise, setNewExercise] = useState({
        type: 'walking',
        duration: 30,
        intensity: 'moderate',
        notes: ''
    });

    const exerciseTypes = [
        { id: 'walking', label: t('Walking'), icon: '🚶', met: 3.5 },
        { id: 'jogging', label: t('Jogging'), icon: '🏃', met: 7.0 },
        { id: 'cycling', label: t('Cycling'), icon: '🚴', met: 6.0 },
        { id: 'swimming', label: t('Swimming'), icon: '🏊', met: 6.0 },
        { id: 'yoga', label: t('Yoga'), icon: '🧘', met: 2.5 },
        { id: 'strength', label: t('Strength'), icon: '💪', met: 5.0 },
        { id: 'dancing', label: t('Dancing'), icon: '💃', met: 4.5 },
        { id: 'other', label: t('Other'), icon: '🏋️', met: 4.0 }
    ];

    const fetchExercises = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/logs/activity?days=7'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setExercises(data.logs || []);

                // Calculate weekly stats
                const total = (data.logs || []).reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
                setWeeklyStats({
                    totalMinutes: total,
                    sessions: (data.logs || []).length,
                    targetMinutes: 150
                });
            }
        } catch (err) {
            console.error('Failed to fetch exercises:', err);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchExercises();
        }
    }, [token, fetchExercises]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(apiUrl('/logs/activity'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    activity_type: newExercise.type,
                    duration_minutes: parseInt(newExercise.duration),
                    intensity: newExercise.intensity,
                    notes: newExercise.notes
                })
            });
            if (response.ok) {
                setShowForm(false);
                setNewExercise({
                    type: 'walking',
                    duration: 30,
                    intensity: 'moderate',
                    notes: ''
                });
                fetchExercises();
            }
        } catch (err) {
            console.error('Failed to log exercise:', err);
        } finally {
            setLoading(false);
        }
    };

    const progressPercent = Math.min((weeklyStats.totalMinutes / weeklyStats.targetMinutes) * 100, 100);

    return (
        <div className="exercise-tracker">
            <div className="exercise-header">
                <h3><Activity size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Exercise Tracker')}</h3>
                <button
                    className="add-exercise-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <><X size={16} /> {t('Cancel')}</> : <><Plus size={16} /> {t('Log Exercise')}</>}
                </button>
            </div>

            {/* Weekly Progress */}
            <div className="exercise-progress-card">
                <div className="progress-header">
                    <span>{t('Weekly Goal Progress')}</span>
                    <span className="progress-target">{weeklyStats.totalMinutes} / {weeklyStats.targetMinutes} {t('min')}</span>
                </div>
                <div className="exercise-progress-bar">
                    <div
                        className="exercise-progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="progress-stats">
                    <div className="stat">
                        <span className="stat-value">{weeklyStats.sessions}</span>
                        <span className="stat-label">{t('Sessions')}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{Math.round(weeklyStats.totalMinutes / 7)}</span>
                        <span className="stat-label">{t('Avg min/day')}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{progressPercent >= 100 ? '🎉' : `${Math.round(progressPercent)}%`}</span>
                        <span className="stat-label">{t('Goal')}</span>
                    </div>
                </div>
            </div>

            {/* Recommendation */}
            <div className="exercise-info">
                <Info size={16} color="#06B6D4" style={{ marginRight: '8px', flexShrink: 0 }} />
                <span>{t('ADA recommends 150+ minutes of moderate exercise per week for diabetes management')}</span>
            </div>

            {/* Log Form */}
            {showForm && (
                <form className="exercise-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{t('Activity Type')}</label>
                        <div className="exercise-type-grid">
                            {exerciseTypes.map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    className={`exercise-type-btn ${newExercise.type === type.id ? 'active' : ''}`}
                                    onClick={() => setNewExercise({ ...newExercise, type: type.id })}
                                >
                                    <span className="type-icon">{type.icon}</span>
                                    <span className="type-label">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('Duration (minutes)')}</label>
                            <input
                                type="number"
                                value={newExercise.duration}
                                onChange={e => setNewExercise({ ...newExercise, duration: e.target.value })}
                                min="5"
                                max="300"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Intensity')}</label>
                            <select
                                value={newExercise.intensity}
                                onChange={e => setNewExercise({ ...newExercise, intensity: e.target.value })}
                            >
                                <option value="light">{t('Light')}</option>
                                <option value="moderate">{t('Moderate')}</option>
                                <option value="vigorous">{t('Vigorous')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('Notes (optional)')}</label>
                        <input
                            type="text"
                            value={newExercise.notes}
                            onChange={e => setNewExercise({ ...newExercise, notes: e.target.value })}
                            placeholder={t('e.g., Morning walk in park')}
                        />
                    </div>

                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? t('Saving...') : t('Log Exercise')}
                    </button>
                </form>
            )}

            {/* Recent Activities */}
            <div className="recent-exercises">
                <h4><Clock size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Recent Activities')}</h4>
                {exercises.length === 0 ? (
                    <div className="no-exercises">
                        <p>{t('No exercises logged yet this week.')}</p>
                        <p>{t('Start tracking your activity to see your progress!')}</p>
                    </div>
                ) : (
                    <div className="exercises-list">
                        {exercises.slice(0, 5).map((exercise, i) => {
                            const type = exerciseTypes.find(t => t.id === exercise.activity_type) || exerciseTypes[7];
                            const localeStr = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
                            return (
                                <div key={i} className="exercise-item">
                                    <span className="exercise-icon">{type.icon}</span>
                                    <div className="exercise-details">
                                        <span className="exercise-name">{type.label}</span>
                                        <span className="exercise-meta">
                                            {exercise.duration_minutes} {t('min')} • {t(exercise.intensity.charAt(0).toUpperCase() + exercise.intensity.slice(1))}
                                        </span>
                                    </div>
                                    <span className="exercise-date">
                                        {new Date(exercise.logged_at).toLocaleDateString(localeStr)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Benefits */}
            <div className="exercise-benefits">
                <h4><Star size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Benefits for Diabetics')}</h4>
                <ul>
                    <li><CheckCircle2 size={14} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Improves insulin sensitivity')}</li>
                    <li><CheckCircle2 size={14} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Helps control blood sugar levels')}</li>
                    <li><CheckCircle2 size={14} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Reduces cardiovascular risk')}</li>
                    <li><CheckCircle2 size={14} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Supports healthy weight management')}</li>
                </ul>
            </div>
        </div>
    );
};

export default ExerciseTracker;
