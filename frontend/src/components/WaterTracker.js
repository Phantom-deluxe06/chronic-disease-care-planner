/**
 * Water Tracker Component
 * Visual water intake tracking with glass icons
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';

const WaterTracker = ({ token }) => {
    const [waterData, setWaterData] = useState({
        total_ml: 0,
        glasses: 0,
        target_ml: 2500,
        percentage: 0,
        remaining_ml: 2500
    });
    const [loading, setLoading] = useState(false);

    const fetchWaterData = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/water/today'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWaterData(data);
            }
        } catch (err) {
            console.error('Failed to fetch water data:', err);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchWaterData();
        }
    }, [token, fetchWaterData]);

    const logWater = async (amount_ml = 250) => {
        setLoading(true);
        try {
            const response = await fetch(apiUrl('/logs/water'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount_ml })
            });
            if (response.ok) {
                fetchWaterData();
            }
        } catch (err) {
            console.error('Failed to log water:', err);
        } finally {
            setLoading(false);
        }
    };

    const glassesTarget = 10; // 10 glasses of 250ml = 2.5L
    const glassesCompleted = Math.min(Math.ceil(waterData.total_ml / 250), glassesTarget);

    return (
        <div className="water-tracker-card">
            <div className="water-header">
                <h3>💧 Water Intake</h3>
                <span className="water-target">{waterData.total_ml}ml / {waterData.target_ml}ml</span>
            </div>

            <div className="water-progress-bar">
                <div
                    className="water-progress-fill"
                    style={{ width: `${Math.min(waterData.percentage, 100)}%` }}
                />
            </div>

            <div className="water-glasses">
                {[...Array(glassesTarget)].map((_, i) => (
                    <button
                        key={i}
                        className={`water-glass ${i < glassesCompleted ? 'filled' : ''}`}
                        onClick={() => logWater(250)}
                        disabled={loading}
                        title="Click to add a glass (250ml)"
                    >
                        🥤
                    </button>
                ))}
            </div>

            <div className="water-actions">
                <button
                    className="water-btn small"
                    onClick={() => logWater(150)}
                    disabled={loading}
                >
                    +150ml
                </button>
                <button
                    className="water-btn"
                    onClick={() => logWater(250)}
                    disabled={loading}
                >
                    +250ml (Glass)
                </button>
                <button
                    className="water-btn large"
                    onClick={() => logWater(500)}
                    disabled={loading}
                >
                    +500ml (Bottle)
                </button>
            </div>

            {waterData.percentage < 50 && (
                <div className="water-reminder">
                    💡 Tip: Staying hydrated helps manage blood sugar levels!
                </div>
            )}

            {waterData.percentage >= 100 && (
                <div className="water-success">
                    ✅ Great job! You've reached your daily water goal!
                </div>
            )}
        </div>
    );
};

export default WaterTracker;
