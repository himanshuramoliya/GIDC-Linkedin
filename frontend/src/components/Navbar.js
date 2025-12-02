import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/feed" className="navbar-brand">
          <h2>GIDC Jobs</h2>
        </Link>
        <div className="navbar-links">
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/create-job" className="nav-link">Post Job</Link>
          <Link to="/my-jobs" className="nav-link">My Jobs</Link>
          <div className="user-info">
            {user.photo && (
              <img src={`http://localhost:5000${user.photo}`} alt={user.name} className="user-photo" />
            )}
            <span className="user-name">{user.name}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

