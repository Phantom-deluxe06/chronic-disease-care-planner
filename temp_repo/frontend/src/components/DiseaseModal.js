/**
 * DiseaseModal Component
 * Modal popup to collect disease-specific health data during signup
 */

import { useState } from 'react';

const DiseaseModal = ({ disease, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  if (!isOpen) return null;

  // Disease-specific form fields
  const diseaseFields = {
    diabetes: [
      { name: 'fasting_sugar', label: 'Fasting Blood Sugar (mg/dL)', type: 'number', placeholder: 'e.g., 100' },
      { name: 'hba1c', label: 'HbA1c Level (%)', type: 'number', step: '0.1', placeholder: 'e.g., 6.5' },
      { name: 'insulin_usage', label: 'Using Insulin?', type: 'select', options: ['No', 'Yes - Injection', 'Yes - Pump'] },
      { name: 'diabetes_type', label: 'Diabetes Type', type: 'select', options: ['Type 1', 'Type 2', 'Gestational', 'Pre-diabetes'] },
      { name: 'last_checkup', label: 'Last Doctor Visit', type: 'date' },
    ],
    heart_disease: [
      { name: 'systolic_bp', label: 'Systolic Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 120' },
      { name: 'diastolic_bp', label: 'Diastolic Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 80' },
      { name: 'cholesterol', label: 'Total Cholesterol (mg/dL)', type: 'number', placeholder: 'e.g., 180' },
      { name: 'ldl', label: 'LDL Cholesterol (mg/dL)', type: 'number', placeholder: 'e.g., 100' },
      { name: 'heart_condition', label: 'Heart Condition', type: 'select', options: ['Coronary Artery Disease', 'Heart Failure', 'Arrhythmia', 'Other'] },
      { name: 'medications', label: 'Current Medications', type: 'text', placeholder: 'e.g., Aspirin, Beta-blockers' },
    ],
    hypertension: [
      { name: 'systolic_bp', label: 'Systolic Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 140' },
      { name: 'diastolic_bp', label: 'Diastolic Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 90' },
      { name: 'bp_medication', label: 'On BP Medication?', type: 'select', options: ['No', 'Yes'] },
      { name: 'medication_name', label: 'Medication Name (if any)', type: 'text', placeholder: 'e.g., Lisinopril' },
      { name: 'family_history', label: 'Family History of Hypertension?', type: 'select', options: ['No', 'Yes'] },
      { name: 'salt_intake', label: 'Salt Intake Level', type: 'select', options: ['Low', 'Moderate', 'High'] },
    ],
  };

  const fields = diseaseFields[disease] || [];

  const diseaseLabels = {
    diabetes: 'Diabetes',
    heart_disease: 'Heart Disease',
    hypertension: 'Hypertension'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(disease, formData);
    setFormData({});
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{diseaseLabels[disease]} Health Information</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-description">
            Please provide your health details for personalized care recommendations.
          </p>
          
          <div className="modal-fields">
            {fields.map((field) => (
              <div key={field.name} className="form-group">
                <label htmlFor={field.name}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    step={field.step}
                    required
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Information
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiseaseModal;
