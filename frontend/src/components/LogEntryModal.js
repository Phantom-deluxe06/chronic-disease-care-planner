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

        switch (logType) {
            case 'glucose':
                endpoint = '/logs/glucose';
                body = {
                    value: parseFloat(glucoseValue),
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

            // Call success callback
            if (onSuccess) {
                onSuccess(data);
            }

            // Close modal if no alert
            if (!data.alert) {
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
