/**
 * Signup Page Component
 * Dark theme matching landing page
 * Only Diabetes & Hypertension
 * Password show/hide toggle
 * Click to select disease, separate button to add health info
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DiseaseModal from '../components/DiseaseModal';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { User, Mail, Lock, Eye, EyeOff, Calendar, UserRound, ClipboardCheck, Layout, Bell, Activity, Heart, CheckCircle2, Star, ArrowRight, ArrowLeft } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        age: '',
        gender: '',
    });

    const [selectedDiseases, setSelectedDiseases] = useState([]);
    const [healthData, setHealthData] = useState({});

    // Only Diabetes and Hypertension now
    const diseases = [
        { id: 'diabetes', label: t('Diabetes (Sugar)'), icon: <Activity size={20} />, color: '#f59e0b' },
        { id: 'hypertension', label: t('Hypertension (BP)'), icon: <Heart size={20} />, color: '#8b5cf6' },
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    // Click to toggle selection only (no modal auto-open)
    const handleDiseaseToggle = (diseaseId) => {
        setSelectedDiseases(prev => {
            if (prev.includes(diseaseId)) {
                // Remove disease and its health data
                const newHealthData = { ...healthData };
                delete newHealthData[diseaseId];
                setHealthData(newHealthData);
                return prev.filter(d => d !== diseaseId);
            } else {
                // Just add to selection (don't open modal)
                return [...prev, diseaseId];
            }
        });
    };

    // Open modal to add health info for a disease
    const openHealthInfoModal = (diseaseId) => {
        setActiveModal(diseaseId);
    };

    const handleHealthDataSave = (disease, data) => {
        setHealthData(prev => ({ ...prev, [disease]: data }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name.trim()) {
            setError(t('Please enter your name'));
            return;
        }

        if (!formData.email.trim()) {
            setError(t('Please enter your email'));
            return;
        }

        if (formData.password.length < 6) {
            setError(t('Password must be at least 6 characters'));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('Passwords do not match'));
            return;
        }

        if (!formData.age || parseInt(formData.age) < 1) {
            setError(t('Please enter a valid age'));
            return;
        }

        if (!formData.gender) {
            setError(t('Please select your gender'));
            return;
        }

        if (selectedDiseases.length === 0) {
            setError(t('Please select at least one health condition'));
            return;
        }

        // Check if health data is collected for all selected diseases
        for (const disease of selectedDiseases) {
            if (!healthData[disease] || Object.keys(healthData[disease]).length === 0) {
                setError(t('Please add health information for {disease}').replace('{disease}', diseases.find(d => d.id === disease)?.label));
                return;
            }
        }

        setLoading(true);

        try {
            const response = await fetch(apiUrl('/signup'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    age: parseInt(formData.age),
                    gender: formData.gender,
                    diseases: selectedDiseases,
                    health_data: healthData,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || t('Signup failed'));
            }

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/home');
        } catch (err) {
            setError(err.message || t('Something went wrong. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-dark">
            {/* Background Elements */}
            <div className="auth-bg-glow"></div>

            <div className="auth-container-dark">
                {/* Left Side - Branding */}
                <div className="auth-branding-dark">
                    <div className="branding-content-dark">
                        <span className="brand-emoji">💚</span>
                        <h1>HealthBuddy</h1>
                        <p className="brand-tagline">{t('Your Personal Wellness Companion')}</p>

                        <div className="brand-features">
                            <div className="brand-feature">
                                <ClipboardCheck size={20} style={{ marginRight: '12px' }} />
                                <span>{t('Personalized care plans')}</span>
                            </div>
                            <div className="brand-feature">
                                <Layout size={20} style={{ marginRight: '12px' }} />
                                <span>{t('Track your progress')}</span>
                            </div>
                            <div className="brand-feature">
                                <Bell size={20} style={{ marginRight: '12px' }} />
                                <span>{t('Timely reminders')}</span>
                            </div>
                        </div>

                        <div className="brand-stats">
                            <div className="brand-stat">
                                <span className="number">10K+</span>
                                <span className="label">{t('Users')}</span>
                            </div>
                            <div className="brand-stat">
                                <span className="number">95%</span>
                                <span className="label">{t('Happy')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="auth-form-dark">
                    <div className="form-header">
                        <h2>{t('Create Your Account')}</h2>
                        <p>{t('Start your wellness journey today')}</p>
                    </div>

                    {error && <div className="error-message-dark">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group-dark">
                            <label><User size={16} style={{ marginRight: '8px' }} /> {t('Full Name *')}</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={t('Enter your name')}
                                required
                            />
                        </div>

                        <div className="form-group-dark">
                            <label><Mail size={16} style={{ marginRight: '8px' }} /> {t('Email Address *')}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder={t('you@example.com')}
                                required
                            />
                        </div>

                        <div className="form-row-dark">
                            <div className="form-group-dark">
                                <label><Lock size={16} style={{ marginRight: '8px' }} /> {t('Password *')}</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group-dark">
                                <label><Lock size={16} style={{ marginRight: '8px' }} /> {t('Confirm *')}</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="form-row-dark">
                            <div className="form-group-dark">
                                <label><Calendar size={16} style={{ marginRight: '8px' }} /> {t('Age *')}</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    placeholder="45"
                                    min="1"
                                    max="120"
                                    required
                                />
                            </div>
                            <div className="form-group-dark">
                                <label><UserRound size={16} style={{ marginRight: '8px' }} /> {t('Gender *')}</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">{t('Select...')}</option>
                                    <option value="male">{t('Male')}</option>
                                    <option value="female">{t('Female')}</option>
                                    <option value="other">{t('Other')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Health Condition Selection */}
                        <div className="condition-section">
                            <label className="section-label-dark">{t('Select Your Health Condition(s) *')}</label>
                            <p className="section-hint-dark">{t('Click to select, then add your health information')}</p>

                            <div className="condition-grid">
                                {diseases.map((disease) => (
                                    <div
                                        key={disease.id}
                                        className={`condition-card ${selectedDiseases.includes(disease.id) ? 'selected' : ''}`}
                                        style={{ '--condition-color': disease.color }}
                                    >
                                        <div
                                            className="condition-select-area"
                                            onClick={() => handleDiseaseToggle(disease.id)}
                                        >
                                            <span className="condition-icon">{disease.icon}</span>
                                            <span className="condition-label">{disease.label}</span>
                                            {selectedDiseases.includes(disease.id) && (
                                                <span className="condition-check"><CheckCircle2 size={16} /></span>
                                            )}
                                        </div>

                                        {selectedDiseases.includes(disease.id) && (
                                            <button
                                                type="button"
                                                className={`add-info-btn ${healthData[disease.id] ? 'completed' : ''}`}
                                                onClick={() => openHealthInfoModal(disease.id)}
                                            >
                                                {healthData[disease.id] ? <><CheckCircle2 size={14} style={{ marginRight: '6px' }} /> {t('✓ Info Added - Edit')}</> : <>{t('+ Add Health Info')}</>}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="submit-btn-dark" disabled={loading}>
                            {loading ? t('Creating Account...') : <><ArrowRight size={18} style={{ marginRight: '8px' }} /> {t('Create Account')}</>}
                        </button>
                    </form>

                    <p className="auth-switch-dark">
                        {t('Already have an account?')} <Link to="/login">{t('Sign In')}</Link>
                    </p>
                </div>
            </div>

            {/* Disease Modals */}
            {diseases.map((disease) => (
                <DiseaseModal
                    key={disease.id}
                    disease={disease.id}
                    isOpen={activeModal === disease.id}
                    onClose={() => setActiveModal(null)}
                    onSave={handleHealthDataSave}
                />
            ))}
        </div>
    );
};

export default Signup;
