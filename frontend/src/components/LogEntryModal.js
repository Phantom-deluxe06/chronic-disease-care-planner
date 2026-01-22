/**
 * Log Entry Modal Component
 * Allows users to log glucose, BP, food, and activity data
 */

import { useState } from 'react';
import './LogEntryModal.css';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { X, AlertTriangle, Droplet, HeartPulse, Utensils, Activity, Save } from 'lucide-react';

const LogEntryModal = ({ isOpen, onClose, logType, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [alert, setAlert] = useState('');
    const { t } = useLanguage();

    // Form states for different log types
    const [glucoseValue, setGlucoseValue] = useState('');
    const [readingType, setReadingType] = useState('fasting');

    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');

    const [calories, setCalories] = useState('');
    const [mealType, setMealType] = useState('breakfast');
    const [foodDescription, setFoodDescription] = useState('');

    const [duration, setDuration] = useState('');
    const [activityType, setActivityType] = useState('walking');
    const [intensity, setIntensity] = useState('moderate');

    const [notes, setNotes] = useState('');

    const resetForm = () => {
        setGlucoseValue('');
        setReadingType('fasting');
        setSystolic('');
        setDiastolic('');
        setCalories('');
        setMealType('breakfast');
        setFoodDescription('');
        setDuration('');
        setActivityType('walking');
        setIntensity('moderate');
        setNotes('');
        setError('');
        setAlert('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setAlert('');

        const token = localStorage.getItem('token');
        if (!token) {
            setError(t('Please log in to continue'));
            setLoading(false);
            return;
        }

        let endpoint = '';
        let body = {};
        let glucoseValueNum = 0;

        switch (logType) {
            case 'glucose':
                endpoint = '/logs/glucose';
                glucoseValueNum = parseFloat(glucoseValue);
                body = {
                    value: glucoseValueNum,
                    reading_type: readingType,
                    notes: notes || null
                };
                break;
            case 'bp':
                endpoint = '/logs/bp';
                body = {
                    systolic: parseFloat(systolic),
                    diastolic: parseFloat(diastolic),
                    notes: notes || null
                };
                break;
            case 'food':
                endpoint = '/logs/food';
                body = {
                    calories: parseFloat(calories),
                    meal_type: mealType,
                    description: foodDescription || null,
                    notes: notes || null
                };
                break;
            case 'activity':
                endpoint = '/logs/activity';
                body = {
                    duration_minutes: parseFloat(duration),
                    activity_type: activityType,
                    intensity: intensity,
                    notes: notes || null
                };
                break;
            default:
                setError(t('Invalid log type'));
                setLoading(false);
                return;
        }

        try {
            const response = await fetch(apiUrl(endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || t('Failed to save log'));
            }

            // Check for health alerts
            if (data.alert) {
                setAlert(data.alert);
            }

            // Check for SOS alert conditions
            let sosAlert = null;

            // Glucose SOS - Critical blood sugar levels
            if (logType === 'glucose' && glucoseValueNum > 0) {
                if (glucoseValueNum < 70) {
                    sosAlert = {
                        trigger: true,
                        severity: 'severe',
                        type: 'low',
                        message: `Critical LOW blood sugar: ${glucoseValueNum} mg/dL! This is a medical emergency.`,
                        action: 'Consume 15-20g of fast-acting carbs immediately (glucose tablets, juice, or candy). Recheck in 15 minutes.'
                    };
                } else if (glucoseValueNum > 250) {
                    sosAlert = {
                        trigger: true,
                        severity: 'severe',
                        type: 'high',
                        message: `Critical HIGH blood sugar: ${glucoseValueNum} mg/dL! This requires immediate attention.`,
                        action: 'Check for ketones if possible. Drink water, avoid carbs, and contact your healthcare provider immediately.'
                    };
                }
            }

            // Food SOS - High calorie/carb intake (hyperglycemia risk)
            if (logType === 'food') {
                const calorieValue = parseFloat(calories);
                if (calorieValue > 1000) {
                    sosAlert = {
                        trigger: true,
                        severity: 'warning',
                        type: 'high_carbs',
                        message: `⚠️ High calorie meal detected: ${calorieValue} kcal! This may cause hyperglycemia.`,
                        action: 'Monitor your blood sugar closely over the next 2-3 hours. Consider a light walk after eating to help regulate glucose levels.'
                    };
                } else if (calorieValue > 800) {
                    sosAlert = {
                        trigger: true,
                        severity: 'warning',
                        type: 'moderate_carbs',
                        message: `Moderate-high calorie meal: ${calorieValue} kcal. Watch for elevated blood sugar.`,
                        action: 'Check your blood sugar 1-2 hours after eating. Stay hydrated and avoid additional snacks.'
                    };
                }
            }

            // Activity SOS - Excessive exercise (hypoglycemia risk)
            if (logType === 'activity') {
                const durationValue = parseFloat(duration);
                const isIntense = intensity === 'vigorous';

                if (durationValue > 90 || (durationValue > 60 && isIntense)) {
                    sosAlert = {
                        trigger: true,
                        severity: 'warning',
                        type: 'exercise_hypo',
                        message: `⚠️ Extended ${isIntense ? 'intense ' : ''}exercise: ${durationValue} minutes! Risk of hypoglycemia.`,
                        action: 'Check your blood sugar immediately. Have fast-acting carbs ready. Monitor for symptoms: shakiness, sweating, confusion, rapid heartbeat.'
                    };
                } else if (durationValue > 60) {
                    sosAlert = {
                        trigger: true,
                        severity: 'warning',
                        type: 'exercise_caution',
                        message: `Long exercise session: ${durationValue} minutes. Monitor for low blood sugar.`,
                        action: 'Check blood sugar before next meal. Have a small snack if feeling lightheaded. Stay hydrated.'
                    };
                }
            }

            // Call success callback with SOS alert data if present
            if (onSuccess) {
                onSuccess({
                    ...data,
                    alert: data.alert,
                    sos_alert: sosAlert
                });
            }

            // Close modal if no alert and no SOS
            if (!data.alert && !sosAlert) {
                handleClose();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getTitle = () => {
        switch (logType) {
            case 'glucose': return <><Droplet size={20} color="#06B6D4" /> {t('Log Blood Glucose')}</>;
            case 'bp': return <><HeartPulse size={20} color="#06B6D4" /> {t('Log Blood Pressure')}</>;
            case 'food': return <><Utensils size={20} color="#06B6D4" /> {t('Log Food Intake')}</>;
            case 'activity': return <><Activity size={20} color="#06B6D4" /> {t('Log Activity')}</>;
            default: return t('Log Entry');
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{getTitle()}</h2>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="modal-error">{error}</div>}
                {alert && (
                    <div className="modal-alert">
                        <AlertTriangle className="alert-icon" color="#f59e0b" />
                        <div className="alert-content">
                            <strong>{t('Health Alert')}</strong>
                            <p>{alert}</p>
                        </div>
                        <button className="alert-dismiss" onClick={handleClose}>
                            {t('I Understand')}
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Glucose Form */}
                    {logType === 'glucose' && (
                        <>
                            <div className="form-group">
                                <label>{t('Blood Glucose (mg/dL)')}</label>
                                <input
                                    type="number"
                                    value={glucoseValue}
                                    onChange={e => setGlucoseValue(e.target.value)}
                                    placeholder="e.g., 120"
                                    required
                                    min="20"
                                    max="600"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('Reading Type')}</label>
                                <select
                                    value={readingType}
                                    onChange={e => setReadingType(e.target.value)}
                                >
                                    <option value="fasting">{t('Fasting (before meal)')}</option>
                                    <option value="after_meal">{t('After Meal')}</option>
                                    <option value="random">{t('Random')}</option>
                                    <option value="bedtime">{t('Bedtime')}</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Blood Pressure Form */}
                    {logType === 'bp' && (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('Systolic (top number)')}</label>
                                    <input
                                        type="number"
                                        value={systolic}
                                        onChange={e => setSystolic(e.target.value)}
                                        placeholder="e.g., 120"
                                        required
                                        min="60"
                                        max="250"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('Diastolic (bottom number)')}</label>
                                    <input
                                        type="number"
                                        value={diastolic}
                                        onChange={e => setDiastolic(e.target.value)}
                                        placeholder="e.g., 80"
                                        required
                                        min="40"
                                        max="150"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Food Form */}
                    {logType === 'food' && (
                        <>
                            <div className="form-group">
                                <label>{t('Meal Type')}</label>
                                <select
                                    value={mealType}
                                    onChange={e => setMealType(e.target.value)}
                                >
                                    <option value="breakfast">{t('Breakfast')}</option>
                                    <option value="lunch">{t('Lunch')}</option>
                                    <option value="dinner">{t('Dinner')}</option>
                                    <option value="snack">{t('Snack')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('Calories (estimated)')}</label>
                                <input
                                    type="number"
                                    value={calories}
                                    onChange={e => setCalories(e.target.value)}
                                    placeholder="e.g., 500"
                                    required
                                    min="0"
                                    max="5000"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('Description (optional)')}</label>
                                <input
                                    type="text"
                                    value={foodDescription}
                                    onChange={e => setFoodDescription(e.target.value)}
                                    placeholder="e.g., Grilled chicken salad"
                                />
                            </div>
                        </>
                    )}

                    {/* Activity Form */}
                    {logType === 'activity' && (
                        <>
                            <div className="form-group">
                                <label>{t('Activity Type')}</label>
                                <select
                                    value={activityType}
                                    onChange={e => setActivityType(e.target.value)}
                                >
                                    <option value="walking">{t('Walking')}</option>
                                    <option value="running">{t('Running')}</option>
                                    <option value="cycling">{t('Cycling')}</option>
                                    <option value="swimming">{t('Swimming')}</option>
                                    <option value="yoga">{t('Yoga')}</option>
                                    <option value="strength_training">{t('Strength Training')}</option>
                                    <option value="stretching">{t('Stretching')}</option>
                                    <option value="other">{t('Other')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('Duration (minutes)')}</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    placeholder="e.g., 30"
                                    required
                                    min="1"
                                    max="480"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('Intensity')}</label>
                                <select
                                    value={intensity}
                                    onChange={e => setIntensity(e.target.value)}
                                >
                                    <option value="light">{t('Light')}</option>
                                    <option value="moderate">{t('Moderate')}</option>
                                    <option value="vigorous">{t('Vigorous')}</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Notes field for all types */}
                    <div className="form-group">
                        <label>{t('Notes (optional)')}</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder={t('Any additional notes...')}
                            rows="2"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={handleClose}>
                            {t('Cancel')}
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? t('Saving...') : <><Save size={18} /> {t('Save Log')}</>}
                        </button>
                    </div>
                </form>

                <div className="modal-disclaimer">
                    {t('This is not medical advice. Always consult your healthcare provider.')}
                </div>
            </div>
        </div>
    );
};

export default LogEntryModal;
