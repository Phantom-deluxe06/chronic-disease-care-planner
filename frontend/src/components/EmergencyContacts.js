/**
 * Emergency Contacts Manager Component
 * For Settings page - manage emergency SOS contacts
 */

import { useState, useEffect } from 'react';
import { Phone, UserPlus, Trash2, Star, AlertCircle } from 'lucide-react';
import { apiUrl } from '../config/api';
import './EmergencyContacts.css';

const EmergencyContacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        relationship: '',
        is_primary: false
    });
    const [saving, setSaving] = useState(false);

    // Fetch contacts on mount
    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(apiUrl('/emergency-contacts'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts || []);
            } else {
                throw new Error('Failed to fetch contacts');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(apiUrl('/emergency-contacts'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchContacts();
                setFormData({ name: '', phone: '', relationship: '', is_primary: false });
                setShowForm(false);
            } else {
                throw new Error('Failed to add contact');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (contactId) => {
        if (!window.confirm('Remove this emergency contact?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(apiUrl(`/emergency-contacts/${contactId}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setContacts(contacts.filter(c => c.id !== contactId));
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <div className="emergency-contacts-loading">Loading contacts...</div>;
    }

    return (
        <div className="emergency-contacts settings-card">
            <div className="emergency-contacts-header">
                <div className="header-info">
                    <h3><AlertCircle size={20} /> Emergency SOS Contacts</h3>
                    <p>These contacts will be notified when your blood sugar reaches critical levels.</p>
                </div>

                <button
                    className="add-contact-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    <UserPlus size={18} />
                    {showForm ? 'Cancel' : 'Add Contact'}
                </button>
            </div>

            {error && (
                <div className="emergency-contacts-error">
                    {error}
                </div>
            )}

            {/* Add Contact Form */}
            {showForm && (
                <form className="add-contact-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Mom, Dr. Smith"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Relationship</label>
                            <select
                                value={formData.relationship}
                                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                            >
                                <option value="">Select...</option>
                                <option value="Parent">Parent</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Child">Child</option>
                                <option value="Doctor">Doctor</option>
                                <option value="Friend">Friend</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.is_primary}
                                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                                />
                                Set as Primary Contact
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="save-contact-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Contact'}
                    </button>
                </form>
            )}

            {/* Contacts List */}
            <div className="contacts-list">
                {contacts.length === 0 ? (
                    <div className="no-contacts">
                        <Phone size={40} />
                        <p>No emergency contacts added yet</p>
                        <span>Add contacts to receive alerts during health emergencies</span>
                    </div>
                ) : (
                    contacts.map((contact) => (
                        <div key={contact.id} className={`contact-card ${contact.is_primary ? 'primary' : ''}`}>
                            <div className="contact-avatar">
                                <Phone size={24} />
                            </div>
                            <div className="contact-info">
                                <div className="contact-name">
                                    {contact.name}
                                    {contact.is_primary && <Star size={14} className="primary-star" />}
                                </div>
                                <div className="contact-phone">{contact.phone}</div>
                                {contact.relationship && (
                                    <div className="contact-relationship">{contact.relationship}</div>
                                )}
                            </div>
                            <button
                                className="delete-contact-btn"
                                onClick={() => handleDelete(contact.id)}
                                title="Remove contact"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Info Note */}
            <div className="emergency-info-note">
                ⚠️ SOS alerts trigger when blood sugar is below 70 mg/dL or above 250 mg/dL
            </div>
        </div>
    );
};

export default EmergencyContacts;
