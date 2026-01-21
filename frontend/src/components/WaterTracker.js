/**
 * Water Tracker Component
 * Visual water intake tracking with animated water circle
 */

import { useState, useEffect } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { Droplet, Plus, Info } from 'lucide-react';

const WaterTracker = ({ token }) => {
    const [glasses, setGlasses] = useState(0);
    const [goal] = useState(8);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchWater = async () => {
            try {
                const response = await fetch(apiUrl('/water/today'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setGlasses(data.glasses || 0);
                }
            } catch (err) {
                console.error('Failed to fetch water intake:', err);
            }
        };

        if (token) fetchWater();
    }, [token]);

    const addWater = async (count = 1) => {
        try {
            const response = await fetch(apiUrl('/water/add'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ glasses: count })
            });

            if (response.ok) {
                const data = await response.json();
                setGlasses(data.total_glasses);
            }
        } catch (err) {
            console.error('Failed to add water:', err);
        }
    };

    const percentage = Math.min((glasses / goal) * 100, 100);

    return (
        <div className="water-tracker">
            <div className="tracker-header">
                <h3><Droplet size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Water Intake')}</h3>
                <span className="goal-text">{t('Daily Goal: 8 glasses')}</span>
            </div>

            <div className="water-progress-container">
                <div className="water-level-circle">
                    <div className="water-wave" style={{ height: `${percentage}%` }}></div>
                    <div className="water-count">
                        <span className="current">{glasses}</span>
                        <span className="total">/ {goal}</span>
                    </div>
                </div>

                <div className="water-info">
                    <p className="status-msg">
                        {glasses >= goal ? t('Goal reached! Great job!') : t('Stay hydrated for better glucose control.')}
                    </p>
                    <div className="water-actions">
                        <button className="add-water-btn" onClick={() => addWater(1)}>
                            <Plus size={16} /> {t('Add Glass')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="water-stats-mini">
                <Info size={14} style={{ marginRight: '6px' }} />
                <span>{t('Today\'s Intake:')} {glasses} {t('glasses')}</span>
            </div>
        </div>
    );
};

export default WaterTracker;
