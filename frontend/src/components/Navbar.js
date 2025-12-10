import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildMediaUrl } from '../config';
import { sanitizeText } from '../utils/security';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const sanitizedName = sanitizeText(user?.name) || 'User';
  const photoUrl = user?.photo ? buildMediaUrl(user.photo) : null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/feed" className="navbar-brand">
          <h2>GIDC Jobs</h2>
        </Link>
        <div className="navbar-links">
          <Link to="/feed" className="nav-link">Feed</Link>
          {user?.role === 'employer' && (
            <Link to="/create-job" className="nav-link">Post Job</Link>
          )}
          {user?.role === 'employer' && (
            <Link to="/my-jobs" className="nav-link">My Jobs</Link>
          )}
          <div className="user-info">
            {photoUrl && (
              <img src={photoUrl} alt={sanitizedName} className="user-photo" />
            )}
            <span className="user-name">{sanitizedName}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

