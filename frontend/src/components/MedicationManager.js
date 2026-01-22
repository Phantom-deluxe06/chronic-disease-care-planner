/**
 * Medication Manager Component
 * Manages doctor-prescribed medications with intake tracking
 * Includes Text-to-Speech for medication reminders
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { Plus, X, Trash2, Upload, Check, Circle, AlertCircle, Pill, Clock, Volume2, VolumeX } from 'lucide-react';
import PrescriptionUploadModal from './PrescriptionUploadModal';

const MedicationManager = ({ token }) => {
    const [medications, setMedications] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const { t } = useLanguage();

    // Text-to-Speech for medication reminders
    const speakMedications = () => {
        if (!window.speechSynthesis || medications.length === 0) return;

        // Stop if already speaking
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        let speechText = `You have ${medications.length} medication${medications.length > 1 ? 's' : ''} to track today. `;

        medications.forEach((med, index) => {
            speechText += `${index + 1}. ${med.name}, ${med.dosage}. `;
            if (med.today_status && med.today_status.length > 0) {
                const pending = med.today_status.filter(s => !s.taken);
                const taken = med.today_status.filter(s => s.taken);
                if (taken.length > 0) {
                    speechText += `Taken at ${taken.map(s => s.time).join(' and ')}. `;
                }
                if (pending.length > 0) {
                    speechText += `Pending at ${pending.map(s => s.time).join(' and ')}. `;
                }
            }
        });

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.lang = 'en-US';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

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
            const response = await fetch(apiUrl('/medications'), {
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
            const response = await fetch(apiUrl('/medications'), {
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

    const handlePrescriptionDetected = async (detectedMeds) => {
        // Add each detected medication
        for (const med of detectedMeds) {
            try {
                await fetch(apiUrl('/medications'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: med.name,
                        dosage: med.dosage || '',
                        frequency: med.frequency || 'daily',
                        times_of_day: med.times_of_day || ['08:00'],
                        notes: med.instructions || ''
                    })
                });
            } catch (err) {
                console.error('Failed to add medication:', err);
            }
        }
        fetchMedications();
    };

    const logIntake = async (medicationId, scheduledTime, taken = true) => {
        try {
            await fetch(apiUrl('/medications/log'), {
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

    const deleteMedication = async (medicationId) => {
        if (!window.confirm(t('Are you sure you want to delete this medication?'))) {
            return;
        }
        try {
            const response = await fetch(apiUrl(`/medications/${medicationId}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                fetchMedications();
            }
        } catch (err) {
            console.error('Failed to delete medication:', err);
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
                <h3><Pill size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Medications')}</h3>
                <div className="med-header-buttons">
                    {medications.length > 0 && (
                        <button
                            className={`speak-meds-btn ${isSpeaking ? 'speaking' : ''}`}
                            onClick={speakMedications}
                            title={isSpeaking ? t('Stop') : t('Read all medications')}
                        >
                            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                    )}
                    <button
                        className="upload-prescription-btn"
                        onClick={() => setShowPrescriptionModal(true)}
                    >
                        <Upload size={16} /> {t('Upload Prescription')}
                    </button>
                    <button
                        className="add-med-btn"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? <><X size={16} /> {t('Cancel')}</> : <><Plus size={16} /> {t('Add Medication')}</>}
                    </button>
                </div>
            </div>


            <div className="med-warning">
                <AlertCircle size={16} style={{ marginRight: '6px' }} />
                {t('Do not modify dosage without consulting your doctor.')}
            </div>

            {showAddForm && (
                <form className="add-med-form" onSubmit={handleAddMedication}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('Medication Name')}</label>
                            <input
                                type="text"
                                value={newMed.name}
                                onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                                placeholder={t('e.g., Metformin')}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('Dosage')}</label>
                            <input
                                type="text"
                                value={newMed.dosage}
                                onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                                placeholder={t('e.g., 500mg')}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('Frequency')}</label>
                        <select
                            value={newMed.frequency}
                            onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                        >
                            <option value="daily">{t('Once daily')}</option>
                            <option value="twice_daily">{t('Twice daily')}</option>
                            <option value="three_times">{t('Three times daily')}</option>
                            <option value="as_needed">{t('As needed')}</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{t('Times of Day')}</label>
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
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="add-time-btn" onClick={addTimeSlot}>
                                <Plus size={14} /> {t('Add Time')}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('Notes (optional)')}</label>
                        <input
                            type="text"
                            value={newMed.notes}
                            onChange={e => setNewMed({ ...newMed, notes: e.target.value })}
                            placeholder={t('Take with food')}
                        />
                    </div>

                    <button type="submit" className="save-med-btn" disabled={loading}>
                        {loading ? t('Saving...') : t('Save Medication')}
                    </button>
                </form>
            )}

            <div className="medications-list">
                {medications.length === 0 ? (
                    <div className="no-meds">
                        <p>{t('No medications added yet.')}</p>
                        <p>{t('Add your doctor-prescribed medications to track them.')}</p>
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
                                        <span className="time"><Clock size={12} style={{ marginRight: '4px' }} /> {status.time}</span>
                                        <button
                                            className={`dose-check ${status.taken ? 'checked' : ''}`}
                                            onClick={() => !status.taken && logIntake(med.id, status.time)}
                                            disabled={status.taken}
                                        >
                                            {status.taken ? <Check size={14} /> : <Circle size={14} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                className="med-delete-btn"
                                onClick={() => deleteMedication(med.id)}
                                title={t('Delete medication')}
                                aria-label={t('Delete medication')}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Prescription Upload Modal */}
            <PrescriptionUploadModal
                isOpen={showPrescriptionModal}
                onClose={() => setShowPrescriptionModal(false)}
                onMedicationsDetected={handlePrescriptionDetected}
                token={token}
            />
        </div>
    );
};

export default MedicationManager;
