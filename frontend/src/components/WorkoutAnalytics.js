/**
 * Workout Analytics Component
 * Enhanced exercise tracking with charts, heatmap, and progress analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    FiActivity, FiTarget, FiTrendingUp, FiAward,
    FiClock, FiZap, FiCalendar, FiPlus
} from 'react-icons/fi';
import {
    MdDirectionsWalk, MdDirectionsRun, MdPool,
    MdFitnessCenter, MdSelfImprovement, MdDirectionsBike
} from 'react-icons/md';
import { BiDumbbell } from 'react-icons/bi';

const WorkoutAnalytics = ({ token }) => {
    const [workoutData, setWorkoutData] = useState({
        todayMinutes: 0,
        weeklyMinutes: 0,
        weeklyGoal: 150,
        streak: 0,
        workouts: [],
        weeklyBreakdown: []
    });
    const [activityForm, setActivityForm] = useState({
        type: 'walking',
        duration: 30,
        intensity: 'moderate'
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const activityTypes = [
        { id: 'walking', name: 'Walking', icon: MdDirectionsWalk, color: '#10b981' },
        { id: 'running', name: 'Running', icon: MdDirectionsRun, color: '#3b82f6' },
        { id: 'cycling', name: 'Cycling', icon: MdDirectionsBike, color: '#f59e0b' },
        { id: 'swimming', name: 'Swimming', icon: MdPool, color: '#06b6d4' },
        { id: 'weights', name: 'Weights', icon: MdFitnessCenter, color: '#8b5cf6' },
        { id: 'yoga', name: 'Yoga', icon: MdSelfImprovement, color: '#ec4899' }
    ];

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchWorkoutData = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/logs/activity?days=7'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                processWorkoutData(data.logs || []);
            } else {
                processWorkoutData([]);
            }
        } catch (error) {
            console.error('Failed to fetch workout data:', error);
            processWorkoutData([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const processWorkoutData = (logs) => {
        const today = new Date().toDateString();
        let todayMinutes = 0;
        let weeklyMinutes = 0;
        const activityCounts = {};
        const weeklyData = [];

        // Calculate streak
        let streak = 0;
        const dateSet = new Set();

        logs.forEach(log => {
            const logDate = new Date(log.created_at).toDateString();
            dateSet.add(logDate);

            if (logDate === today) {
                todayMinutes += log.value || 0;
            }
            weeklyMinutes += log.value || 0;

            // Count by activity type
            const type = (log.reading_context || 'other').split(' ')[0].toLowerCase();
            activityCounts[type] = (activityCounts[type] || 0) + (log.value || 0);
        });

        // Calculate streak
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            if (dateSet.has(date.toDateString())) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        // Weekly breakdown by day
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            const dayMinutes = logs
                .filter(log => new Date(log.created_at).toDateString() === dateStr)
                .reduce((sum, log) => sum + (log.value || 0), 0);

            weeklyData.push({
                day: dayName,
                minutes: dayMinutes,
                active: dayMinutes > 0
            });
        }

        // Activity breakdown for pie chart
        const activityBreakdown = Object.entries(activityCounts)
            .map(([type, minutes]) => {
                const activityInfo = activityTypes.find(a => a.id === type) ||
                    { name: type, color: '#6b7280' };
                return {
                    name: activityInfo.name || type,
                    value: minutes,
                    color: activityInfo.color || '#6b7280'
                };
            })
            .sort((a, b) => b.value - a.value);

        setWorkoutData({
            todayMinutes,
            weeklyMinutes,
            weeklyGoal: 150,
            streak,
            workouts: activityBreakdown,
            weeklyBreakdown: weeklyData
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch(apiUrl('/logs/activity'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    duration_minutes: activityForm.duration,
                    activity_type: activityForm.type,
                    intensity: activityForm.intensity
                })
            });

            if (response.ok) {
                fetchWorkoutData();
                setActivityForm({ type: 'walking', duration: 30, intensity: 'moderate' });
            }
        } catch (error) {
            console.error('Failed to log activity:', error);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        fetchWorkoutData();
    }, [fetchWorkoutData]);

    const weeklyPercentage = Math.min(100, Math.round(
        (workoutData.weeklyMinutes / workoutData.weeklyGoal) * 100
    ));

    if (loading) {
        return <div className="workout-loading">Loading workout data...</div>;
    }

    return (
        <div className="workout-analytics">
            {/* Weekly Progress Card */}
            <div className="workout-card weekly-progress">
                <div className="card-header">
                    <FiTarget className="card-icon" />
                    <h3>Weekly Goal</h3>
                </div>

                <div className="progress-stats">
                    <div className="progress-ring">
                        <svg viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#1f2937"
                                strokeWidth="10"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="10"
                                strokeDasharray={`${weeklyPercentage * 2.51} 251`}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="progress-center">
                            <span className="progress-value">{workoutData.weeklyMinutes}</span>
                            <span className="progress-unit">min</span>
                        </div>
                    </div>

                    <div className="progress-details">
                        <div className="detail-item">
                            <FiClock className="detail-icon" />
                            <div>
                                <span className="detail-value">{workoutData.weeklyGoal - workoutData.weeklyMinutes}</span>
                                <span className="detail-label">min remaining</span>
                            </div>
                        </div>
                        <div className="detail-item">
                            <FiAward className="detail-icon streak" />
                            <div>
                                <span className="detail-value">{workoutData.streak}</span>
                                <span className="detail-label">day streak</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="weekly-bar">
                    <div
                        className="bar-fill"
                        style={{ width: `${weeklyPercentage}%` }}
                    />
                </div>
                <span className="bar-label">{weeklyPercentage}% of 150 min goal</span>
            </div>

            {/* Activity Heatmap */}
            <div className="workout-card activity-heatmap">
                <div className="card-header">
                    <FiCalendar className="card-icon" />
                    <h3>This Week</h3>
                </div>

                <div className="heatmap-grid">
                    {workoutData.weeklyBreakdown.map((day, index) => (
                        <div key={index} className="heatmap-day">
                            <span className="day-label">{day.day}</span>
                            <div className={`day-dot ${day.active ? 'active' : ''}`}>
                                {day.active && <FiActivity />}
                            </div>
                            <span className="day-minutes">
                                {day.minutes > 0 ? `${day.minutes}m` : '-'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="heatmap-summary">
                    <span>{workoutData.weeklyBreakdown.filter(d => d.active).length}/7 days active</span>
                </div>
            </div>

            {/* Weekly Trend Chart */}
            <div className="workout-card trend-chart">
                <div className="card-header">
                    <FiTrendingUp className="card-icon" />
                    <h3>Activity Trend</h3>
                </div>

                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={workoutData.weeklyBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                formatter={(value) => [`${value} min`, 'Duration']}
                            />
                            <Bar
                                dataKey="minutes"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity Breakdown */}
            {workoutData.workouts.length > 0 && (
                <div className="workout-card breakdown-chart">
                    <div className="card-header">
                        <BiDumbbell className="card-icon" />
                        <h3>Activity Breakdown</h3>
                    </div>

                    <div className="breakdown-content">
                        <div className="pie-container">
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={workoutData.workouts}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {workoutData.workouts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="breakdown-legend">
                            {workoutData.workouts.slice(0, 4).map((activity, index) => (
                                <div key={index} className="legend-item">
                                    <span
                                        className="legend-dot"
                                        style={{ backgroundColor: activity.color }}
                                    />
                                    <span className="legend-name">{activity.name}</span>
                                    <span className="legend-value">{activity.value} min</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Log Form */}
            <div className="workout-card quick-log">
                <div className="card-header">
                    <FiPlus className="card-icon" />
                    <h3>Log Activity</h3>
                </div>

                <form onSubmit={handleSubmit} className="log-form">
                    <div className="activity-types">
                        {activityTypes.map((activity) => {
                            const Icon = activity.icon;
                            return (
                                <button
                                    key={activity.id}
                                    type="button"
                                    className={`activity-type-btn ${activityForm.type === activity.id ? 'active' : ''}`}
                                    onClick={() => setActivityForm(prev => ({ ...prev, type: activity.id }))}
                                    style={{
                                        '--activity-color': activity.color,
                                        borderColor: activityForm.type === activity.id ? activity.color : 'transparent'
                                    }}
                                >
                                    <Icon />
                                    <span>{activity.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Duration (min)</label>
                            <input
                                type="number"
                                value={activityForm.duration}
                                onChange={(e) => setActivityForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                min="1"
                                max="300"
                            />
                        </div>

                        <div className="form-group">
                            <label>Intensity</label>
                            <select
                                value={activityForm.intensity}
                                onChange={(e) => setActivityForm(prev => ({ ...prev, intensity: e.target.value }))}
                            >
                                <option value="light">Light</option>
                                <option value="moderate">Moderate</option>
                                <option value="vigorous">Vigorous</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={submitting}
                    >
                        <FiZap />
                        {submitting ? 'Logging...' : 'Log Activity'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WorkoutAnalytics;
