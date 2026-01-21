/**
 * Food Analysis Modal Component
 * AI-assisted food logging with nutritional analysis
 */

import { useState, useEffect } from 'react';
import './LogEntryModal.css';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { X, Search, Utensils, Zap, CheckCircle, AlertTriangle, Info, BarChart3 } from 'lucide-react';

const FoodAnalysisModal = ({ isOpen, onClose, onSuccess, token }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const { t, translateAsync, language } = useLanguage();

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

    const translateAnalysis = async (data) => {
        if (language === 'en') return data;

        try {
            const translatedFactors = await Promise.all(
                (data.glucose_spike_risk.factors || []).map(f => translateAsync(f))
            );
            const translatedPositives = await Promise.all(
                (data.meal_suitability.positives || []).map(p => translateAsync(p))
            );
            const translatedImprovements = await Promise.all(
                (data.meal_suitability.improvements || []).map(imp => translateAsync(imp))
            );
            const translatedDisclaimer = await translateAsync(data.disclaimer);

            return {
                ...data,
                glucose_spike_risk: {
                    ...data.glucose_spike_risk,
                    factors: translatedFactors
                },
                meal_suitability: {
                    ...data.meal_suitability,
                    positives: translatedPositives,
                    improvements: translatedImprovements
                },
                disclaimer: translatedDisclaimer
            };
        } catch (err) {
            console.error('Failed to translate analysis:', err);
            return data;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await fetch(apiUrl('/food/analyze'), {
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
                throw new Error(data.detail || t('Failed to analyze food'));
            }

            const translatedData = await translateAnalysis(data);
            setAnalysis(translatedData);

            if (onSuccess) {
                onSuccess(translatedData);
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
            case 'low': return '#06B6D4';
            case 'medium': return '#f59e0b';
            case 'high': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getMealIcon = (type) => {
        switch (type) {
            case 'breakfast': return '🌅';
            case 'lunch': return '☀️';
            case 'dinner': return '🌙';
            case 'snack': return '🍎';
            default: return '🍽️';
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content food-analysis-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Utensils size={20} color="#06B6D4" style={{ marginRight: '10px' }} /> {t('AI Food Analysis')}</h2>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
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
                                {getMealIcon(type)} {t(type.charAt(0).toUpperCase() + type.slice(1))}
                            </button>
                        ))}
                    </div>

                    <div className="form-group">
                        <label>{t('What did you eat?')}</label>
                        <input
                            type="text"
                            value={foodDescription}
                            onChange={e => setFoodDescription(e.target.value)}
                            placeholder={t('e.g., 2 rotis with dal and vegetables')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('Quantity/Portion')}</label>
                        <select value={quantity} onChange={e => setQuantity(e.target.value)}>
                            <option value="small serving">{t('Small serving')}</option>
                            <option value="half serving">{t('Half serving')}</option>
                            <option value="1 serving">{t('1 serving (regular)')}</option>
                            <option value="large serving">{t('Large serving')}</option>
                            <option value="2 servings">{t('2 servings')}</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-submit analyze-btn" disabled={loading}>
                        {loading ? t('Analyzing...') : <><Search size={18} /> {t('Analyze Food')}</>}
                    </button>
                </form>

                {analysis && (
                    <div className="food-analysis-results">
                        <h4><BarChart3 size={18} color="#06B6D4" style={{ marginRight: '8px' }} /> {t('Nutritional Analysis')}</h4>

                        <div className="nutrition-grid">
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.calories}</span>
                                <span className="nutrition-label">{t('Calories')}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.carbohydrates_g}g</span>
                                <span className="nutrition-label">{t('Carbs')}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.sugar_g}g</span>
                                <span className="nutrition-label">{t('Sugar')}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.fiber_g}g</span>
                                <span className="nutrition-label">{t('Fiber')}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.protein_g}g</span>
                                <span className="nutrition-label">{t('Protein')}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition.glycemic_index}</span>
                                <span className="nutrition-label">{t('GI')}</span>
                            </div>
                        </div>

                        <div className="glucose-risk" style={{ borderColor: getRiskColor(analysis.glucose_spike_risk.level) }}>
                            <div className="risk-header">
                                <Zap className="risk-icon" size={18} style={{ color: getRiskColor(analysis.glucose_spike_risk.level) }} />
                                <span className="risk-label">{t('Glucose Spike Risk:')}</span>
                                <span
                                    className="risk-level"
                                    style={{ color: getRiskColor(analysis.glucose_spike_risk.level) }}
                                >
                                    {t(analysis.glucose_spike_risk.level.toUpperCase())}
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
                                {analysis.meal_suitability.suitable ? <CheckCircle size={18} color="#22c55e" /> : <AlertTriangle size={18} color="#f59e0b" />}
                                {' '} {t('Meal Rating:')} {analysis.meal_suitability.rating}
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
                            <Info size={14} style={{ marginRight: '6px' }} />
                            {analysis.disclaimer}
                        </div>

                        <button className="btn-submit" onClick={handleClose}>
                            {t('Done')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FoodAnalysisModal;
