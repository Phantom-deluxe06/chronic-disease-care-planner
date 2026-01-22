/**
 * Strava Connect Component
 * Handles Strava OAuth connection and displays connection status
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';

const StravaConnect = ({ token, onSosAlert }) => {
    const [status, setStatus] = useState({
        connected: false,
        athleteName: '',
        loading: true
    });
    const [syncing, setSyncing] = useState(false);
    const [message, setMessage] = useState(null);

    const checkStatus = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/strava/status'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStatus({
                    connected: data.connected,
                    athleteName: data.athlete_name || '',
                    loading: false
                });
            }
        } catch (err) {
            console.error('Failed to check Strava status:', err);
            setStatus(prev => ({ ...prev, loading: false }));
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            checkStatus();
        }
    }, [token, checkStatus]);

    // Handle OAuth callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && window.location.pathname.includes('strava')) {
            handleCallback(code, state);
        }
    }, []);

    const handleCallback = async (code, state) => {
        try {
            setStatus(prev => ({ ...prev, loading: true }));
            const response = await fetch(apiUrl(`/strava/callback?code=${code}&state=${state}`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStatus({
                    connected: true,
                    athleteName: data.athlete_name || '',
                    loading: false
                });
                setMessage({ type: 'success', text: 'Strava connected successfully!' });

                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);

                // Auto-sync activities
                handleSync();
            } else {
                setMessage({ type: 'error', text: 'Failed to connect Strava. Please try again.' });
                setStatus(prev => ({ ...prev, loading: false }));
            }
        } catch (err) {
            console.error('Strava callback error:', err);
            setMessage({ type: 'error', text: 'Connection error. Please try again.' });
            setStatus(prev => ({ ...prev, loading: false }));
        }
    };

    const handleConnect = async () => {
        try {
            const response = await fetch(apiUrl('/strava/auth'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                window.location.href = data.auth_url;
            }
        } catch (err) {
            console.error('Failed to get auth URL:', err);
            setMessage({ type: 'error', text: 'Failed to connect. Please try again.' });
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const response = await fetch(apiUrl('/strava/sync'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessage({ type: 'success', text: `Synced ${data.synced_count} activities from Strava!` });

                // After sync, check activities for hypoglycemia risk
                checkStravaActivitiesForSOS();
            } else {
                setMessage({ type: 'error', text: 'Failed to sync activities.' });
            }
        } catch (err) {
            console.error('Sync error:', err);
            setMessage({ type: 'error', text: 'Sync failed. Please try again.' });
        } finally {
            setSyncing(false);
        }
    };

    const checkStravaActivitiesForSOS = async () => {
        try {
            const response = await fetch(apiUrl('/strava/activities?days=1'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const activities = data.activities || [];

                // Check for extended exercise (hypoglycemia risk)
                const longWorkouts = activities.filter(a => {
                    const minutes = (a.moving_time || 0) / 60;
                    return minutes > 90;
                });

                if (longWorkouts.length > 0 && onSosAlert) {
                    const workout = longWorkouts[0];
                    const minutes = Math.round((workout.moving_time || 0) / 60);
                    onSosAlert({
                        trigger: true,
                        severity: 'warning',
                        type: 'strava_exercise',
                        message: `⚠️ Extended workout detected from Strava: ${workout.name || workout.activity_type} (${minutes} min). Risk of hypoglycemia!`,
                        action: 'Check your blood sugar now. Have fast-acting carbs available. Monitor for symptoms: shakiness, sweating, confusion.'
                    });
                }
            }
        } catch (err) {
            console.error('Failed to check Strava activities for SOS:', err);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Are you sure you want to disconnect Strava?')) return;

        try {
            const response = await fetch(apiUrl('/strava/disconnect'), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setStatus({ connected: false, athleteName: '', loading: false });
                setMessage({ type: 'success', text: 'Strava disconnected.' });
            }
        } catch (err) {
            console.error('Disconnect error:', err);
            setMessage({ type: 'error', text: 'Failed to disconnect.' });
        }
    };

    if (status.loading) {
        return (
            <div className="strava-connect loading">
                <div className="strava-icon">🔄</div>
                <span>Checking Strava connection...</span>
            </div>
        );
    }

    return (
        <div className="strava-connect">
            <div className="strava-header">
                <div className="strava-logo">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="#FC4C02">
                        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" />
                        <path d="M10.298 13.828l2.084 4.116 2.089-4.116H10.298zM5.15 13.828L10.298 24h4.15l-5.15-10.172H5.15z" opacity="0.6" />
                    </svg>
                    <span>Strava</span>
                </div>
                {status.connected && (
                    <span className="strava-status connected">Connected</span>
                )}
            </div>

            {message && (
                <div className={`strava-message ${message.type}`}>
                    {message.text}
                    <button onClick={() => setMessage(null)}>×</button>
                </div>
            )}

            {status.connected ? (
                <div className="strava-connected-content">
                    <div className="athlete-info">
                        <span className="athlete-icon">🏃</span>
                        <span className="athlete-name">{status.athleteName || 'Connected Athlete'}</span>
                    </div>
                    <div className="strava-actions">
                        <button
                            className="strava-sync-btn"
                            onClick={handleSync}
                            disabled={syncing}
                        >
                            {syncing ? '🔄 Syncing...' : '🔄 Sync Activities'}
                        </button>
                        <button
                            className="strava-disconnect-btn"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </button>
                    </div>
                    <p className="strava-info">
                        Your Strava activities are automatically included in your weekly health summary.
                    </p>
                </div>
            ) : (
                <div className="strava-disconnected-content">
                    <p>Connect your Strava account to automatically track your exercises.</p>
                    <button className="strava-connect-btn" onClick={handleConnect}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z" />
                        </svg>
                        Connect with Strava
                    </button>
                    <ul className="strava-benefits">
                        <li>✅ Auto-sync your running, cycling, and workouts</li>
                        <li>✅ Track progress towards 150-minute weekly goal</li>
                        <li>✅ AI correlates exercise with blood sugar/BP</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default StravaConnect;
