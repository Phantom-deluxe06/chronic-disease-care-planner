/**
 * Preventive Care Component
 * Daily reminders, foot care, travel safety for diabetics
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Bell, Plane, CheckCircle2, X, Clipboard, Info, Heart, Moon, Zap, Star } from 'lucide-react';

const PreventiveCare = ({ token, tips = [] }) => {
    const [reminders, setReminders] = useState(null);
    const [travelChecklist, setTravelChecklist] = useState(null);
    const [showTravelModal, setShowTravelModal] = useState(false);
    const [checkedItems, setCheckedItems] = useState({});
    const { t, translateAsync, language } = useLanguage();

    const translateReminders = async (data) => {
        if (language === 'en' || !data) return data;
        try {
            const translatedDaily = await Promise.all(
                (data.daily_reminders || []).map(async r => ({
                    ...r,
                    title: await translateAsync(r.title),
                    description: await translateAsync(r.description)
                }))
            );
            return { ...data, daily_reminders: translatedDaily };
        } catch (err) {
            console.error('Failed to translate reminders:', err);
            return data;
        }
    };

    const translateTravelChecklist = async (data) => {
        if (language === 'en' || !data) return data;
        try {
            const translatedChecklist = await Promise.all(
                (data.checklist || []).map(async item => ({
                    ...item,
                    item: await translateAsync(item.item),
                    reason: await translateAsync(item.reason)
                }))
            );
            return {
                ...data,
                checklist: translatedChecklist,
                disclaimer: await translateAsync(data.disclaimer)
            };
        } catch (err) {
            console.error('Failed to translate travel checklist:', err);
            return data;
        }
    };

    const fetchReminders = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/reminders'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const translatedData = await translateReminders(data);
                setReminders(translatedData);
            }
        } catch (err) {
            console.error('Failed to fetch reminders:', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, language]);

    const fetchTravelChecklist = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/travel-checklist'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const translatedData = await translateTravelChecklist(data);
                setTravelChecklist(translatedData);
            }
        } catch (err) {
            console.error('Failed to fetch travel checklist:', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, language]);

    useEffect(() => {
        if (token) {
            fetchReminders();
        }
    }, [token, fetchReminders]);

    const toggleCheckItem = (index) => {
        setCheckedItems({
            ...checkedItems,
            [index]: !checkedItems[index]
        });
    };

    const openTravelModal = () => {
        fetchTravelChecklist();
        setShowTravelModal(true);
        setCheckedItems({});
    };

    const lifestyleTips = [
        { icon: <Zap size={18} />, title: t('Avoid Smoking'), desc: t('Smoking increases diabetes complications risk') },
        { icon: <Heart size={18} />, title: t('Limit Alcohol'), desc: t('Alcohol can affect blood sugar levels') },
        { icon: <Star size={18} />, title: t('High-Fiber Diet'), desc: t('Fiber helps control blood sugar spikes') },
        { icon: <Shield size={18} />, title: t('High-Protein Foods'), desc: t('Protein helps maintain stable glucose') },
        { icon: <Moon size={18} />, title: t('Quality Sleep'), desc: t('7-8 hours helps insulin sensitivity') },
        { icon: <Info size={18} />, title: t('Stress Management'), desc: t('Stress raises blood sugar levels') }
    ];

    return (
        <div className="preventive-care">
            <div className="care-header">
                <h3><Shield size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Preventive Care and Tips')}</h3>
            </div>

            {/* Diabetes Tips */}
            {tips && tips.length > 0 && (
                <div className="diabetes-tips-section">
                    <h4><Info size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Diabetes Tips')}</h4>
                    <ul className="diabetes-tips-list">
                        {tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Daily Reminders */}
            {reminders && (
                <div className="daily-reminders">
                    <h4><Bell size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Daily Reminders')}</h4>
                    <div className="reminders-grid">
                        {reminders.daily_reminders.map((reminder, i) => (
                            <div
                                key={i}
                                className={`reminder-card ${reminder.priority}`}
                            >
                                <div className="reminder-title">{reminder.title}</div>
                                <div className="reminder-desc">{reminder.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="care-actions">
                <button
                    className="care-action-btn travel"
                    onClick={openTravelModal}
                >
                    <Plane size={18} style={{ marginRight: '8px' }} /> {t('Travel Checklist')}
                </button>
            </div>

            {/* Travel Modal */}
            {showTravelModal && travelChecklist && (
                <div className="modal-overlay" onClick={() => setShowTravelModal(false)}>
                    <div className="modal-content travel-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><Plane size={24} color="#06B6D4" style={{ marginRight: '12px' }} /> {t('Travel Safety Checklist')}</h2>
                            <button className="modal-close" onClick={() => setShowTravelModal(false)}><X size={20} /></button>
                        </div>

                        <div className="travel-checklist">
                            {travelChecklist.checklist.map((item, i) => (
                                <div
                                    key={i}
                                    className={`checklist-item ${checkedItems[i] ? 'checked' : ''}`}
                                    onClick={() => toggleCheckItem(i)}
                                >
                                    <span className="check-box">
                                        {checkedItems[i] ? <CheckCircle2 size={18} color="#06B6D4" /> : <div style={{ width: 18, height: 18, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%' }} />}
                                    </span>
                                    <div className="item-content">
                                        <span className="item-name">{item.item}</span>
                                        <span className="item-reason">{item.reason}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="gp-letter-section">
                            <h4><Clipboard size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('GP Letter Template')}</h4>
                            <p className="letter-help">
                                {t('Copy this template and have your doctor sign it before traveling.')}
                            </p>
                            <textarea
                                className="gp-letter"
                                value={travelChecklist.gp_letter_template}
                                readOnly
                                rows={12}
                            />
                            <button
                                className="copy-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(travelChecklist.gp_letter_template);
                                    alert(t('Letter copied to clipboard!'));
                                }}
                            >
                                <Clipboard size={14} style={{ marginRight: '6px' }} /> {t('Copy to Clipboard')}
                            </button>
                        </div>

                        <div className="modal-disclaimer">
                            <Info size={14} style={{ marginRight: '6px' }} />
                            {travelChecklist.disclaimer}
                        </div>
                    </div>
                </div>
            )}

            {/* Lifestyle Tips */}
            <div className="lifestyle-tips">
                <h4><Star size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Lifestyle Tips')}</h4>
                <div className="tips-grid">
                    {lifestyleTips.map((tip, i) => (
                        <div key={i} className="tip-card">
                            <span className="tip-icon" style={{ color: '#06B6D4' }}>{tip.icon}</span>
                            <div className="tip-content">
                                <strong>{tip.title}</strong>
                                <p>{tip.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Warning Signs */}
            <div className="warning-signs-section">
                <h4><AlertCircle size={18} color="#EF4444" style={{ display: 'inline', marginRight: '8px' }} /> {t('When to Seek Emergency Care')}</h4>
                <div className="warning-content">
                    <p>{t('Seek immediate medical attention if you experience:')}</p>
                    <ul className="warning-list">
                        <li>🚨 {t('Blood sugar below 54 mg/dL (severe hypoglycemia)')}</li>
                        <li>🚨 {t('Blood sugar above 300 mg/dL that won\'t come down')}</li>
                        <li>🚨 {t('Confusion, difficulty speaking, or loss of consciousness')}</li>
                        <li>🚨 {t('Fruity breath odor (sign of diabetic ketoacidosis)')}</li>
                        <li>🚨 {t('Excessive thirst with frequent urination and nausea')}</li>
                        <li>🚨 {t('Rapid heartbeat or difficulty breathing')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PreventiveCare;
