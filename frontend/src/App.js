import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import JobFeed from './components/JobFeed';
import CreateJobPost from './components/CreateJobPost';
import MyJobs from './components/MyJobs';
import Navbar from './components/Navbar';
import { sanitizeUserProfile } from './utils/security';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in (stored in localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const sanitizedUser = sanitizeUserProfile(parsedUser);
        if (sanitizedUser?.id) {
          setUser(sanitizedUser);
        } else {
          localStorage.removeItem('user');
        }
      } catch (err) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    const sanitizedUser = sanitizeUserProfile(userData);
    if (!sanitizedUser?.id) {
      return;
    }
    setUser(sanitizedUser);
    localStorage.setItem('user', JSON.stringify(sanitizedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

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
            element={user ? <CreateJobPost user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/my-jobs" 
            element={user ? <MyJobs user={user} /> : <Navigate to="/login" />} 
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

