/**
 * Prescription Upload Modal Component
 * Allows users to upload prescription images for AI-powered medication detection
 * Uses React Portal to render above sidebar and all other UI elements
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, Check, AlertCircle, Edit2, Plus, Info, Loader2 } from 'lucide-react';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import './PrescriptionUploadModal.css';

const PrescriptionUploadModal = ({ isOpen, onClose, onMedicationsDetected, token }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const [detectedMeds, setDetectedMeds] = useState([]);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const fileInputRef = useRef(null);
    const { t, translateAsync, language } = useLanguage();

    // Handle fade-in animation
    useEffect(() => {
        if (isOpen) {
            // Small delay for transition to work
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError(t('Please upload an image file'));
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);

        // Upload and analyze
        await analyzeImage(file);
    };

    const translateMedications = async (meds) => {
        if (language === 'en') return meds;

        try {
            return await Promise.all(meds.map(async (med) => {
                // We keep medication name as is (medical names usually don't need translation)
                // but we translate dosage instruction and frequency
                const translatedFrequency = await translateAsync(med.frequency);
                const translatedDosage = await translateAsync(med.dosage);
                return {
                    ...med,
                    frequency: translatedFrequency,
                    dosage: translatedDosage
                };
            }));
        } catch (err) {
            console.error('Failed to translate medications:', err);
            return meds;
        }
    };

    const analyzeImage = async (file) => {
        setUploading(true);
        setError('');
        setAnalysisComplete(false);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(apiUrl('/prescription/analyze'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || t('Failed to analyze prescription'));
            }

            if (data.error) {
                setError(data.error);
            } else if (data.medications && data.medications.length > 0) {
                const translatedMeds = await translateMedications(data.medications);
                setDetectedMeds(translatedMeds);
                setAnalysisComplete(true);
            } else {
                setError(t('No medications detected. Please try a clearer image.'));
            }
        } catch (err) {
            setError(err.message || t('Failed to analyze prescription'));
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmMedications = () => {
        if (onMedicationsDetected && detectedMeds.length > 0) {
            onMedicationsDetected(detectedMeds);
        }
        handleClose();
    };

    const handleClose = () => {
        setPreview(null);
        setDetectedMeds([]);
        setAnalysisComplete(false);
        setError('');
        setEditingIndex(null);
        onClose();
    };

    const updateMedication = (index, field, value) => {
        const updated = [...detectedMeds];
        updated[index] = { ...updated[index], [field]: value };
        setDetectedMeds(updated);
    };

    const removeMedication = (index) => {
        setDetectedMeds(detectedMeds.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    // Use React Portal to render modal directly into document.body
    return createPortal(
        <div
            className={`prescription-modal-backdrop ${isVisible ? 'visible' : ''}`}
            onClick={handleClose}
        >
            <div
                className="prescription-modal-card"
                onClick={e => e.stopPropagation()}
            >
                <div className="prescription-modal-header">
                    <h2><Upload size={20} color="#06B6D4" style={{ display: 'inline', marginRight: '8px' }} /> {t('Upload Prescription')}</h2>
                    <button className="prescription-modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="prescription-modal-error">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {!analysisComplete ? (
                    <div className="prescription-upload-section">
                        <div
                            className="prescription-dropzone"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <div className="prescription-loading">
                                    <div className="prescription-spinner">
                                        <Loader2 className="animate-spin" size={32} color="#06B6D4" />
                                    </div>
                                    <p>{t('Analyzing prescription...')}</p>
                                    <span>{t('AI is detecting medications')}</span>
                                </div>
                            ) : preview ? (
                                <img src={preview} alt="Prescription preview" className="prescription-preview" />
                            ) : (
                                <div className="prescription-placeholder">
                                    <Upload className="prescription-upload-icon" size={40} color="#06B6D4" />
                                    <p>{t('Click to upload prescription')}</p>
                                    <span>{t('Supports JPG, PNG images')}</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        <div className="prescription-tips">
                            <h4>{t('Tips for best results:')}</h4>
                            <ul>
                                <li>✓ {t('Ensure prescription is clearly visible')}</li>
                                <li>✓ {t('Good lighting helps accuracy')}</li>
                                <li>✓ {t('Include medication names and dosages')}</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="prescription-detected-meds">
                        <div className="prescription-success">
                            <Check className="prescription-success-icon" size={24} color="#22c55e" />
                            <h3>{t('Detected {count} medication(s)').replace('{count}', detectedMeds.length)}</h3>
                            <p>{t('Review and edit before adding')}</p>
                        </div>

                        <div className="prescription-meds-list">
                            {detectedMeds.map((med, index) => (
                                <div key={index} className="prescription-med-card">
                                    {editingIndex === index ? (
                                        <div className="prescription-med-edit">
                                            <input
                                                type="text"
                                                value={med.name}
                                                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                placeholder={t('Medication name')}
                                            />
                                            <input
                                                type="text"
                                                value={med.dosage}
                                                onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                placeholder={t('Dosage')}
                                            />
                                            <select
                                                value={med.frequency}
                                                onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                            >
                                                <option value="daily">{t('Once daily')}</option>
                                                <option value="twice_daily">{t('Twice daily')}</option>
                                                <option value="three_times">{t('Three times daily')}</option>
                                                <option value="as_needed">{t('As needed')}</option>
                                            </select>
                                            <button
                                                className="prescription-done-btn"
                                                onClick={() => setEditingIndex(null)}
                                            >
                                                <Check size={16} /> {t('Done')}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="prescription-med-info">
                                                <span className="prescription-med-name">{med.name}</span>
                                                <span className="prescription-med-dosage">{med.dosage}</span>
                                                <span className="prescription-med-frequency">
                                                    {med.frequency === 'daily' || med.frequency === t('Once daily') ? t('Once daily') :
                                                        med.frequency === 'twice_daily' || med.frequency === t('Twice daily') ? t('Twice daily') :
                                                            med.frequency === 'three_times' || med.frequency === t('3x daily') ? t('3x daily') :
                                                                med.frequency === 'as_needed' || med.frequency === t('As needed') ? t('As needed') : med.frequency}
                                                </span>
                                            </div>
                                            <div className="prescription-med-actions">
                                                <button onClick={() => setEditingIndex(index)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => removeMedication(index)}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="prescription-modal-actions">
                            <button className="prescription-btn-cancel" onClick={handleClose}>
                                {t('Cancel')}
                            </button>
                            <button
                                className="prescription-btn-submit"
                                onClick={handleConfirmMedications}
                                disabled={detectedMeds.length === 0}
                            >
                                <Plus size={18} /> {t('Add {count} Medication(s)').replace('{count}', detectedMeds.length)}
                            </button>
                        </div>
                    </div>
                )}

                <div className="prescription-disclaimer">
                    <AlertCircle size={14} style={{ marginRight: '6px' }} />
                    {t('AI detection may not be 100% accurate. Please verify all medications before adding.')}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrescriptionUploadModal;
