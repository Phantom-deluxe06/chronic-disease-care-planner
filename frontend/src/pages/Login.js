/**
 * Login Page Component
 * Dark theme matching landing and signup pages
 * Password show/hide toggle
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../config/api';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Lock, Eye, EyeOff, Layout, LogIn, User, Home, BarChart3, ClipboardList, TrendingUp, Settings } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email.trim()) {
            setError(t('Please enter your email'));
            return;
        }

        if (!formData.password) {
            setError(t('Please enter your password'));
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(apiUrl('/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || t('Login failed'));
            }

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/home');
        } catch (err) {
            setError(err.message || t('Invalid credentials. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-dark">
            {/* Background Elements */}
            <div className="auth-bg-glow"></div>

            <div className="login-container-dark">
                {/* Left Side - Preview */}
                <div className="login-preview">
                    <div className="preview-content">
                        <div className="preview-header">
                            <span className="preview-logo-icon">💚</span>
                            <span className="preview-logo-text">HealthBuddy</span>
                        </div>

                        <div className="preview-nav">
                            <div className="preview-nav-item active">
                                <Home size={16} /> {t('Home')}
                            </div>
                            <div className="preview-nav-item">
                                <BarChart3 size={16} /> {t('Health Logs')}
                            </div>
                            <div className="preview-nav-item">
                                <ClipboardList size={16} /> {t('Care Plan')}
                            </div>
                            <div className="preview-nav-item">
                                <TrendingUp size={16} /> {t('Reports')}
                            </div>
                            <div className="preview-nav-item">
                                <Settings size={16} /> {t('Settings')}
                            </div>
                        </div>

                        <div className="preview-user">
                            <div className="preview-avatar"><User size={20} /></div>
                            <div className="preview-user-info">
                                <span className="name">{t('Your Name')}</span>
                                <span className="email">you@email.com</span>
                            </div>
                        </div>
                    </div>

                    <div className="preview-blur-overlay">
                        <div className="lock-icon-container">
                            <Lock size={32} color="#06B6D4" />
                        </div>
                        <p>{t('Sign in to access your dashboard')}</p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="login-form-dark">
                    <div className="form-header">
                        <span className="welcome-icon">👋</span>
                        <h2>{t('Welcome Back!')}</h2>
                        <p>{t('Sign in to continue your wellness journey')}</p>
                    </div>

                    {error && <div className="error-message-dark">{error}</div>}

                    <form onSubmit={handleSubmit}>
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

                        <div className="form-options-dark">
                            <label className="remember-me">
                                <input type="checkbox" />
                                <span>{t('Remember me')}</span>
                            </label>
                            <a href="#forgot" className="forgot-link-dark">{t('Forgot password?')}</a>
                        </div>

                        <button type="submit" className="submit-btn-dark" disabled={loading}>
                            {loading ? t('Signing In...') : <><LogIn size={18} style={{ marginRight: '8px' }} /> {t('Sign In')}</>}
                        </button>
                    </form>

                    <div className="divider-dark">
                        <span>{t('or')}</span>
                    </div>

                    <p className="auth-switch-dark">
                        {t('Don\'t have an account?')} <Link to="/signup">{t('Create Account')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
