/**
 * Activity Tracker Component
 * Displays Strava activities with progress ring for 150-minute weekly goal
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { Activity, CheckCircle2, Info, RefreshCw, Star, MapPin, Clock } from 'lucide-react';

const ActivityTracker = ({ token }) => {
    const [data, setData] = useState({
        activities: [],
        goal: {
            target_minutes: 150,
            current_minutes: 0,
            progress_percent: 0,
            remaining_minutes: 150
        },
        weekly_stats: {
            total_minutes: 0,
            total_distance_km: 0,
            activity_count: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    const fetchActivities = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/strava/activities'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (err) {
            console.error('Failed to fetch Strava activities:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchActivities();
        }
    }, [token, fetchActivities]);

    const getActivityIcon = (type) => {
        const icons = {
            'Run': '🏃',
            'Ride': '🚴',
            'Swim': '🏊',
            'Walk': '🚶',
            'Hike': '🥾',
            'Workout': '💪',
            'Yoga': '🧘',
            'WeightTraining': '🏋️',
            'VirtualRide': '🚴‍♂️',
            'VirtualRun': '🏃‍♂️'
        };
        return icons[type] || '🏃';
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const hrs = Math.floor(mins / 60);
        if (hrs > 0) {
            return `${hrs}h ${mins % 60}m`;
        }
        return `${mins}m`;
    };

    const formatDistance = (meters) => {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${Math.round(meters)} m`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const diff = today - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return t('Today');
        if (days === 1) return t('Yesterday');
        if (days < 7) return t('{n} days ago').replace('{n}', days);
        return date.toLocaleDateString();
    };

    // SVG Progress Ring calculations
    const size = 140;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progressOffset = circumference - (data.goal.progress_percent / 100) * circumference;

    if (loading) {
        return (
            <div className="activity-tracker loading">
                <div className="loading-spinner"><RefreshCw className="spin" size={24} color="#06B6D4" /></div>
                <p>{t('Loading Strava activities...')}</p>
            </div>
        );
    }

    return (
        <div className="activity-tracker">
            <div className="activity-header">
                <h3><Activity size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Strava Activities')}</h3>
                <span className="strava-badge">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#FC4C02" style={{ marginRight: '4px' }}>
                        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" />
                    </svg>
                    {t('Synced')}
                </span>
            </div>

            {/* Progress Ring */}
            <div className="activity-progress-ring-container">
                <svg className="progress-ring" width={size} height={size}>
                    {/* Background circle */}
                    <circle
                        className="progress-ring-bg"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Progress circle */}
                    <circle
                        className="progress-ring-fill"
                        stroke={data.goal.progress_percent >= 100 ? '#06B6D4' : '#FC4C02'}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: progressOffset,
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                            transition: 'stroke-dashoffset 0.5s ease'
                        }}
                    />
                </svg>
                <div className="progress-ring-content">
                    <span className="progress-value">{data.goal.current_minutes}</span>
                    <span className="progress-label">/ {data.goal.target_minutes} {t('min')}</span>
                    {data.goal.progress_percent >= 100 && <span className="goal-achieved">🎉 {t('Goal!')}</span>}
                </div>
            </div>

            {/* Stats */}
            <div className="activity-stats-grid">
                <div className="activity-stat">
                    <span className="stat-value">{data.weekly_stats.activity_count}</span>
                    <span className="stat-label">{t('Activities')}</span>
                </div>
                <div className="activity-stat">
                    <span className="stat-value">{data.weekly_stats.total_distance_km}</span>
                    <span className="stat-label">{t('km Total')}</span>
                </div>
                <div className="activity-stat">
                    <span className="stat-value">{Math.round(data.goal.progress_percent)}%</span>
                    <span className="stat-label">{t('of Goal')}</span>
                </div>
            </div>

            {/* Recent Activities */}
            {data.activities.length > 0 ? (
                <div className="recent-strava-activities">
                    <h4>{t('This Week')}</h4>
                    <div className="strava-activities-list">
                        {data.activities.slice(0, 5).map((activity, i) => (
                            <div key={i} className="strava-activity-item">
                                <span className="activity-icon">{getActivityIcon(activity.activity_type)}</span>
                                <div className="activity-details">
                                    <span className="activity-name">{t(activity.name) || t(activity.activity_type)}</span>
                                    <span className="activity-meta">
                                        <Clock size={12} style={{ marginRight: '4px' }} /> {formatDuration(activity.moving_time)} • <MapPin size={12} style={{ marginRight: '4px' }} /> {formatDistance(activity.distance)}
                                    </span>
                                </div>
                                <span className="activity-date">{formatDate(activity.start_date)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="no-activities">
                    <p>{t('No activities synced yet this week.')}</p>
                    <p>{t('Go to Settings to connect and sync your Strava account!')}</p>
                </div>
            )}

            {/* Goal info */}
            <div className="activity-goal-info">
                <Info size={16} color="#06B6D4" style={{ marginRight: '8px', flexShrink: 0 }} />
                <span>
                    {data.goal.remaining_minutes > 0
                        ? t('{n} more minutes to reach your weekly goal!').replace('{n}', data.goal.remaining_minutes)
                        : t('You\'ve exceeded your goal by {n} minutes! 🎉').replace('{n}', data.goal.current_minutes - data.goal.target_minutes)
                    }
                </span>
            </div>
        </div>
    );
};

export default ActivityTracker;
