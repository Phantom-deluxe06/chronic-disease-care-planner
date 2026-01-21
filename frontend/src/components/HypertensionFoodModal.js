/**
 * Hypertension Food Modal Component
 * AI-assisted food logging with sodium focus for DASH diet
 */

import { useState } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { X, Search, Utensils, Zap, CheckCircle, AlertTriangle, Info, BarChart3 } from 'lucide-react';
import './LogEntryModal.css';

const HypertensionFoodModal = ({ isOpen, onClose, onSuccess, token }) => {
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
            const translatedPositives = await Promise.all(
                (data.positives || []).map(p => translateAsync(p))
            );
            const translatedImprovements = await Promise.all(
                (data.improvements || []).map(imp => translateAsync(imp))
            );
            const translatedDisclaimer = await translateAsync(data.disclaimer || t('AI estimates are approximate. Actual values may vary.'));

            return {
                ...data,
                positives: translatedPositives,
                improvements: translatedImprovements,
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

    const getSodiumColor = (mg) => {
        if (mg < 400) return '#06B6D4';
        if (mg < 800) return '#f59e0b';
        return '#ef4444';
    };

    const getSodiumLevel = (mg) => {
        if (mg < 400) return t('Low');
        if (mg < 800) return t('Moderate');
        return t('High');
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
                    <h2><Utensils size={20} color="#06B6D4" style={{ marginRight: '10px' }} /> {t('DASH Diet Food Analysis')}</h2>
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
                            placeholder={t('e.g., rice with sambar and vegetables')}
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
                        {loading ? t('Analyzing...') : <><Search size={18} /> {t('Analyze for Sodium')}</>}
                    </button>
                </form>

                {analysis && (
                    <div className="food-analysis-results">
                        <h4><BarChart3 size={18} color="#06B6D4" style={{ marginRight: '8px' }} /> {t('Nutritional Analysis (DASH Focus)')}</h4>

                        <div className="nutrition-grid">
                            <div className="nutrition-item sodium-highlight" style={{ borderColor: getSodiumColor(analysis.nutrition?.sodium_mg || 0) }}>
                                <span className="nutrition-value" style={{ color: getSodiumColor(analysis.nutrition?.sodium_mg || 0) }}>
                                    {analysis.nutrition?.sodium_mg || 0}mg
                                </span>
                                <span className="nutrition-label">{t('Sodium')} 🧂</span>
                                <span className="nutrition-status" style={{ color: getSodiumColor(analysis.nutrition?.sodium_mg || 0) }}>
                                    {getSodiumLevel(analysis.nutrition?.sodium_mg || 0)}
                                </span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.potassium_mg || 0}mg</span>
                                <span className="nutrition-label">{t('Potassium')} 🍌</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.calories || 0}</span>
                                <span className="nutrition-label">{t('Calories')}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.saturated_fat_g || 0}g</span>
                                <span className="nutrition-label">{t('Sat. Fat')}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.fiber_g || 0}g</span>
                                <span className="nutrition-label">{t('Fiber')}</span>
                            </div>
                            <div className="nutrition-item">
                                <span className="nutrition-value">{analysis.nutrition?.protein_g || 0}g</span>
                                <span className="nutrition-label">{t('Protein')}</span>
                            </div>
                        </div>

                        {/* Sodium Warning */}
                        {analysis.nutrition?.sodium_mg >= 800 && (
                            <div className="sodium-warning">
                                <AlertTriangle className="warning-icon" size={24} color="#ef4444" />
                                <div>
                                    <strong>{t('High Sodium Alert')}</strong>
                                    <p>{t('This meal is high in sodium. Consider reducing processed foods and adding more fresh vegetables.')}</p>
                                </div>
                            </div>
                        )}

                        {/* DASH Compliance */}
                        <div className={`dash-compliance ${analysis.dash_compliant ? 'good' : 'needs-improvement'}`}>
                            <h5>
                                {analysis.dash_compliant ? <CheckCircle size={18} color="#22c55e" /> : <AlertTriangle size={18} color="#f59e0b" />}
                                {' '} {t('DASH Diet Compliance:')} {t(analysis.dash_score || 'Moderate')}
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
                            <h5><BarChart3 size={16} /> {t('Today\'s Sodium Intake')}</h5>
                            <div className="sodium-progress">
                                <div className="sodium-bar">
                                    <div
                                        className="sodium-fill"
                                        style={{
                                            width: `${Math.min((analysis.daily_sodium || 0) / 2300 * 100, 100)}%`,
                                            backgroundColor: (analysis.daily_sodium || 0) > 2300 ? '#ef4444' : '#06B6D4'
                                        }}
                                    />
                                </div>
                                <div className="sodium-labels">
                                    <span>{t('{amount}mg consumed').replace('{amount}', analysis.daily_sodium || 0)}</span>
                                    <span>{t('Target: <2,300mg')}</span>
                                </div>
                            </div>
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

export default HypertensionFoodModal;
