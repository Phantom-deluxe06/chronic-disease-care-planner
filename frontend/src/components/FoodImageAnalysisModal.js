/**
 * Food Image Analysis Modal Component
 * Allows users to upload food plate images for AI-powered nutritional analysis
 */

import { useState, useRef } from 'react';
import { FiCamera, FiAlertCircle } from 'react-icons/fi';
import { MdRestaurant, MdLocalFireDepartment } from 'react-icons/md';
import { apiUrl } from '../config/api';
import './LogEntryModal.css';

const FoodImageAnalysisModal = ({ isOpen, onClose, onSuccess, token, condition = 'diabetes' }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const [analysis, setAnalysis] = useState(null);
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
        setAnalysis(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(apiUrl(`/food/analyze-image?condition=${condition}`), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to analyze food image');
            }

            if (data.error) {
                setError(data.error);
            } else if (data.detected_foods && data.detected_foods.length > 0) {
                setAnalysis(data);
                if (onSuccess) onSuccess(data);
            } else {
                setError('No food detected. Please try a clearer image.');
            }
        } catch (err) {
            // Check for quota exceeded error
            const errorMsg = err.message || 'Failed to analyze food image';
            if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('exceeded')) {
                setError('⏳ AI service is busy. Please wait 45 seconds and try again.');
            } else {
                setError(errorMsg);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setPreview(null);
        setAnalysis(null);
        setError('');
        onClose();
    };

    const getRatingColor = (rating) => {
        switch (rating) {
            case 'Excellent': return '#22c55e';
            case 'Good': return '#10b981';
            case 'Moderate': return '#f59e0b';
            case 'Poor': return '#ef4444';
            default: return '#6b7280';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content food-image-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📷 Food Image Analysis</h2>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>

                {error && <div className="modal-error"><FiAlertCircle /> {error}</div>}

                {!analysis ? (
                    <div className="upload-section">
                        <div
                            className="upload-dropzone"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <div className="upload-loading">
                                    <div className="spinner"></div>
                                    <p>Analyzing your food...</p>
                                    <span>AI is detecting nutrition info</span>
                                </div>
                            ) : preview ? (
                                <img src={preview} alt="Food preview" className="upload-preview" />
                            ) : (
                                <div className="upload-placeholder">
                                    <FiCamera className="upload-icon" />
                                    <p>Take a photo of your food</p>
                                    <span>or upload an image</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        <div className="upload-tips">
                            <h4>Tips for best results:</h4>
                            <ul>
                                <li>Include the entire plate in frame</li>
                                <li>Good lighting improves accuracy</li>
                                <li>Show all food items clearly</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="food-analysis-results">
                        {preview && (
                            <div className="food-preview-small">
                                <img src={preview} alt="Food" />
                                <p>{analysis.meal_description}</p>
                            </div>
                        )}

                        {/* Total Nutrition Summary */}
                        <div className="nutrition-summary-card">
                            <h3><MdLocalFireDepartment /> Total Nutrition</h3>
                            <div className="nutrition-grid-compact">
                                <div className="nutr-item calories">
                                    <span className="nutr-value">{analysis.total_nutrition.calories}</span>
                                    <span className="nutr-label">Calories</span>
                                </div>
                                <div className="nutr-item">
                                    <span className="nutr-value">{analysis.total_nutrition.carbohydrates_g}g</span>
                                    <span className="nutr-label">Carbs</span>
                                </div>
                                <div className="nutr-item">
                                    <span className="nutr-value">{analysis.total_nutrition.protein_g}g</span>
                                    <span className="nutr-label">Protein</span>
                                </div>
                                <div className="nutr-item">
                                    <span className="nutr-value">{analysis.total_nutrition.fat_g}g</span>
                                    <span className="nutr-label">Fat</span>
                                </div>
                                <div className="nutr-item">
                                    <span className="nutr-value">{analysis.total_nutrition.fiber_g}g</span>
                                    <span className="nutr-label">Fiber</span>
                                </div>
                                <div className="nutr-item">
                                    <span className="nutr-value">{analysis.total_nutrition.sugar_g}g</span>
                                    <span className="nutr-label">Sugar</span>
                                </div>
                                {analysis.total_nutrition.glycemic_index && (
                                    <div className="nutr-item gi">
                                        <span className="nutr-value">{analysis.total_nutrition.glycemic_index}</span>
                                        <span className="nutr-label">GI</span>
                                    </div>
                                )}
                                {analysis.total_nutrition.sodium_mg && (
                                    <div className="nutr-item">
                                        <span className="nutr-value">{analysis.total_nutrition.sodium_mg}mg</span>
                                        <span className="nutr-label">Sodium</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detected Foods */}
                        <div className="detected-foods-card">
                            <h3><MdRestaurant /> Detected Foods</h3>
                            <div className="foods-list">
                                {analysis.detected_foods.map((food, index) => (
                                    <div key={index} className="food-item">
                                        <span className="food-name">{food.name}</span>
                                        <span className="food-portion">{food.estimated_portion}</span>
                                        <span className="food-cals">{food.calories} cal</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Health Assessment */}
                        {analysis.health_assessment && (
                            <div className={`health-assessment-card ${analysis.health_assessment.suitable_for_condition ? 'suitable' : 'caution'}`}>
                                <div className="assessment-header">
                                    <span className="rating" style={{ color: getRatingColor(analysis.health_assessment.rating) }}>
                                        {analysis.health_assessment.rating}
                                    </span>
                                    <span className="suitable-badge">
                                        {analysis.health_assessment.suitable_for_condition ? '✅ Suitable' : '⚠️ Caution'}
                                    </span>
                                </div>

                                {analysis.health_assessment.positives?.length > 0 && (
                                    <div className="assessment-list positives">
                                        <h4>👍 Positives</h4>
                                        <ul>
                                            {analysis.health_assessment.positives.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {analysis.health_assessment.concerns?.length > 0 && (
                                    <div className="assessment-list concerns">
                                        <h4>⚠️ Concerns</h4>
                                        <ul>
                                            {analysis.health_assessment.concerns.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {analysis.health_assessment.recommendations?.length > 0 && (
                                    <div className="assessment-list recommendations">
                                        <h4>💡 Recommendations</h4>
                                        <ul>
                                            {analysis.health_assessment.recommendations.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn-submit" onClick={handleClose}>
                                Done
                            </button>
                        </div>
                    </div>
                )}

                <div className="modal-disclaimer">
                    ⚠️ AI estimates may vary. Use as a guide only, not for precise dietary tracking.
                </div>
            </div>
        </div>
    );
};

export default FoodImageAnalysisModal;
