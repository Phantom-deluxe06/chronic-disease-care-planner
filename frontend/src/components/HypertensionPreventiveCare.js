/**
 * Hypertension Preventive Care Component
 * Blood pressure tips, lifestyle guidance, and preventive care reminders
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Bell, Heart, Moon, Zap, Star, Info, Activity, Droplets, Wind, AlertCircle, Coffee, Wine } from 'lucide-react';

const HypertensionPreventiveCare = ({ token, tips = [] }) => {
    const [reminders, setReminders] = useState(null);
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

    const fetchReminders = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/reminders?condition=hypertension'), {
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
    }, [token, language]);

    useEffect(() => {
        if (token) {
            fetchReminders();
        }
    }, [token, fetchReminders]);

    const lifestyleTips = [
        { icon: <Droplets size={18} />, title: t('Reduce Sodium'), desc: t('Limit to less than 2,300mg/day, ideally 1,500mg') },
        { icon: <Heart size={18} />, title: t('DASH Diet'), desc: t('Eat fruits, vegetables, low-fat dairy, whole grains') },
        { icon: <Activity size={18} />, title: t('Regular Exercise'), desc: t('150 minutes/week of moderate aerobic activity') },
        { icon: <Wine size={18} />, title: t('Limit Alcohol'), desc: t('Max 1 drink/day for women, 2 for men') },
        { icon: <Coffee size={18} />, title: t('Monitor Caffeine'), desc: t('Caffeine may temporarily raise blood pressure') },
        { icon: <Moon size={18} />, title: t('Quality Sleep'), desc: t('7-8 hours helps regulate blood pressure') },
        { icon: <Wind size={18} />, title: t('Manage Stress'), desc: t('Practice deep breathing, meditation, yoga') },
        { icon: <Zap size={18} />, title: t('Quit Smoking'), desc: t('Smoking raises BP and damages blood vessels') }
    ];

    const bpCategories = [
        { category: t('Normal'), systolic: '<120', diastolic: '<80', color: '#10B981' },
        { category: t('Elevated'), systolic: '120-129', diastolic: '<80', color: '#F59E0B' },
        { category: t('High BP Stage 1'), systolic: '130-139', diastolic: '80-89', color: '#EF4444' },
        { category: t('High BP Stage 2'), systolic: '≥140', diastolic: '≥90', color: '#DC2626' },
        { category: t('Hypertensive Crisis'), systolic: '>180', diastolic: '>120', color: '#7C2D12' }
    ];

    const dailyChecklist = [
        { time: t('Morning'), task: t('Take BP medication as prescribed'), icon: '💊' },
        { time: t('Morning'), task: t('Measure BP before eating/meds'), icon: '💓' },
        { time: t('Meals'), task: t('Check sodium content of foods'), icon: '🧂' },
        { time: t('Afternoon'), task: t('Take a short walk or stretch'), icon: '🚶' },
        { time: t('Evening'), task: t('Practice stress relief activity'), icon: '🧘' },
        { time: t('Night'), task: t('Avoid caffeine after 2 PM'), icon: '☕' }
    ];

    return (
        <div className="preventive-care hypertension-preventive">
            <div className="care-header">
                <h3><Shield size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Preventive Care and Tips')}</h3>
            </div>

            {/* Blood Pressure Tips */}
            {tips && tips.length > 0 && (
                <div className="diabetes-tips-section bp-tips-section">
                    <h4><Info size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Blood Pressure Tips')}</h4>
                    <ul className="diabetes-tips-list">
                        {tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* BP Categories Reference */}
            <div className="bp-categories-section">
                <h4><Heart size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Blood Pressure Categories')}</h4>
                <div className="bp-categories-grid">
                    {bpCategories.map((cat, i) => (
                        <div key={i} className="bp-category-card" style={{ borderLeftColor: cat.color }}>
                            <span className="category-name" style={{ color: cat.color }}>{cat.category}</span>
                            <span className="category-values">{cat.systolic} / {cat.diastolic} mmHg</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Daily Reminders from API */}
            {reminders && reminders.daily_reminders && (
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

            {/* Daily Checklist */}
            <div className="daily-checklist-section">
                <h4><AlertCircle size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Daily Checklist for BP Control')}</h4>
                <div className="checklist-grid">
                    {dailyChecklist.map((item, i) => (
                        <div key={i} className="checklist-card">
                            <span className="checklist-icon">{item.icon}</span>
                            <div className="checklist-content">
                                <span className="checklist-time">{item.time}</span>
                                <span className="checklist-task">{item.task}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lifestyle Tips */}
            <div className="lifestyle-tips">
                <h4><Star size={18} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Lifestyle Tips for Blood Pressure')}</h4>
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
                        <li>🚨 {t('BP reading above 180/120 mmHg')}</li>
                        <li>🚨 {t('Severe headache with confusion')}</li>
                        <li>🚨 {t('Chest pain or difficulty breathing')}</li>
                        <li>🚨 {t('Vision changes or blurred vision')}</li>
                        <li>🚨 {t('Numbness or weakness')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HypertensionPreventiveCare;
