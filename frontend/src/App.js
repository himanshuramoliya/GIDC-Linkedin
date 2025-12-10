import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import JobFeed from './components/JobFeed';
import CreateJobPost from './components/CreateJobPost';
import MyJobs from './components/MyJobs';
import Navbar from './components/Navbar';
import { sanitizeUserProfile } from './utils/security';
import { authAPI } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and validate token
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');

      if (!savedUser || !refreshToken) {
        // No tokens, clear everything
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);
        const sanitizedUser = sanitizeUserProfile(parsedUser);
        
        if (!sanitizedUser?.id) {
          throw new Error('Invalid user data');
        }

        // If we have an access token, verify it's still valid
        // If not, try to refresh
        if (!accessToken) {
          // No access token, try to refresh
          try {
            const response = await authAPI.refresh(refreshToken);
            localStorage.setItem('accessToken', response.data.accessToken);
            setUser(sanitizedUser);
          } catch (refreshError) {
            // Refresh failed, clear everything
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } else {
          // We have an access token, set user
          setUser(sanitizedUser);
        }
      } catch (err) {
        // Invalid data, clear everything
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up automatic token refresh (refresh every 14 minutes, token expires in 15)
    const refreshInterval = setInterval(async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && user) {
        try {
          const response = await authAPI.refresh(refreshToken);
          localStorage.setItem('accessToken', response.data.accessToken);
        } catch (error) {
          // Refresh failed, logout user
          handleLogout();
        }
      }
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const handleLogin = (userData, accessToken, refreshToken) => {
    const sanitizedUser = sanitizeUserProfile(userData);
    if (!sanitizedUser?.id) {
      return;
    }
    setUser(sanitizedUser);
    localStorage.setItem('user', JSON.stringify(sanitizedUser));
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch (error) {
        // Ignore logout errors
      }
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/feed" /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/feed" /> : <Register onLogin={handleLogin} />} 
          />
          <Route 
            path="/feed" 
            element={user ? <JobFeed user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/create-job" 
            element={user?.role === 'employer' ? <CreateJobPost user={user} /> : user ? <Navigate to="/feed" /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/my-jobs" 
            element={user?.role === 'employer' ? <MyJobs user={user} /> : user ? <Navigate to="/feed" /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={user ? <Navigate to="/feed" /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

