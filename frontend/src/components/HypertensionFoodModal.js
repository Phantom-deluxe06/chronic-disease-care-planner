/**
 * Hypertension Food Modal Component
 * AI-assisted food logging with sodium focus for DASH diet
 */

import { useState } from 'react';
import './LogEntryModal.css';
import { apiUrl } from '../config/api';

const HypertensionFoodModal = ({ isOpen, onClose, onSuccess, token }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);

    const [foodDescription, setFoodDescription] = useState('');
    const [quantity, setQuantity] = useState('1 serving');
    const [mealType, setMealType] = useState('breakfast');

    const resetForm = () => {
        setFoodDescription('');
        setQuantity('1 serving');
        setMealType('breakfast');
        setError('');
        setAnalysis(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await fetch(apiUrl('/food/analyze-hypertension'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    food_description: foodDescription,
                    quantity: quantity,
                    meal_type: mealType
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to analyze food');
            }

            setAnalysis(data);
            if (onSuccess) {
                onSuccess(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getSodiumColor = (mg) => {
        if (mg < 400) return '#22c55e';
        if (mg < 800) return '#f59e0b';
        return '#ef4444';
    };

    const getSodiumLevel = (mg) => {
        if (mg < 400) return 'Low';
        if (mg < 800) return 'Moderate';
        return 'High';
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content food-analysis-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🥗 DASH Diet Food Analysis</h2>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>

                {error && <div className="modal-error">{error}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="meal-type-tabs">
                        {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                            <button
                                key={type}
                                type="button"
                                className={`meal-tab ${mealType === type ? 'active' : ''}`}
                                onClick={() => setMealType(type)}
                            >
                                {type === 'breakfast' && '🌅 '}
                                {type === 'lunch' && '☀️ '}
                                {type === 'dinner' && '🌙 '}
                                {type === 'snack' && '🍎 '}
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="form-group">
                        <label>What did you eat?</label>
                        <input
                            type="text"
                            value={foodDescription}
                            onChange={e => setFoodDescription(e.target.value)}
                            placeholder="e.g., rice with sambar and vegetables"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Quantity/Portion</label>
                        <select value={quantity} onChange={e => setQuantity(e.target.value)}>
                            <option value="small serving">Small serving</option>
                            <option value="half serving">Half serving</option>
                            <option value="1 serving">1 serving (regular)</option>
                            <option value="large serving">Large serving</option>
                            <option value="2 servings">2 servings</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-submit analyze-btn" disabled={loading}>
                        {loading ? 'Analyzing...' : '🔍 Analyze for Sodium'}
                    </button>
                </form>

                {analysis && (
                    <div className="food-analysis-results">
                        <h4>📊 Nutritional Analysis (DASH Focus)</h4>

                        <div className="nutrition-grid">
                            <div className="nutrition-item sodium-highlight" style={{ borderColor: getSodiumColor(analysis.nutrition?.sodium_mg || 0) }}>
                                <span className="nutrition-value" style={{ color: getSodiumColor(analysis.nutrition?.sodium_mg || 0) }}>
                                    {analysis.nutrition?.sodium_mg || 0}mg
                                </span>
                                <span className="nutrition-label">Sodium 🧂</span>
                                <span className="nutrition-status" style={{ color: getSodiumColor(analysis.nutrition?.sodium_mg || 0) }}>
                                    {getSodiumLevel(analysis.nutrition?.sodium_mg || 0)}
                                </span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.potassium_mg || 0}mg</span>
                                <span className="nutrition-label">Potassium 🍌</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.calories || 0}</span>
                                <span className="nutrition-label">Calories</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.saturated_fat_g || 0}g</span>
                                <span className="nutrition-label">Sat. Fat</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.fiber_g || 0}g</span>
                                <span className="nutrition-label">Fiber</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.protein_g || 0}g</span>
                                <span className="nutrition-label">Protein</span>
                            </div>
                        </div>

                        {/* Sodium Warning */}
                        {analysis.nutrition?.sodium_mg >= 800 && (
                            <div className="sodium-warning">
                                <span className="warning-icon">⚠️</span>
                                <div>
                                    <strong>High Sodium Alert</strong>
                                    <p>This meal is high in sodium. Consider reducing processed foods and adding more fresh vegetables.</p>
                                </div>
                            </div>
                        )}

                        {/* DASH Compliance */}
                        <div className={`dash-compliance ${analysis.dash_compliant ? 'good' : 'needs-improvement'}`}>
                            <h5>
                                {analysis.dash_compliant ? '✅' : '⚠️'}
                                {' '}DASH Diet Compliance: {analysis.dash_score || 'Moderate'}
                            </h5>

                            {analysis.positives && analysis.positives.length > 0 && (
                                <ul className="positives">
                                    {analysis.positives.map((p, i) => (
                                        <li key={i}>👍 {p}</li>
                                    ))}
                                </ul>
                            )}

                            {analysis.improvements && analysis.improvements.length > 0 && (
                                <ul className="improvements">
                                    {analysis.improvements.map((imp, i) => (
                                        <li key={i}>💡 {imp}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Daily Sodium Tracker */}
                        <div className="daily-sodium">
                            <h5>📊 Today's Sodium Intake</h5>
                            <div className="sodium-progress">
                                <div className="sodium-bar">
                                    <div
                                        className="sodium-fill"
                                        style={{
                                            width: `${Math.min((analysis.daily_sodium || 0) / 2300 * 100, 100)}%`,
                                            backgroundColor: (analysis.daily_sodium || 0) > 2300 ? '#ef4444' : '#10b981'
                                        }}
                                    />
                                </div>
                                <div className="sodium-labels">
                                    <span>{analysis.daily_sodium || 0}mg consumed</span>
                                    <span>Target: &lt;2,300mg</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-disclaimer">
                            {analysis.disclaimer || "AI estimates are approximate. Actual values may vary."}
                        </div>

                        <button className="btn-submit" onClick={handleClose}>
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HypertensionFoodModal;
