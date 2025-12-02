import React, { useState, useEffect } from 'react';
import { jobAPI } from '../services/api';
import './MyJobs.css';

function MyJobs({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMyJobs();
  }, []);

  const loadMyJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getUserJobs(user.id);
      setJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close this job posting? It will no longer appear in the feed.')) {
      return;
    }

    try {
      await jobAPI.closeJob(jobId);
      // Update local state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, isClosed: true } : job
        )
      );
      alert('Job marked as closed successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close job');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading your jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const activeJobs = jobs.filter(job => !job.isClosed);
  const closedJobs = jobs.filter(job => job.isClosed);

  return (
    <div className="container">
      <h1 className="page-title">My Job Postings</h1>
      <p className="page-subtitle">Manage your job postings</p>

      {jobs.length === 0 ? (
        <div className="card">
          <p>You haven't posted any jobs yet.</p>
        </div>
      ) : (
        <>
          {activeJobs.length > 0 && (
            <div className="jobs-section">
              <h2 className="section-title">Active Jobs</h2>
              <div className="jobs-list">
                {activeJobs.map(job => (
                  <JobCard key={job.id} job={job} onClose={handleCloseJob} />
                ))}
              </div>
            </div>
          )}

          {closedJobs.length > 0 && (
            <div className="jobs-section">
              <h2 className="section-title">Closed Jobs</h2>
              <div className="jobs-list">
                {closedJobs.map(job => (
                  <JobCard key={job.id} job={job} onClose={handleCloseJob} isClosed />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ job, onClose, isClosed }) {
  return (
    <div className={`job-card ${isClosed ? 'closed' : ''}`}>
      {isClosed && <div className="closed-badge">CLOSED</div>}
      
      <div className="job-content">
        <h2 className="job-title">{job.title}</h2>
        {job.company && (
          <p className="job-company">Company: {job.company}</p>
        )}
        {job.location && (
          <p className="job-location">Location: {job.location}</p>
        )}
        <p className="job-description">{job.description}</p>
        {job.requirements && (
          <div className="job-requirements">
            <strong>Requirements:</strong>
            <p>{job.requirements}</p>
          </div>
        )}
        <p className="job-date">
          Posted on: {new Date(job.createdAt).toLocaleDateString()}
        </p>
      </div>

      {!isClosed && (
        <div className="job-actions">
          <button
            onClick={() => onClose(job.id)}
            className="btn btn-danger"
          >
            Close Job
          </button>
        </div>
      )}
    </div>
  );
}

export default MyJobs;

