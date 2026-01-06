/**
 * Login Page Component
 * PC-style layout with sidebar preview
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        setLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Login failed');
            }

            // Store token and user
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Navigate to home
            navigate('/home');
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { label: 'Home', icon: '🏠' },
        { label: 'Logs', icon: '📋' },
        { label: 'Care Plan', icon: '💊' },
        { label: 'Reports', icon: '📊' },
        { label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="auth-page login-page">
            <div className="login-container">
                {/* Left - Sidebar Preview */}
                <div className="login-sidebar-preview">
                    <div className="sidebar-preview-content">
                        <div className="preview-logo">
                            <span className="logo-icon">💚</span>
                            <span className="logo-text">CarePlanner</span>
                        </div>

                        <nav className="preview-nav">
                            {menuItems.map((item, index) => (
                                <div key={index} className="preview-nav-item">
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-label">{item.label}</span>
                                </div>
                            ))}
                        </nav>

                        <div className="preview-profile">
                            <div className="profile-avatar">?</div>
                            <div className="profile-info">
                                <p className="profile-name">Sign in to continue</p>
                                <p className="profile-email">your-email@example.com</p>
                            </div>
                        </div>
                    </div>

                    <div className="preview-overlay">
                        <div className="preview-lock">🔒</div>
                        <p>Sign in to access your care dashboard</p>
                    </div>
                </div>

                {/* Right - Login Form */}
                <div className="login-form-container">
                    <div className="login-form-wrapper">
                        <div className="login-header">
                            <div className="login-icon">👋</div>
                            <h2>Welcome Back!</h2>
                            <p>Sign in to continue your health journey</p>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
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

                            <div className="form-options">
                                <label className="checkbox-label">
                                    <input type="checkbox" />
                                    <span>Remember me</span>
                                </label>
                                <a href="#forgot" className="forgot-link">Forgot password?</a>
                            </div>

                            <button type="submit" className="btn-primary btn-full" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="login-divider">
                            <span>or</span>
                        </div>

                        <p className="auth-switch">
                            Don't have an account? <Link to="/signup">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
