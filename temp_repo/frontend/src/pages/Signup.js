/**
 * Signup Page Component
 * Collects user details and disease-specific health data
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DiseaseModal from '../components/DiseaseModal';

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeModal, setActiveModal] = useState(null);

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

    const diseases = [
        { id: 'diabetes', label: 'Diabetes (Sugar)', icon: '🩸', color: '#ef4444' },
        { id: 'heart_disease', label: 'Heart Disease', icon: '❤️', color: '#ec4899' },
        { id: 'hypertension', label: 'Hypertension (BP)', icon: '💓', color: '#8b5cf6' },
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleDiseaseToggle = (diseaseId) => {
        setSelectedDiseases(prev => {
            if (prev.includes(diseaseId)) {
                // Remove disease and its health data
                const newHealthData = { ...healthData };
                delete newHealthData[diseaseId];
                setHealthData(newHealthData);
                return prev.filter(d => d !== diseaseId);
            } else {
                // Add disease and open modal
                setActiveModal(diseaseId);
                return [...prev, diseaseId];
            }
        });
    };

    const handleHealthDataSave = (disease, data) => {
        setHealthData(prev => ({ ...prev, [disease]: data }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (selectedDiseases.length === 0) {
            setError('Please select at least one condition');
            return;
        }

        // Check if health data is collected for all diseases
        for (const disease of selectedDiseases) {
            if (!healthData[disease] || Object.keys(healthData[disease]).length === 0) {
                setActiveModal(disease);
                setError(`Please provide health information for ${disease.replace('_', ' ')}`);
                return;
            }
        }

        setLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/signup', {
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
                throw new Error(data.detail || 'Signup failed');
            }

            // Store token and user
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Navigate to home
            navigate('/home');
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page signup-page">
            <div className="auth-container">
                {/* Left Side - Branding */}
                <div className="auth-branding">
                    <div className="branding-content">
                        <div className="brand-icon">💚</div>
                        <h1>Chronic Disease Care Planner</h1>
                        <p>Your personalized daily health companion for managing chronic conditions</p>
                        <div className="features-list">
                            <div className="feature-item">
                                <span className="feature-icon">📋</span>
                                <span>Personalized care plans</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">📊</span>
                                <span>Track your progress</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">🔔</span>
                                <span>Timely reminders</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="auth-form-container">
                    <div className="auth-form-wrapper">
                        <h2>Create Your Account</h2>
                        <p className="form-subtitle">Join us to start your personalized health journey</p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            {/* Basic Info */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            <div className="form-row two-cols">
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row two-cols">
                                <div className="form-group">
                                    <label htmlFor="age">Age</label>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        placeholder="45"
                                        min="1"
                                        max="120"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="gender">Gender</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Disease Selection */}
                            <div className="form-section">
                                <label className="section-label">Select Your Health Condition(s)</label>
                                <p className="section-hint">Click to add and provide health details</p>

                                <div className="disease-grid">
                                    {diseases.map((disease) => (
                                        <div
                                            key={disease.id}
                                            className={`disease-card ${selectedDiseases.includes(disease.id) ? 'selected' : ''}`}
                                            onClick={() => handleDiseaseToggle(disease.id)}
                                            style={{ '--disease-color': disease.color }}
                                        >
                                            <span className="disease-icon">{disease.icon}</span>
                                            <span className="disease-label">{disease.label}</span>
                                            {selectedDiseases.includes(disease.id) && (
                                                <span className="disease-check">✓</span>
                                            )}
                                            {selectedDiseases.includes(disease.id) && healthData[disease.id] && (
                                                <span className="disease-data-badge">Data Added</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn-primary btn-full" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <p className="auth-switch">
                            Already have an account? <Link to="/login">Sign In</Link>
                        </p>
                    </div>
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
