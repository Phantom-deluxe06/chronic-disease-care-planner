/**
 * Preventive Care Component
 * Daily reminders, foot care, travel safety for diabetics
 */

import { useState, useEffect, useCallback } from 'react';

const PreventiveCare = ({ token }) => {
    const [reminders, setReminders] = useState(null);
    const [travelChecklist, setTravelChecklist] = useState(null);
    const [showTravelModal, setShowTravelModal] = useState(false);
    const [checkedItems, setCheckedItems] = useState({});

    const fetchReminders = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/reminders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReminders(data);
            }
        } catch (err) {
            console.error('Failed to fetch reminders:', err);
        }
    }, [token]);

    const fetchTravelChecklist = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/travel-checklist', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTravelChecklist(data);
            }
        } catch (err) {
            console.error('Failed to fetch travel checklist:', err);
        }
    }, [token]);

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

    return (
        <div className="preventive-care">
            <div className="care-header">
                <h3>🛡️ Preventive Care</h3>
            </div>

            {/* Daily Reminders */}
            {reminders && (
                <div className="daily-reminders">
                    <h4>Daily Reminders</h4>
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
                    ✈️ Travel Checklist
                </button>
            </div>

            {/* Travel Modal */}
            {showTravelModal && travelChecklist && (
                <div className="modal-overlay" onClick={() => setShowTravelModal(false)}>
                    <div className="modal-content travel-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>✈️ Travel Safety Checklist</h2>
                            <button className="modal-close" onClick={() => setShowTravelModal(false)}>×</button>
                        </div>

                        <div className="travel-checklist">
                            {travelChecklist.checklist.map((item, i) => (
                                <div
                                    key={i}
                                    className={`checklist-item ${checkedItems[i] ? 'checked' : ''}`}
                                    onClick={() => toggleCheckItem(i)}
                                >
                                    <span className="check-box">
                                        {checkedItems[i] ? '✓' : '○'}
                                    </span>
                                    <div className="item-content">
                                        <span className="item-name">{item.item}</span>
                                        <span className="item-reason">{item.reason}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="gp-letter-section">
                            <h4>📝 GP Letter Template</h4>
                            <p className="letter-help">
                                Copy this template and have your doctor sign it before traveling.
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
                                    alert('Letter copied to clipboard!');
                                }}
                            >
                                📋 Copy to Clipboard
                            </button>
                        </div>

                        <div className="modal-disclaimer">
                            {travelChecklist.disclaimer}
                        </div>
                    </div>
                </div>
            )}

            {/* Lifestyle Tips */}
            <div className="lifestyle-tips">
                <h4>🌿 Lifestyle Tips</h4>
                <div className="tips-grid">
                    <div className="tip-card">
                        <span className="tip-icon">🚭</span>
                        <div className="tip-content">
                            <strong>Avoid Smoking</strong>
                            <p>Smoking increases diabetes complications risk</p>
                        </div>
                    </div>
                    <div className="tip-card">
                        <span className="tip-icon">🍷</span>
                        <div className="tip-content">
                            <strong>Limit Alcohol</strong>
                            <p>Alcohol can affect blood sugar levels</p>
                        </div>
                    </div>
                    <div className="tip-card">
                        <span className="tip-icon">🥗</span>
                        <div className="tip-content">
                            <strong>High-Fiber Diet</strong>
                            <p>Fiber helps control blood sugar spikes</p>
                        </div>
                    </div>
                    <div className="tip-card">
                        <span className="tip-icon">💪</span>
                        <div className="tip-content">
                            <strong>High-Protein Foods</strong>
                            <p>Protein helps maintain stable glucose</p>
                        </div>
                    </div>
                    <div className="tip-card">
                        <span className="tip-icon">😴</span>
                        <div className="tip-content">
                            <strong>Quality Sleep</strong>
                            <p>7-8 hours helps insulin sensitivity</p>
                        </div>
                    </div>
                    <div className="tip-card">
                        <span className="tip-icon">🧘</span>
                        <div className="tip-content">
                            <strong>Stress Management</strong>
                            <p>Stress raises blood sugar levels</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreventiveCare;
