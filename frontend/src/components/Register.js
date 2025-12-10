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
    photo: null,
    role: 'employee',
    // Employer fields
    companyName: '',
    companyLocation: '',
    companyDescription: '',
    // Employee fields
    experiences: []
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newExperience, setNewExperience] = useState({ company: '', years: '', position: '' });
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

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setFormData(prev => ({
      ...prev,
      role,
      companyName: '',
      companyLocation: '',
      companyDescription: '',
      experiences: []
    }));
  };

  const handleAddExperience = () => {
    if (!newExperience.company || !newExperience.years || !newExperience.position) {
      setError({ type: 'validation', message: 'Please fill all experience fields' });
      return;
    }

    const years = parseFloat(newExperience.years);
    if (isNaN(years) || years <= 0) {
      setError({ type: 'validation', message: 'Years of experience must be a positive number' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, {
        company: sanitizeText(newExperience.company),
        years: years,
        position: sanitizeText(newExperience.position)
      }]
    }));

    setNewExperience({ company: '', years: '', position: '' });
    setError(null);
  };

  const handleRemoveExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
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

      // Role-specific validation
      if (formData.role === 'employer') {
        if (!formData.companyName.trim() || !formData.companyLocation.trim()) {
          setError({ type: 'validation', message: 'Company name and location are required for employers.' });
          setLoading(false);
          return;
        }
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', sanitizedFields.name);
      formDataToSend.append('email', sanitizedFields.email);
      formDataToSend.append('phone', normalizedPhone);
      formDataToSend.append('role', formData.role);

      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      // Add role-specific data
      if (formData.role === 'employer') {
        formDataToSend.append('companyName', sanitizeText(formData.companyName));
        formDataToSend.append('companyLocation', sanitizeText(formData.companyLocation));
        formDataToSend.append('companyDescription', sanitizeText(formData.companyDescription || ''));
      } else if (formData.role === 'employee') {
        formDataToSend.append('experiences', JSON.stringify(formData.experiences));
      }

      const response = await authAPI.register(formDataToSend);
      onLogin(
        response.data.user,
        response.data.accessToken,
        response.data.refreshToken
      );
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
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
              required
            >
              <option value="employee">Employee</option>
              <option value="employer">Employer</option>
            </select>
          </div>

          {formData.role === 'employer' && (
            <>
              <div className="form-group">
                <label htmlFor="companyName">Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  required
                  placeholder="Enter your company name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyLocation">Company Location *</label>
                <input
                  type="text"
                  id="companyLocation"
                  name="companyLocation"
                  value={formData.companyLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyLocation: e.target.value }))}
                  required
                  placeholder="Enter company location"
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyDescription">Company Description (Optional)</label>
                <textarea
                  id="companyDescription"
                  name="companyDescription"
                  value={formData.companyDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyDescription: e.target.value }))}
                  rows="3"
                  placeholder="Describe your company"
                />
              </div>
            </>
          )}

          {formData.role === 'employee' && (
            <>
              <div className="form-group">
                <label>Work Experience (Optional)</label>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Company name"
                    value={newExperience.company}
                    onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                    style={{ marginRight: '10px', marginBottom: '5px', width: '30%' }}
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={newExperience.position}
                    onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                    style={{ marginRight: '10px', marginBottom: '5px', width: '30%' }}
                  />
                  <input
                    type="number"
                    placeholder="Years"
                    value={newExperience.years}
                    onChange={(e) => setNewExperience(prev => ({ ...prev, years: e.target.value }))}
                    min="0"
                    step="0.5"
                    style={{ marginRight: '10px', marginBottom: '5px', width: '15%' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="btn btn-secondary"
                    style={{ marginBottom: '5px' }}
                  >
                    Add
                  </button>
                </div>
                {formData.experiences.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {formData.experiences.map((exp, index) => (
                      <li key={index} style={{ marginBottom: '5px', padding: '5px', background: '#f5f5f5', borderRadius: '4px' }}>
                        {exp.company} - {exp.position} ({exp.years} years)
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(index)}
                          style={{ marginLeft: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', padding: '2px 8px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

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

