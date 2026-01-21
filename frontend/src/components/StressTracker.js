/**
 * Stress Tracker Component
 * Daily stress check-ins and lifestyle management for hypertension
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';

const StressTracker = ({ token }) => {
    const [stressLevel, setStressLevel] = useState(null);
    const [todayCheckin, setTodayCheckin] = useState(null);
    const [sleepHours, setSleepHours] = useState('');
    const [loading, setLoading] = useState(false);
    const [showBreathing, setShowBreathing] = useState(false);
    const [breathPhase, setBreathPhase] = useState('');
    const [breathCount, setBreathCount] = useState(0);

    const stressLevels = [
        { level: 'low', label: 'Low', icon: '😊', color: '#06B6D4' },
        { level: 'moderate', label: 'Moderate', icon: '😐', color: '#f59e0b' },
        { level: 'high', label: 'High', icon: '😰', color: '#ef4444' }
    ];

    const lifestyleTips = [
        { icon: '🚬', text: 'Avoid smoking - it raises blood pressure', important: true },
        { icon: '🍺', text: 'Limit alcohol - max 1 drink/day for women, 2 for men', important: true },
        { icon: '☕', text: 'Reduce caffeine - can temporarily spike BP', important: false },
        { icon: '😴', text: 'Get 7-8 hours of quality sleep', important: false },
        { icon: '🧘', text: 'Practice relaxation techniques daily', important: false }
    ];

    const fetchTodayCheckin = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/stress/today'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTodayCheckin(data);
                if (data.stress_level) {
                    setStressLevel(data.stress_level);
                }
                if (data.sleep_hours) {
                    setSleepHours(data.sleep_hours.toString());
                }
            }
        } catch (err) {
            console.error('Failed to fetch stress data:', err);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchTodayCheckin();
        }
    }, [token, fetchTodayCheckin]);

    const logStress = async (level) => {
        setLoading(true);
        try {
            await fetch(apiUrl('/stress/log'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    stress_level: level,
                    sleep_hours: sleepHours ? parseFloat(sleepHours) : null
                })
            });
            setStressLevel(level);
            fetchTodayCheckin();
        } catch (err) {
            console.error('Failed to log stress:', err);
        } finally {
            setLoading(false);
        }
    };

    const startBreathingExercise = () => {
        setShowBreathing(true);
        setBreathCount(0);
        runBreathingCycle();
    };

    const runBreathingCycle = () => {
        const phases = [
            { name: 'Breathe In', duration: 4000 },
            { name: 'Hold', duration: 4000 },
            { name: 'Breathe Out', duration: 6000 }
        ];

        let phaseIndex = 0;
        let cycleCount = 0;

        const runPhase = () => {
            if (cycleCount >= 3) {
                setShowBreathing(false);
                setBreathPhase('');
                return;
            }

            setBreathPhase(phases[phaseIndex].name);

            setTimeout(() => {
                phaseIndex++;
                if (phaseIndex >= phases.length) {
                    phaseIndex = 0;
                    cycleCount++;
                    setBreathCount(cycleCount);
                }
                runPhase();
            }, phases[phaseIndex].duration);
        };

        runPhase();
    };

    return (
        <div className="stress-tracker">
            <div className="stress-header">
                <h3>🧘 Stress & Lifestyle</h3>
            </div>

            {/* Daily Check-in */}
            <div className="stress-checkin-card">
                <h4>How are you feeling today?</h4>
                <div className="stress-levels">
                    {stressLevels.map(s => (
                        <button
                            key={s.level}
                            className={`stress-btn ${stressLevel === s.level ? 'active' : ''}`}
                            onClick={() => logStress(s.level)}
                            disabled={loading}
                            style={{
                                borderColor: stressLevel === s.level ? s.color : 'transparent',
                                backgroundColor: stressLevel === s.level ? `${s.color}20` : 'rgba(255,255,255,0.05)'
                            }}
                        >
                            <span className="stress-icon">{s.icon}</span>
                            <span className="stress-label">{s.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sleep Logging */}
            <div className="sleep-card">
                <h4>😴 Last Night's Sleep</h4>
                <div className="sleep-input-row">
                    <input
                        type="number"
                        value={sleepHours}
                        onChange={e => setSleepHours(e.target.value)}
                        placeholder="Hours"
                        min="0"
                        max="24"
                        step="0.5"
                    />
                    <span className="sleep-unit">hours</span>
                    <button
                        className="save-sleep-btn"
                        onClick={() => stressLevel && logStress(stressLevel)}
                        disabled={!sleepHours || loading}
                    >
                        Save
                    </button>
                </div>
                {sleepHours && parseFloat(sleepHours) < 7 && (
                    <p className="sleep-warning">⚠️ Less than 7 hours. Poor sleep can raise blood pressure.</p>
                )}
            </div>

            {/* Breathing Exercise */}
            <div className="breathing-card">
                <h4>🌬️ Quick Stress Relief</h4>
                {!showBreathing ? (
                    <button className="breathing-btn" onClick={startBreathingExercise}>
                        Start 4-4-6 Breathing Exercise
                    </button>
                ) : (
                    <div className="breathing-exercise">
                        <div className={`breath-circle ${breathPhase.toLowerCase().replace(' ', '-')}`}>
                            <span className="breath-text">{breathPhase}</span>
                        </div>
                        <p className="breath-count">Cycle {breathCount + 1} of 3</p>
                    </div>
                )}
                <p className="breathing-tip">Deep breathing activates your parasympathetic nervous system and can help lower blood pressure.</p>
            </div>

            {/* Lifestyle Tips */}
            <div className="lifestyle-tips">
                <h4>💡 Lifestyle Tips for BP Control</h4>
                <ul className="tips-list">
                    {lifestyleTips.map((tip, i) => (
                        <li key={i} className={tip.important ? 'important' : ''}>
                            <span className="tip-icon">{tip.icon}</span>
                            <span>{tip.text}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Weekly Stress Overview */}
            {todayCheckin && todayCheckin.week_summary && (
                <div className="stress-summary">
                    <h4>📊 This Week's Stress</h4>
                    <div className="stress-stats">
                        <div className="stat">
                            <span className="stat-value">{todayCheckin.week_summary.low || 0}</span>
                            <span className="stat-label">Low Days</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{todayCheckin.week_summary.moderate || 0}</span>
                            <span className="stat-label">Moderate Days</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{todayCheckin.week_summary.high || 0}</span>
                            <span className="stat-label">High Days</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StressTracker;
