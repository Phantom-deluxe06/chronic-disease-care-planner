/**
 * Prescription Upload Modal Component
 * Allows users to upload prescription images for AI-powered medication detection
 */

import { useState, useRef } from 'react';
import { FiUpload, FiX, FiCheck, FiAlertCircle, FiEdit2, FiPlus } from 'react-icons/fi';
import { apiUrl } from '../config/api';
import './LogEntryModal.css';

const PrescriptionUploadModal = ({ isOpen, onClose, onMedicationsDetected, token }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const [detectedMeds, setDetectedMeds] = useState([]);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);

        // Upload and analyze
        await analyzeImage(file);
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
                throw new Error(data.detail || 'Failed to analyze prescription');
            }

            if (data.error) {
                setError(data.error);
            } else if (data.medications && data.medications.length > 0) {
                setDetectedMeds(data.medications);
                setAnalysisComplete(true);
            } else {
                setError('No medications detected. Please try a clearer image.');
            }
        } catch (err) {
            setError(err.message || 'Failed to analyze prescription');
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

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content prescription-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📋 Upload Prescription</h2>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>

                {error && <div className="modal-error"><FiAlertCircle /> {error}</div>}

                {!analysisComplete ? (
                    <div className="upload-section">
                        <div
                            className="upload-dropzone"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <div className="upload-loading">
                                    <div className="spinner"></div>
                                    <p>Analyzing prescription...</p>
                                    <span>AI is detecting medications</span>
                                </div>
                            ) : preview ? (
                                <img src={preview} alt="Prescription preview" className="upload-preview" />
                            ) : (
                                <div className="upload-placeholder">
                                    <FiUpload className="upload-icon" />
                                    <p>Click to upload prescription</p>
                                    <span>Supports JPG, PNG images</span>
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

                        <div className="upload-tips">
                            <h4>Tips for best results:</h4>
                            <ul>
                                <li>Ensure prescription is clearly visible</li>
                                <li>Good lighting helps accuracy</li>
                                <li>Include medication names and dosages</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="detected-medications">
                        <div className="detection-success">
                            <FiCheck className="success-icon" />
                            <h3>Detected {detectedMeds.length} medication(s)</h3>
                            <p>Review and edit before adding</p>
                        </div>

                        <div className="medications-list">
                            {detectedMeds.map((med, index) => (
                                <div key={index} className="detected-med-card">
                                    {editingIndex === index ? (
                                        <div className="med-edit-form">
                                            <input
                                                type="text"
                                                value={med.name}
                                                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                placeholder="Medication name"
                                            />
                                            <input
                                                type="text"
                                                value={med.dosage}
                                                onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                placeholder="Dosage"
                                            />
                                            <select
                                                value={med.frequency}
                                                onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                            >
                                                <option value="daily">Once daily</option>
                                                <option value="twice_daily">Twice daily</option>
                                                <option value="three_times">Three times daily</option>
                                                <option value="as_needed">As needed</option>
                                            </select>
                                            <button
                                                className="done-btn"
                                                onClick={() => setEditingIndex(null)}
                                            >
                                                <FiCheck /> Done
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="med-info">
                                                <span className="med-name">{med.name}</span>
                                                <span className="med-dosage">{med.dosage}</span>
                                                <span className="med-frequency">
                                                    {med.frequency === 'daily' && 'Once daily'}
                                                    {med.frequency === 'twice_daily' && 'Twice daily'}
                                                    {med.frequency === 'three_times' && '3x daily'}
                                                    {med.frequency === 'as_needed' && 'As needed'}
                                                </span>
                                                {med.instructions && (
                                                    <span className="med-instructions">{med.instructions}</span>
                                                )}
                                            </div>
                                            <div className="med-actions">
                                                <button onClick={() => setEditingIndex(index)}>
                                                    <FiEdit2 />
                                                </button>
                                                <button onClick={() => removeMedication(index)}>
                                                    <FiX />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleConfirmMedications}
                                disabled={detectedMeds.length === 0}
                            >
                                <FiPlus /> Add {detectedMeds.length} Medication(s)
                            </button>
                        </div>
                    </div>
                )}

                <div className="modal-disclaimer">
                    ⚠️ AI detection may not be 100% accurate. Please verify all medications before adding.
                </div>
            </div>
        </div>
    );
};

export default PrescriptionUploadModal;
