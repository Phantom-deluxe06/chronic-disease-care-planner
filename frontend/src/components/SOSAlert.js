/**
 * SOS Alert Component
 * Full-screen blinking alert when blood sugar is at critical levels
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, X, Heart, Siren } from 'lucide-react';
import './SOSAlert.css';

const SOSAlert = ({
    isOpen,
    onClose,
    alertData,
    emergencyContacts = []
}) => {
    const [acknowledged, setAcknowledged] = useState(false);

    // Play alert sound when opened
    useEffect(() => {
        if (isOpen && alertData?.severity === 'severe') {
            // Use Web Audio API for alert sound
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'square';
                gainNode.gain.value = 0.1;

                oscillator.start();

                // Stop after 3 seconds
                setTimeout(() => {
                    oscillator.stop();
                }, 3000);

                return () => {
                    oscillator.stop();
                };
            } catch (e) {
                console.log('Audio not available');
            }
        }
    }, [isOpen, alertData?.severity]);

    if (!isOpen || !alertData) return null;

    const handleAcknowledge = () => {
        setAcknowledged(true);
    };

    const handleClose = () => {
        if (acknowledged || alertData.severity !== 'severe') {
            setAcknowledged(false);
            onClose();
        }
    };

    const handleCall = (phone) => {
        window.open(`tel:${phone}`, '_self');
    };

    const isSevere = alertData.severity === 'severe';

    return (
        <div className={`sos-overlay ${isSevere ? 'sos-severe' : 'sos-warning'}`}>
            <div className="sos-content">
                {/* Alert Icon */}
                <div className="sos-icon-container">
                    {isSevere ? (
                        <Siren className="sos-icon sos-icon-blink" size={80} />
                    ) : (
                        <AlertTriangle className="sos-icon" size={80} />
                    )}
                </div>

                {/* Alert Title */}
                <h1 className="sos-title">
                    {isSevere ? 'EMERGENCY ALERT' : 'Health Warning'}
                </h1>

                {/* Alert Message */}
                <div className="sos-message">
                    <p>{alertData.message}</p>
                </div>

                {/* Action Instructions */}
                <div className="sos-action">
                    <Heart size={24} />
                    <p>{alertData.action}</p>
                </div>

                {/* Emergency Contacts */}
                {emergencyContacts.length > 0 && (
                    <div className="sos-contacts">
                        <h3>Emergency Contacts</h3>
                        <div className="sos-contact-list">
                            {emergencyContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    className="sos-contact-btn"
                                    onClick={() => handleCall(contact.phone)}
                                >
                                    <Phone size={20} />
                                    <div className="sos-contact-info">
                                        <span className="sos-contact-name">{contact.name}</span>
                                        <span className="sos-contact-relation">
                                            {contact.relationship || 'Emergency Contact'}
                                        </span>
                                    </div>
                                    <span className="sos-contact-phone">{contact.phone}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Acknowledge/Dismiss Buttons */}
                <div className="sos-buttons">
                    {isSevere && !acknowledged ? (
                        <button
                            className="sos-acknowledge-btn"
                            onClick={handleAcknowledge}
                        >
                            I Understand - Show Dismiss Button
                        </button>
                    ) : (
                        <button
                            className="sos-dismiss-btn"
                            onClick={handleClose}
                        >
                            <X size={20} />
                            Dismiss Alert
                        </button>
                    )}
                </div>

                {/* Disclaimer */}
                <p className="sos-disclaimer">
                    ⚠️ This is not a substitute for emergency medical services.
                    If you feel unwell, call emergency services immediately.
                </p>
            </div>
        </div>
    );
};

export default SOSAlert;
