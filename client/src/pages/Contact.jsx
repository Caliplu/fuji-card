import React, { useState } from 'react';
import './Contact.css';

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim() || '';
const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL?.trim() || '';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        const subject = encodeURIComponent(formData.subject);
        const body = encodeURIComponent(`Name: ${formData.name}\nReply to: ${formData.email}\n\n${formData.message}`);
        if (supportEmail) {
            window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="contact-page">
            {/* Warning Banner - Professional spacing handled in CSS */}
            <div className="warning-banner">
                <p>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    Beware of fake accounts pretending to be Fuji Card. Only use contact details shown on this website.
                </p>
            </div>

            <div className="contact-container container">
                <section className="hero-section">
                    <h1>We are here to help</h1>
                    <p className="subtitle">
                        {supportEmail
                            ? 'Fill in the form to open your email app, then press Send there.'
                            : instagramUrl ? 'Email support is being set up. You can contact us on Instagram.' : 'Support contact details are being set up.'}
                    </p>
                </section>

                {supportEmail && <section className="form-section">
                        <form className="premium-contact-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input type="text" name="subject" placeholder="Order Inquiry" value={formData.subject} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Your Message</label>
                                <textarea name="message" rows="5" placeholder="How can we help you today?" value={formData.message} onChange={handleChange} required></textarea>
                            </div>
                            <button type="submit" className="submit-btn-premium">Open Email App</button>
                        </form>
                </section>}

                <section className="contact-info-section">
                    <div className="info-card">
                        <p>{supportEmail || instagramUrl ? 'Contact Fuji Card using the details below.' : 'Contact details will appear here when they are ready.'}</p>
                        <div className="info-links">
                            {instagramUrl && <div className="info-item">
                                <i className="fa-brands fa-instagram" style={{ color: '#E1306C', marginRight: '10px' }}></i>
                                <strong>Instagram : </strong>
                                <a href={instagramUrl} target="_blank" rel="noreferrer">Instagram</a>
                            </div>}
                            {supportEmail && <div className="info-item">
                                <i className="fa-solid fa-envelope" style={{ color: '#3b82f6', marginRight: '10px' }}></i>
                                <strong>Email : </strong>
                                <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                            </div>}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Contact;
