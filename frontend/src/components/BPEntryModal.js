/**
 * BP Entry Modal Component
 * Log blood pressure readings with category classification
 */

import { useState } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { X, HeartPulse, Save, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import './LogEntryModal.css';

const BPEntryModal = ({ isOpen, onClose, onSuccess, token }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        systolic: '',
        diastolic: '',
        pulse: '',
        context: 'morning',
        notes: ''
    });

    const resetForm = () => {
        setFormData({
            systolic: '',
            diastolic: '',
            pulse: '',
            context: 'morning',
            notes: ''
        });
        setError('');
        setShowResult(false);
        setResult(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Classify BP based on AHA guidelines
    const classifyBP = (systolic, diastolic) => {
        if (systolic >= 180 || diastolic >= 120) {
            return {
                category: t('Hypertensive Crisis'),
                color: '#dc2626',
                icon: <AlertTriangle size={24} color="#dc2626" />,
                message: t('URGENT: Seek immediate medical attention!'),
                severe: true
            };
        } else if (systolic >= 140 || diastolic >= 90) {
            return {
                category: t('Stage 2 Hypertension'),
                color: '#ef4444',
                icon: <AlertTriangle size={24} color="#ef4444" />,
                message: t('High blood pressure. Consult your doctor about medication adjustments.'),
                severe: false
            };
        } else if (systolic >= 130 || diastolic >= 80) {
            return {
                category: t('Stage 1 Hypertension'),
                color: '#f59e0b',
                icon: <AlertTriangle size={24} color="#f59e0b" />,
                message: t('Elevated. Focus on lifestyle modifications.'),
                severe: false
            };
        } else if (systolic >= 120 && diastolic < 80) {
            return {
                category: t('Elevated'),
                color: '#eab308',
                icon: <Info size={24} color="#eab308" />,
                message: t('Slightly elevated. Monitor regularly and maintain healthy habits.'),
                severe: false
            };
        } else {
            return {
                category: t('Normal'),
                color: '#06B6D4',
                icon: <CheckCircle size={24} color="#06B6D4" />,
                message: t('Great! Your blood pressure is in the healthy range.'),
                severe: false
            };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const sys = parseInt(formData.systolic);
        const dia = parseInt(formData.diastolic);

        if (sys < 60 || sys > 250 || dia < 40 || dia > 150) {
            setError(t('Please enter valid blood pressure values'));
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(apiUrl('/logs/bp'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    systolic: sys,
                    diastolic: dia,
                    pulse: formData.pulse ? parseInt(formData.pulse) : null,
                    reading_context: formData.context,
                    notes: formData.notes
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || t('Failed to log BP reading'));
            }

            const classification = classifyBP(sys, dia);
            setResult({
                systolic: sys,
                diastolic: dia,
                pulse: formData.pulse ? parseInt(formData.pulse) : null,
                ...classification,
                ...data
            });
            setShowResult(true);

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

    const getContextIcon = (ctx) => {
        switch (ctx) {
            case 'morning': return '🌅';
            case 'afternoon': return '☀️';
            case 'evening': return '🌙';
            case 'after_meal': return '🍽️';
            default: return '🕒';
        }
    };

    const getContextLabel = (ctx) => {
        switch (ctx) {
            case 'morning': return t('Morning');
            case 'afternoon': return t('Afternoon');
            case 'evening': return t('Evening');
            case 'after_meal': return t('After Meal');
            default: return ctx;
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content bp-entry-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><HeartPulse size={20} color="#06B6D4" style={{ marginRight: '10px' }} /> {t('Log Blood Pressure')}</h2>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="modal-error">{error}</div>}

                {!showResult ? (
                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="context-tabs">
                            {['morning', 'afternoon', 'evening', 'after_meal'].map(ctx => (
                                <button
                                    key={ctx}
                                    type="button"
                                    className={`context-tab ${formData.context === ctx ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, context: ctx })}
                                >
                                    {getContextIcon(ctx)} {getContextLabel(ctx)}
                                </button>
                            ))}
                        </div>

                        <div className="bp-input-group">
                            <div className="bp-input-container">
                                <label>{t('Systolic (upper)')}</label>
                                <input
                                    type="number"
                                    value={formData.systolic}
                                    onChange={e => setFormData({ ...formData, systolic: e.target.value })}
                                    placeholder="120"
                                    min="60"
                                    max="250"
                                    required
                                />
                                <span className="bp-unit">mmHg</span>
                            </div>
                            <span className="bp-separator">/</span>
                            <div className="bp-input-container">
                                <label>{t('Diastolic (lower)')}</label>
                                <input
                                    type="number"
                                    value={formData.diastolic}
                                    onChange={e => setFormData({ ...formData, diastolic: e.target.value })}
                                    placeholder="80"
                                    min="40"
                                    max="150"
                                    required
                                />
                                <span className="bp-unit">mmHg</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('Pulse Rate (optional)')}</label>
                            <input
                                type="number"
                                value={formData.pulse}
                                onChange={e => setFormData({ ...formData, pulse: e.target.value })}
                                placeholder="72"
                                min="40"
                                max="200"
                            />
                            <span className="input-suffix">bpm</span>
                        </div>

                        <div className="form-group">
                            <label>{t('Notes (optional)')}</label>
                            <input
                                type="text"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={t('e.g., After medication, felt relaxed')}
                            />
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? t('Saving...') : <><Save size={18} /> {t('Save Reading')}</>}
                        </button>
                    </form>
                ) : (
                    <div className="bp-result">
                        <div
                            className={`bp-result-card ${result.severe ? 'severe' : ''}`}
                            style={{ borderColor: result.color }}
                        >
                            <div className="bp-result-icon">{result.icon}</div>
                            <div className="bp-result-values">
                                <span className="bp-large">{result.systolic}/{result.diastolic}</span>
                                <span className="bp-unit-large">mmHg</span>
                            </div>
                            {result.pulse && (
                                <div className="bp-pulse">
                                    <HeartPulse size={16} color="#ef4444" style={{ display: 'inline', marginRight: '4px' }} />
                                    {result.pulse} bpm
                                </div>
                            )}
                            <div
                                className="bp-category-badge"
                                style={{ backgroundColor: result.color }}
                            >
                                {result.category}
                            </div>
                            <p className="bp-message">{result.message}</p>
                        </div>

                        {result.severe && (
                            <div className="emergency-alert">
                                <AlertTriangle className="alert-icon" color="#dc2626" size={24} />
                                <div>
                                    <strong>{t('Hypertensive Crisis')}</strong>
                                    <p>{t('Your blood pressure reading is dangerously high.')}
                                        <br />{t('Please seek immediate medical attention or call emergency services.')}</p>
                                </div>
                            </div>
                        )}

                        <div className="bp-reference">
                            <h4>{t('BP Categories (AHA Guidelines)')}</h4>
                            <div className="bp-ref-list">
                                <div className="bp-ref-item"><span style={{ color: '#06B6D4' }}>●</span> {t('Normal')}: &lt;120 / &lt;80</div>
                                <div className="bp-ref-item"><span style={{ color: '#eab308' }}>●</span> {t('Elevated')}: 120-129 / &lt;80</div>
                                <div className="bp-ref-item"><span style={{ color: '#f59e0b' }}>●</span> {t('Stage 1')}: 130-139 / 80-89</div>
                                <div className="bp-ref-item"><span style={{ color: '#ef4444' }}>●</span> {t('Stage 2')}: ≥140 / ≥90</div>
                                <div className="bp-ref-item"><span style={{ color: '#dc2626' }}>●</span> {t('Crisis')}: &gt;180 / &gt;120</div>
                            </div>
                        </div>

                        <button className="btn-submit" onClick={handleClose}>
                            {t('Done')}
                        </button>
                    </div>
                )}

                <div className="modal-disclaimer">
                    {t('This is for tracking purposes only. Always consult your healthcare provider for medical advice.')}
                </div>
            </div>
        </div>
    );
};

export default BPEntryModal;
