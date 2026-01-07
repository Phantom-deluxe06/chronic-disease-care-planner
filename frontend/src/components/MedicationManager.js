/**
 * Medication Manager Component
 * Manages doctor-prescribed medications with intake tracking
 */

import { useState, useEffect, useCallback } from 'react';

const MedicationManager = ({ token }) => {
    const [medications, setMedications] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(false);

    // New medication form
    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        frequency: 'daily',
        times_of_day: ['08:00'],
        notes: ''
    });

    const fetchMedications = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/medications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMedications(data.medications || []);
            }
        } catch (err) {
            console.error('Failed to fetch medications:', err);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchMedications();
        }
    }, [token, fetchMedications]);

    const handleAddMedication = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/medications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newMed)
            });
            if (response.ok) {
                setShowAddForm(false);
                setNewMed({
                    name: '',
                    dosage: '',
                    frequency: 'daily',
                    times_of_day: ['08:00'],
                    notes: ''
                });
                fetchMedications();
            }
        } catch (err) {
            console.error('Failed to add medication:', err);
        } finally {
            setLoading(false);
        }
    };

    const logIntake = async (medicationId, scheduledTime, taken = true) => {
        try {
            await fetch('http://localhost:8000/medications/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    medication_id: medicationId,
                    scheduled_time: scheduledTime,
                    taken: taken
                })
            });
            fetchMedications();
        } catch (err) {
            console.error('Failed to log medication intake:', err);
        }
    };

    const addTimeSlot = () => {
        setNewMed({
            ...newMed,
            times_of_day: [...newMed.times_of_day, '12:00']
        });
    };

    const updateTimeSlot = (index, value) => {
        const newTimes = [...newMed.times_of_day];
        newTimes[index] = value;
        setNewMed({ ...newMed, times_of_day: newTimes });
    };

    const removeTimeSlot = (index) => {
        if (newMed.times_of_day.length > 1) {
            const newTimes = newMed.times_of_day.filter((_, i) => i !== index);
            setNewMed({ ...newMed, times_of_day: newTimes });
        }
    };

    return (
        <div className="medication-manager">
            <div className="med-header">
                <h3>💊 Medications</h3>
                <button
                    className="add-med-btn"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? '✕ Cancel' : '+ Add Medication'}
                </button>
            </div>

            <div className="med-warning">
                ⚠️ Do not modify dosage without consulting your doctor.
            </div>

            {showAddForm && (
                <form className="add-med-form" onSubmit={handleAddMedication}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Medication Name</label>
                            <input
                                type="text"
                                value={newMed.name}
                                onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                placeholder="e.g., Metformin"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Dosage</label>
                            <input
                                type="text"
                                value={newMed.dosage}
                                onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                                placeholder="e.g., 500mg"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Frequency</label>
                        <select
                            value={newMed.frequency}
                            onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                        >
                            <option value="daily">Once daily</option>
                            <option value="twice_daily">Twice daily</option>
                            <option value="three_times">Three times daily</option>
                            <option value="as_needed">As needed</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Times of Day</label>
                        <div className="time-slots">
                            {newMed.times_of_day.map((time, index) => (
                                <div key={index} className="time-slot">
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={e => updateTimeSlot(index, e.target.value)}
                                    />
                                    {newMed.times_of_day.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-time"
                                            onClick={() => removeTimeSlot(index)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="add-time-btn" onClick={addTimeSlot}>
                                + Add Time
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes (optional)</label>
                        <input
                            type="text"
                            value={newMed.notes}
                            onChange={e => setNewMed({ ...newMed, notes: e.target.value })}
                            placeholder="e.g., Take with food"
                        />
                    </div>

                    <button type="submit" className="save-med-btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Medication'}
                    </button>
                </form>
            )}

            <div className="medications-list">
                {medications.length === 0 ? (
                    <div className="no-meds">
                        <p>No medications added yet.</p>
                        <p>Add your doctor-prescribed medications to track them.</p>
                    </div>
                ) : (
                    medications.map(med => (
                        <div key={med.id} className="medication-card">
                            <div className="med-info">
                                <span className="med-name">{med.name}</span>
                                <span className="med-dosage">{med.dosage}</span>
                                {med.notes && <span className="med-notes">{med.notes}</span>}
                            </div>
                            <div className="med-schedule">
                                {med.today_status && med.today_status.map((status, i) => (
                                    <div
                                        key={i}
                                        className={`dose-time ${status.taken ? 'taken' : ''}`}
                                    >
                                        <span className="time">{status.time}</span>
                                        <button
                                            className={`dose-check ${status.taken ? 'checked' : ''}`}
                                            onClick={() => !status.taken && logIntake(med.id, status.time)}
                                            disabled={status.taken}
                                        >
                                            {status.taken ? '✓' : '○'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MedicationManager;
