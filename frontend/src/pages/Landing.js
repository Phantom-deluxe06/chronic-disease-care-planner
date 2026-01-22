/**
 * Landing Page Component
 * Page 1 - Premium, attractive design to convert visitors
 */

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Landing = () => {
    const { t } = useLanguage();
    const [currentQuote, setCurrentQuote] = useState(0);
    const [activeFeature, setActiveFeature] = useState(null);

    const healthQuotes = [
        { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
        { text: "Health is not valued till sickness comes.", author: "Thomas Fuller" },
        { text: "The greatest wealth is health.", author: "Virgil" },
        { text: "A healthy outside starts from the inside.", author: "Robert Urich" },
        { text: "Your health is an investment, not an expense.", author: "Unknown" },
    ];

    // Stats for social proof
    const stats = [
        { number: '10K+', label: t('Active Users'), icon: '👥' },
        { number: '95%', label: t('Satisfaction'), icon: '⭐' },
        { number: '50K+', label: t('Tasks Completed'), icon: '✅' },
        { number: '24/7', label: t('Support'), icon: '💬' },
    ];

    // Feature details for popup modals
    const features = [
        {
            id: 'daily-routines',
            icon: '📋',
            title: t('Daily Routines'),
            shortDesc: t('Personalized care tasks based on your conditions'),
            fullTitle: t('Personalized Daily Care Plans'),
            description: t('Our intelligent system creates a customized daily routine specifically for your health conditions.'),
            highlights: [
                t('Time-based medication reminders'),
                t('Scheduled health monitoring tasks'),
                t('Diet recommendations for your condition'),
                t('Exercise suggestions tailored to you'),
                t('Sleep and wellness activities')
            ],
            example: t('For diabetes, your morning routine includes checking fasting sugar levels, taking insulin, and eating a low-glycemic breakfast.')
        },
        {
            id: 'health-logs',
            icon: '📊',
            title: t('Health Logs'),
            shortDesc: t('Track your vitals, medications & progress'),
            fullTitle: t('Comprehensive Health Tracking'),
            description: t('Keep a detailed record of your health journey to understand your progress over time.'),
            highlights: [
                t('Track blood sugar, BP, weight & more'),
                t('Log medications with timestamps'),
                t('Add notes about how you feel'),
                t('View history by day, week, or month'),
                t('Export reports for doctor visits')
            ],
            example: t('See trends in your readings and share detailed reports with your doctor during check-ups.')
        },
        {
            id: 'smart-reminders',
            icon: '🔔',
            title: t('Smart Reminders'),
            shortDesc: t('Never miss a medication or check-up'),
            fullTitle: t('Intelligent Health Reminders'),
            description: t('Our smart reminder system ensures you stay on track with your health management.'),
            highlights: [
                t('Medication reminders at the right times'),
                t('Doctor appointment notifications'),
                t('Scheduled health check reminders'),
                t('Refill alerts before you run out'),
                t('Mark tasks complete with one tap')
            ],
            example: t('Get gentle nudges throughout the day and advance notice for upcoming appointments.')
        }
    ];

    // Rotate quotes every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % healthQuotes.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [healthQuotes.length]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (activeFeature) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [activeFeature]);

    const openFeatureModal = (featureId) => {
        setActiveFeature(features.find(f => f.id === featureId));
    };

    const closeFeatureModal = () => {
        setActiveFeature(null);
    };

    return (
        <div className="landing-page">
            {/* Marquee Disclaimer */}
            <div className="marquee-container">
                <div className="marquee-content">
                    <span>{t('⚠️ DISCLAIMER: This app provides general health guidance only. Always consult your healthcare provider.')}</span>
                    <span>{t('💊 Remember to take your medications as prescribed by your doctor.')}</span>
                    <span>{t('🩺 Regular check-ups are essential for managing chronic conditions.')}</span>
                    <span>{t('⚠️ DISCLAIMER: This app provides general health guidance only. Always consult your healthcare provider.')}</span>
                    <span>{t('💊 Remember to take your medications as prescribed by your doctor.')}</span>
                    <span>{t('🩺 Regular check-ups are essential for managing chronic conditions.')}</span>
                </div>
            </div>

            {/* Hero Section */}
            <div className="landing-hero">
                <div className="hero-content">
                    {/* Quote Banner - Now at top, eye-catching */}
                    <div className="hero-quote">
                        <span className="quote-mark">"</span>
                        <p>{healthQuotes[currentQuote].text}</p>
                        <span className="quote-author">— {healthQuotes[currentQuote].author}</span>
                    </div>

                    {/* Main Hero */}
                    <div className="hero-main">
                        {/* Left - Illustration */}
                        <div className="hero-left">
                            <div className="hero-illustration">
                                <div className="glow-circle"></div>
                                <div className="illustration-circle">
                                    <div className="health-icons">
                                        <span className="health-icon icon-1">❤️</span>
                                        <span className="health-icon icon-2">💊</span>
                                        <span className="health-icon icon-3">📊</span>
                                        <span className="health-icon icon-4">👨‍⚕️</span>
                                        <span className="health-icon icon-5">🍎</span>
                                        <span className="health-icon icon-6">🏃</span>
                                    </div>
                                    <div className="illustration-person">🧘</div>
                                </div>
                                <div className="floating-cards">
                                    <div className="floating-card card-1">
                                        <span>✓</span> {t('Daily Tasks')}
                                    </div>
                                    <div className="floating-card card-2">
                                        <span>📋</span> {t('Health Logs')}
                                    </div>
                                    <div className="floating-card card-3">
                                        <span>📈</span> {t('Progress')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right - Content */}
                        <div className="hero-right">
                            <div className="hero-badge">{t('🏆 #1 Wellness Management App')}</div>

                            <h1 className="hero-title">
                                <span className="title-line">HealthBuddy</span>
                                <span className="title-line gradient">{t('Care Planner')}</span>
                            </h1>

                            <p className="hero-subtitle">{t('Your Personal Wellness Companion')}</p>

                            <p className="hero-description">
                                {t('Take control of your health with')} <strong>{t('personalized daily care plans')}</strong>,
                                {t('smart medication reminders, and progress tracking for')}
                                <span className="highlight"> {t('Diabetes')}</span> {t('and')}
                                <span className="highlight"> {t('Hypertension')}</span>.
                            </p>

                            {/* CTA Buttons */}
                            <div className="hero-cta">
                                <Link to="/signup" className="btn-primary btn-glow">
                                    <span>🚀</span> {t('Get Started Free')}
                                </Link>
                                <Link to="/login" className="btn-secondary btn-outline">
                                    {t('Sign In')}
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="trust-badges">
                                <div className="badge">{t('🔒 Secure & Private')}</div>
                                <div className="badge">{t('✨ 100% Free')}</div>
                                <div className="badge">{t('📱 Works Everywhere')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="stats-section">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <span className="stat-icon">{stat.icon}</span>
                                <span className="stat-number">{stat.number}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="features-section">
                <h2 className="section-title">
                    <span className="emoji">✨</span> {t('What We Offer')}
                </h2>
                <p className="section-subtitle">{t('Click on any feature to learn more')}</p>

                <div className="features-grid">
                    {features.map((feature) => (
                        <div
                            key={feature.id}
                            className="feature-card"
                            onClick={() => openFeatureModal(feature.id)}
                        >
                            <div className="feature-card-icon">{feature.icon}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.shortDesc}</p>
                            <span className="learn-more">{t('Learn More →')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Final CTA Section */}
            <div className="final-cta">
                <div className="cta-content">
                    <h2>{t('Ready to Take Control of Your Health?')}</h2>
                    <p>{t('Join thousands of people managing their chronic conditions better every day')}</p>
                    <Link to="/signup" className="btn-primary btn-large btn-glow">
                        <span>💚</span> {t('Start Your Free Journey Today')}
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="landing-footer">
                <p>{t('© 2024 Chronic Disease Care Planner | Built with ❤️ for better health')}</p>
            </footer>

            {/* Feature Detail Modal */}
            {activeFeature && (
                <div className="feature-modal-overlay" onClick={closeFeatureModal}>
                    <div className="feature-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="feature-modal-close" onClick={closeFeatureModal}>×</button>

                        <div className="feature-modal-header">
                            <span className="feature-modal-icon">{activeFeature.icon}</span>
                            <h2>{activeFeature.fullTitle}</h2>
                        </div>

                        <div className="feature-modal-content">
                            <p className="feature-modal-desc">{activeFeature.description}</p>

                            <div className="feature-modal-highlights">
                                <h4>What's Included:</h4>
                                <ul>
                                    {activeFeature.highlights.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="feature-modal-example">
                                <h4>💡 Example:</h4>
                                <p>{activeFeature.example}</p>
                            </div>

                            <div className="feature-modal-cta">
                                <h4>Ready to get started?</h4>
                                <p>Join thousands managing their health better every day</p>
                                <Link to="/signup" className="btn-primary">
                                    Sign Up Now - It's Free!
                                </Link>
                            </div>
                        </div>

                        <div className="feature-modal-footer">
                            Click outside or press × to close
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Landing;
