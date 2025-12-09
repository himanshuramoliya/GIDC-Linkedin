import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
  categorizeError,
  isValidEmail,
  sanitizeFormFields,
  sanitizeText,
} from '../utils/security';
import './Auth.css';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photo: null
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const sanitizedFields = sanitizeFormFields({
        name: formData.name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
      });

      if (!sanitizedFields.name) {
        setError({ type: 'validation', message: 'Full name is required.' });
        setLoading(false);
        return;
      }

      if (!isValidEmail(sanitizedFields.email)) {
        setError({ type: 'validation', message: 'Please enter a valid email address.' });
        setLoading(false);
        return;
      }

      const normalizedPhone = sanitizedFields.phone.replace(/[^0-9+]/g, '');
      if (normalizedPhone.length < 7 || normalizedPhone.length > 15) {
        setError({
          type: 'validation',
          message: 'Please enter a valid phone number (7-15 digits).',
        });
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', sanitizedFields.name);
      formDataToSend.append('email', sanitizedFields.email);
      formDataToSend.append('phone', normalizedPhone);
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      const response = await authAPI.register(formDataToSend);
      onLogin(response.data.user);
      navigate('/feed');
    } catch (err) {
      setError(categorizeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join GIDC Jobs to post and find opportunities</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="photo">Profile Photo (Optional)</label>
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {photoPreview && (
              <img src={photoPreview} alt="Preview" className="photo-preview" />
            )}
          </div>

          {error && (
            <div className="error-message">
              {error.type && <strong>{error.type.toUpperCase()}: </strong>}
              {sanitizeText(error.message)}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

