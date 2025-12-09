import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../services/api';
import { categorizeError, sanitizeFormFields, sanitizeText } from '../utils/security';
import './CreateJobPost.css';

function CreateJobPost({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    requirements: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const sanitizedFields = sanitizeFormFields(formData);

      if (!sanitizedFields.title || !sanitizedFields.description) {
        setError({
          type: 'validation',
          message: 'Title and description are required.',
        });
        setLoading(false);
        return;
      }

      await jobAPI.createJob(sanitizedFields);
      setSuccess({ type: 'success', message: 'Job posted successfully!' });
      // Reset form
      setFormData({
        title: '',
        description: '',
        company: '',
        location: '',
        requirements: ''
      });
      // Redirect to feed after 2 seconds
      setTimeout(() => {
        navigate('/feed');
      }, 2000);
    } catch (err) {
      setError(categorizeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Post a Job</h1>
      <p className="page-subtitle">Share job opportunities with the community</p>

      <div className="create-job-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the job role, responsibilities, and what you're looking for..."
              rows="6"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">Company Name</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company name (optional)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Job location (optional)"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="requirements">Requirements</label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="List any specific requirements, skills, or qualifications (optional)"
              rows="4"
            />
          </div>

          {error && (
            <div className="error-message">
              {error.type && <strong>{error.type.toUpperCase()}: </strong>}
              {sanitizeText(error.message)}
            </div>
          )}
          {success && (
            <div className="success-message">
              {sanitizeText(success.message)}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/feed')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateJobPost;

