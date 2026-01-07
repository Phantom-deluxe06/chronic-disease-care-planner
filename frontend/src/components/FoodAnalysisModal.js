/**
 * Food Analysis Modal Component
 * AI-assisted food logging with nutritional analysis
 */

import { useState } from 'react';
import './LogEntryModal.css';

const FoodAnalysisModal = ({ isOpen, onClose, onSuccess, token }) => {
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
            const response = await fetch('http://localhost:8000/food/analyze', {
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

    const getRiskColor = (level) => {
        switch (level) {
            case 'low': return '#22c55e';
            case 'medium': return '#f59e0b';
            case 'high': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content food-analysis-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🍽️ AI Food Analysis</h2>
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
                            placeholder="e.g., 2 rotis with dal and vegetables"
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
                        {loading ? 'Analyzing...' : '🔍 Analyze Food'}
                    </button>
                </form>

                {analysis && (
                    <div className="food-analysis-results">
                        <h4>📊 Nutritional Analysis</h4>

                        <div className="nutrition-grid">
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.calories}</span>
                                <span className="nutrition-label">Calories</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.carbohydrates_g}g</span>
                                <span className="nutrition-label">Carbs</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.sugar_g}g</span>
                                <span className="nutrition-label">Sugar</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.fiber_g}g</span>
                                <span className="nutrition-label">Fiber</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.protein_g}g</span>
                                <span className="nutrition-label">Protein</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.glycemic_index}</span>
                                <span className="nutrition-label">GI</span>
                            </div>
                        </div>

                        <div className="glucose-risk" style={{ borderColor: getRiskColor(analysis.glucose_spike_risk.level) }}>
                            <div className="risk-header">
                                <span className="risk-icon">📈</span>
                                <span className="risk-label">Glucose Spike Risk:</span>
                                <span
                                    className="risk-level"
                                    style={{ color: getRiskColor(analysis.glucose_spike_risk.level) }}
                                >
                                    {analysis.glucose_spike_risk.level.toUpperCase()}
                                </span>
                            </div>
                            {analysis.glucose_spike_risk.factors.length > 0 && (
                                <ul className="risk-factors">
                                    {analysis.glucose_spike_risk.factors.map((factor, i) => (
                                        <li key={i}>{factor}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className={`meal-suitability ${analysis.meal_suitability.suitable ? 'suitable' : 'caution'}`}>
                            <h5>
                                {analysis.meal_suitability.suitable ? '✅' : '⚠️'}
                                {' '}Meal Rating: {analysis.meal_suitability.rating}
                            </h5>

                            {analysis.meal_suitability.positives.length > 0 && (
                                <ul className="positives">
                                    {analysis.meal_suitability.positives.map((p, i) => (
                                        <li key={i}>👍 {p}</li>
                                    ))}
                                </ul>
                            )}

                            {analysis.meal_suitability.improvements.length > 0 && (
                                <ul className="improvements">
                                    {analysis.meal_suitability.improvements.map((imp, i) => (
                                        <li key={i}>💡 {imp}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="modal-disclaimer">
                            {analysis.disclaimer}
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

export default FoodAnalysisModal;
