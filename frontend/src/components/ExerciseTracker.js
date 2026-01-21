/**
 * Exercise Tracker Component
 * Track physical activity with duration and type
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';

const ExerciseTracker = ({ token }) => {
    const [exercises, setExercises] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
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
        { id: 'walking', label: 'Walking', icon: '🚶', met: 3.5 },
        { id: 'jogging', label: 'Jogging', icon: '🏃', met: 7.0 },
        { id: 'cycling', label: 'Cycling', icon: '🚴', met: 6.0 },
        { id: 'swimming', label: 'Swimming', icon: '🏊', met: 6.0 },
        { id: 'yoga', label: 'Yoga', icon: '🧘', met: 2.5 },
        { id: 'strength', label: 'Strength', icon: '💪', met: 5.0 },
        { id: 'dancing', label: 'Dancing', icon: '💃', met: 4.5 },
        { id: 'other', label: 'Other', icon: '🏋️', met: 4.0 }
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
                <h3>🏃 Exercise Tracker</h3>
                <button
                    className="add-exercise-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✕ Cancel' : '+ Log Exercise'}
                </button>
            </div>

            {/* Weekly Progress */}
            <div className="exercise-progress-card">
                <div className="progress-header">
                    <span>Weekly Goal Progress</span>
                    <span className="progress-target">{weeklyStats.totalMinutes} / {weeklyStats.targetMinutes} min</span>
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
                        <span className="stat-label">Sessions</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{Math.round(weeklyStats.totalMinutes / 7)}</span>
                        <span className="stat-label">Avg min/day</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{progressPercent >= 100 ? '🎉' : `${Math.round(progressPercent)}%`}</span>
                        <span className="stat-label">Goal</span>
                    </div>
                </div>
            </div>

            {/* ADA Recommendation */}
            <div className="exercise-info">
                <span className="info-icon">ℹ️</span>
                <span>ADA recommends 150+ minutes of moderate exercise per week for diabetes management</span>
            </div>

            {/* Log Form */}
            {showForm && (
                <form className="exercise-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Activity Type</label>
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
                            <label>Duration (minutes)</label>
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
                            <label>Intensity</label>
                            <select
                                value={newExercise.intensity}
                                onChange={e => setNewExercise({ ...newExercise, intensity: e.target.value })}
                            >
                                <option value="light">Light</option>
                                <option value="moderate">Moderate</option>
                                <option value="vigorous">Vigorous</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes (optional)</label>
                        <input
                            type="text"
                            value={newExercise.notes}
                            onChange={e => setNewExercise({ ...newExercise, notes: e.target.value })}
                            placeholder="e.g., Morning walk in park"
                        />
                    </div>

                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Log Exercise'}
                    </button>
                </form>
            )}

            {/* Recent Activities */}
            <div className="recent-exercises">
                <h4>Recent Activities</h4>
                {exercises.length === 0 ? (
                    <div className="no-exercises">
                        <p>No exercises logged yet this week.</p>
                        <p>Start tracking your activity to see your progress!</p>
                    </div>
                ) : (
                    <div className="exercises-list">
                        {exercises.slice(0, 5).map((exercise, i) => {
                            const type = exerciseTypes.find(t => t.id === exercise.activity_type) || exerciseTypes[7];
                            return (
                                <div key={i} className="exercise-item">
                                    <span className="exercise-icon">{type.icon}</span>
                                    <div className="exercise-details">
                                        <span className="exercise-name">{type.label}</span>
                                        <span className="exercise-meta">
                                            {exercise.duration_minutes} min • {exercise.intensity}
                                        </span>
                                    </div>
                                    <span className="exercise-date">
                                        {new Date(exercise.logged_at).toLocaleDateString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Benefits */}
            <div className="exercise-benefits">
                <h4>🌟 Benefits for Diabetics</h4>
                <ul>
                    <li>Improves insulin sensitivity</li>
                    <li>Helps control blood sugar levels</li>
                    <li>Reduces cardiovascular risk</li>
                    <li>Supports healthy weight management</li>
                </ul>
            </div>
        </div>
    );
};

export default ExerciseTracker;
