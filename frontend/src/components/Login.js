import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { categorizeError, isValidEmail, sanitizeText } from '../utils/security';
import './Auth.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const sanitizedEmail = sanitizeText(email).toLowerCase();

      if (!isValidEmail(sanitizedEmail)) {
        setError({ type: 'validation', message: 'Please enter a valid email address.' });
        setLoading(false);
        return;
      }
      const response = await authAPI.login(sanitizedEmail);
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
        <h1>Welcome to GIDC Jobs</h1>
        <p className="auth-subtitle">Sign in to continue</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          {error && (
            <div className="error-message">
              {error.type && <strong>{error.type.toUpperCase()}: </strong>}
              {error.message}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

