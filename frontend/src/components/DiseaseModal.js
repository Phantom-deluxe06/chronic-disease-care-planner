/**
 * DiseaseModal Component
 * Modal popup to collect disease-specific health data during signup
 */

import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Save } from 'lucide-react';

const DiseaseModal = ({ disease, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({});
  const { t } = useLanguage();

  if (!isOpen) return null;

  // Disease-specific form fields
  const diseaseFields = {
    diabetes: [
      { name: 'fasting_sugar', label: t('Fasting Blood Sugar (mg/dL)'), type: 'number', placeholder: 'e.g., 100' },
      { name: 'hba1c', label: t('HbA1c Level (%)'), type: 'number', step: '0.1', placeholder: 'e.g., 6.5' },
      { name: 'insulin_usage', label: t('Using Insulin?'), type: 'select', options: [t('No'), t('Yes - Injection'), t('Yes - Pump')] },
      { name: 'diabetes_type', label: t('Diabetes Type'), type: 'select', options: [t('Type 1'), t('Type 2'), t('Gestational'), t('Pre-diabetes')] },
      { name: 'last_checkup', label: t('Last Doctor Visit'), type: 'date' },
    ],
    heart_disease: [
      { name: 'systolic_bp', label: t('Systolic Blood Pressure (mmHg)'), type: 'number', placeholder: 'e.g., 120' },
      { name: 'diastolic_bp', label: t('Diastolic Blood Pressure (mmHg)'), type: 'number', placeholder: 'e.g., 80' },
      { name: 'cholesterol', label: t('Total Cholesterol (mg/dL)'), type: 'number', placeholder: 'e.g., 180' },
      { name: 'ldl', label: t('LDL Cholesterol (mg/dL)'), type: 'number', placeholder: 'e.g., 100' },
      { name: 'heart_condition', label: t('Heart Condition'), type: 'select', options: [t('Coronary Artery Disease'), t('Heart Failure'), t('Arrhythmia'), t('Other')] },
      { name: 'medications', label: t('Current Medications'), type: 'text', placeholder: 'e.g., Aspirin, Beta-blockers' },
    ],
    hypertension: [
      { name: 'systolic_bp', label: t('Systolic Blood Pressure (mmHg)'), type: 'number', placeholder: 'e.g., 140' },
      { name: 'diastolic_bp', label: t('Diastolic Blood Pressure (mmHg)'), type: 'number', placeholder: 'e.g., 90' },
      { name: 'bp_medication', label: t('On BP Medication?'), type: 'select', options: [t('No'), t('Yes')] },
      { name: 'medication_name', label: t('Medication Name (if any)'), type: 'text', placeholder: 'e.g., Lisinopril' },
      { name: 'family_history', label: t('Family History of Hypertension?'), type: 'select', options: [t('No'), t('Yes')] },
      { name: 'salt_intake', label: t('Salt Intake Level'), type: 'select', options: [t('Low'), t('Moderate'), t('High')] },
    ],
  };

  const fields = diseaseFields[disease] || [];

  const diseaseLabels = {
    diabetes: t('Diabetes'),
    heart_disease: t('Heart Disease'),
    hypertension: t('Hypertension')
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
          <h2>{diseaseLabels[disease]} {t('Health Information')}</h2>
          <button className="modal-close" onClick={onClose} aria-label={t('Close')}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-description">
            {t('Please provide your health details for personalized care recommendations.')}
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
                    <option value="">{t('Select...')}</option>
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
              {t('Cancel')}
            </button>
            <button type="submit" className="btn-primary">
              <Save size={18} style={{ marginRight: '8px' }} /> {t('Save Information')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiseaseModal;
