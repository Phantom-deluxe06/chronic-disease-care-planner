/**
 * Health Monitor Component
 * Blood sugar trends, HbA1c tracking, and health alerts with AI insights
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import { FiCpu, FiRefreshCw } from 'react-icons/fi';

const HealthMonitor = ({ token }) => {
    const [hba1cData, setHba1cData] = useState(null);
    const [showHba1cForm, setShowHba1cForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState(null);
    const [loadingAiInsights, setLoadingAiInsights] = useState(false);

    const [newHba1c, setNewHba1c] = useState({
        value: '',
        test_date: new Date().toISOString().split('T')[0],
        lab_name: '',
        notes: ''
    });
    const [feedback, setFeedback] = useState(null);

    const fetchHba1cData = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/hba1c'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHba1cData(data);
            }
        } catch (err) {
            console.error('Failed to fetch HbA1c data:', err);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchHba1cData();
        }
    }, [token, fetchHba1cData]);

    const handleSubmitHba1c = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(apiUrl('/hba1c'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newHba1c,
                    value: parseFloat(newHba1c.value)
                })
            });
            if (response.ok) {
                const data = await response.json();
                setFeedback(data.feedback);
                setShowHba1cForm(false);
                setNewHba1c({
                    value: '',
                    test_date: new Date().toISOString().split('T')[0],
                    lab_name: '',
                    notes: ''
                });
                fetchHba1cData();
            }
        } catch (err) {
            console.error('Failed to log HbA1c:', err);
        } finally {
            setLoading(false);
        }
    };

    const getHba1cColor = (value) => {
        if (value < 5.7) return '#22c55e';
        if (value < 6.5) return '#f59e0b';
        if (value < 7.0) return '#84cc16';
        if (value < 8.0) return '#f97316';
        return '#ef4444';
    };

    const fetchAiHealthInsights = async () => {
        setLoadingAiInsights(true);
        try {
            const response = await fetch(apiUrl('/health/ai-insights'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAiInsights(data);
            }
        } catch (err) {
            console.error('Failed to fetch AI health insights:', err);
            setAiInsights({ error: 'Could not load AI insights. Please try again.' });
        } finally {
            setLoadingAiInsights(false);
        }
    };

    return (
        <div className="health-monitor">
            <div className="monitor-header">
                <h3>📈 Health Monitor</h3>
            </div>

            {/* HbA1c Section */}
            <div className="hba1c-section">
                <div className="hba1c-header">
                    <h4>🔬 HbA1c Tracking</h4>
                    <button
                        className="add-hba1c-btn"
                        onClick={() => setShowHba1cForm(!showHba1cForm)}
                    >
                        {showHba1cForm ? '✕ Cancel' : '+ Log HbA1c'}
                    </button>
                </div>

                {showHba1cForm && (
                    <form className="hba1c-form" onSubmit={handleSubmitHba1c}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>HbA1c Value (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="4"
                                    max="15"
                                    value={newHba1c.value}
                                    onChange={e => setNewHba1c({ ...newHba1c, value: e.target.value })}
                                    placeholder="e.g., 6.5"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Test Date</label>
                                <input
                                    type="date"
                                    value={newHba1c.test_date}
                                    onChange={e => setNewHba1c({ ...newHba1c, test_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Lab Name (optional)</label>
                            <input
                                type="text"
                                value={newHba1c.lab_name}
                                onChange={e => setNewHba1c({ ...newHba1c, lab_name: e.target.value })}
                                placeholder="e.g., City Hospital Lab"
                            />
                        </div>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Saving...' : 'Save HbA1c Result'}
                        </button>
                    </form>
                )}

                {feedback && (
                    <div className="hba1c-feedback">
                        {feedback}
                        <button onClick={() => setFeedback(null)}>✕</button>
                    </div>
                )}

                {hba1cData && (
                    <>
                        {hba1cData.reminder && (
                            <div className="hba1c-reminder">
                                {hba1cData.reminder}
                            </div>
                        )}

                        {hba1cData.last_result && (
                            <div className="last-hba1c">
                                <div className="hba1c-value" style={{
                                    borderColor: getHba1cColor(hba1cData.last_result.value)
                                }}>
                                    <span className="value">{hba1cData.last_result.value}%</span>
                                    <span className="date">
                                        Last test: {new Date(hba1cData.last_result.test_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="hba1c-target">
                                    <span className="target-label">Target:</span>
                                    <span className="target-value">{hba1cData.target}</span>
                                </div>
                            </div>
                        )}

                        {hba1cData.history && hba1cData.history.length > 1 && (
                            <div className="hba1c-history">
                                <h5>History</h5>
                                <div className="history-list">
                                    {hba1cData.history.slice(0, 5).map((entry, i) => (
                                        <div key={i} className="history-item">
                                            <span
                                                className="history-value"
                                                style={{ color: getHba1cColor(entry.value) }}
                                            >
                                                {entry.value}%
                                            </span>
                                            <span className="history-date">
                                                {new Date(entry.test_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* AI Health Insights Section */}
            <div className="ai-insights-section">
                <div className="ai-insights-header">
                    <h4><FiCpu /> AI Health Insights</h4>
                    <button
                        className="get-insights-btn"
                        onClick={fetchAiHealthInsights}
                        disabled={loadingAiInsights}
                    >
                        {loadingAiInsights ? (
                            <>
                                <FiRefreshCw className="spinning" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <FiCpu /> Get AI Analysis
                            </>
                        )}
                    </button>
                </div>

                {aiInsights && !aiInsights.error && (
                    <div className="ai-insights-content">
                        {aiInsights.overall_status && (
                            <div className="insight-card status-card">
                                <h5>Overall Health Status</h5>
                                <p className="status-text">{aiInsights.overall_status}</p>
                            </div>
                        )}

                        {aiInsights.risk_areas && aiInsights.risk_areas.length > 0 && (
                            <div className="insight-card risk-card">
                                <h5>⚠️ Areas to Watch</h5>
                                <ul>
                                    {aiInsights.risk_areas.map((risk, i) => (
                                        <li key={i}>{risk}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                            <div className="insight-card recommendations-card">
                                <h5>💡 Personalized Recommendations</h5>
                                <ul>
                                    {aiInsights.recommendations.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {aiInsights.positive_trends && aiInsights.positive_trends.length > 0 && (
                            <div className="insight-card positive-card">
                                <h5>✅ Positive Trends</h5>
                                <ul>
                                    {aiInsights.positive_trends.map((trend, i) => (
                                        <li key={i}>{trend}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {aiInsights?.error && (
                    <div className="ai-insights-error">
                        {aiInsights.error}
                    </div>
                )}

                {!aiInsights && !loadingAiInsights && (
                    <div className="ai-insights-placeholder">
                        <p>Click "Get AI Analysis" to receive personalized health insights based on your data.</p>
                    </div>
                )}
            </div>

            {/* Testing Reminders */}
            <div className="testing-reminders">
                <h4>📋 Recommended Tests</h4>
                <ul className="test-list">
                    <li>
                        <span className="test-name">HbA1c</span>
                        <span className="test-frequency">Every 3-6 months</span>
                    </li>
                    <li>
                        <span className="test-name">Kidney Function (eGFR)</span>
                        <span className="test-frequency">Annually</span>
                    </li>
                    <li>
                        <span className="test-name">Cholesterol Panel</span>
                        <span className="test-frequency">Annually</span>
                    </li>
                    <li>
                        <span className="test-name">Triglycerides</span>
                        <span className="test-frequency">Annually</span>
                    </li>
                    <li>
                        <span className="test-name">Eye Exam</span>
                        <span className="test-frequency">Annually</span>
                    </li>
                    <li>
                        <span className="test-name">Foot Exam</span>
                        <span className="test-frequency">At each visit</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default HealthMonitor;

