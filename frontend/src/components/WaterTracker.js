/**
 * Water Tracker Component
 * Visual water intake tracking with animated water bottle
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

    const fillPercentage = Math.min(waterData.percentage, 100);
    const isGoalReached = waterData.percentage >= 100;

    return (
        <div className="water-tracker-card">
            <div className="water-header">
                <h3>💧 Water Intake</h3>
            </div>

            {/* Water Bottle Visualization */}
            <div className="water-bottle-container">
                <svg className="water-bottle" viewBox="0 0 100 180" preserveAspectRatio="xMidYMid meet">
                    {/* Bottle cap */}
                    <rect x="35" y="0" width="30" height="15" rx="3" className="bottle-cap" />

                    {/* Bottle neck */}
                    <path
                        d="M 38 15 L 38 30 Q 20 35 20 55 L 20 160 Q 20 175 35 175 L 65 175 Q 80 175 80 160 L 80 55 Q 80 35 62 30 L 62 15"
                        className="bottle-outline"
                        fill="none"
                        strokeWidth="3"
                    />

                    {/* Water fill - clipPath for bottle shape */}
                    <defs>
                        <clipPath id="bottleClip">
                            <path d="M 38 15 L 38 30 Q 20 35 20 55 L 20 160 Q 20 175 35 175 L 65 175 Q 80 175 80 160 L 80 55 Q 80 35 62 30 L 62 15 Z" />
                        </clipPath>
                    </defs>

                    {/* Water fill area */}
                    <g clipPath="url(#bottleClip)">
                        {/* Water fill rectangle - positioned from bottom */}
                        <rect
                            x="20"
                            y={175 - (fillPercentage / 100) * 145}
                            width="60"
                            height={(fillPercentage / 100) * 145}
                            className={`water-fill ${isGoalReached ? 'goal-reached' : ''}`}
                        />

                        {/* Wave animation overlay */}
                        <g className="wave-container" style={{ transform: `translateY(${175 - (fillPercentage / 100) * 145 - 5}px)` }}>
                            <path
                                className={`water-wave ${isGoalReached ? 'goal-reached' : ''}`}
                                d="M 20 5 Q 30 0 40 5 T 60 5 T 80 5 T 100 5 L 100 15 L 20 15 Z"
                            />
                        </g>
                    </g>

                    {/* Bottle highlight for 3D effect */}
                    <ellipse cx="30" cy="100" rx="5" ry="40" className="bottle-highlight" />
                </svg>

                {/* Water level text */}
                <div className="water-level-text">
                    <span className="current-amount">{waterData.total_ml}ml</span>
                    <span className="target-amount">/ {waterData.target_ml}ml</span>
                </div>
            </div>

            {/* Quick add buttons */}
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
                    +250ml
                </button>
                <button
                    className="water-btn large"
                    onClick={() => logWater(500)}
                    disabled={loading}
                >
                    +500ml
                </button>
            </div>

            {waterData.percentage < 50 && (
                <div className="water-reminder">
                    💡 Tip: Staying hydrated helps manage blood sugar levels!
                </div>
            )}

            {isGoalReached && (
                <div className="water-success">
                    ✅ Great job! You've reached your daily water goal!
                </div>
            )}
        </div>
    );
};

export default WaterTracker;
