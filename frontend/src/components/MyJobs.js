import React, { useState, useEffect } from 'react';
import { jobAPI } from '../services/api';
import { categorizeError, sanitizeText } from '../utils/security';
import './MyJobs.css';

function MyJobs({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadMyJobs();
  }, []);

  const loadMyJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getUserJobs(user.id);
      const sanitizedJobs = response.data.map((job) => ({
        ...job,
        title: sanitizeText(job.title),
        description: sanitizeText(job.description),
        company: sanitizeText(job.company),
        location: sanitizeText(job.location),
        requirements: sanitizeText(job.requirements),
      }));
      setJobs(sanitizedJobs);
      setError(null);
    } catch (err) {
      setError(categorizeError(err));
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
      setFeedback({ type: 'success', message: 'Job marked as closed successfully!' });
    } catch (err) {
      setFeedback(categorizeError(err));
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
        <div className="error-message">
          {error.type && <strong>{error.type.toUpperCase()}: </strong>}
          {sanitizeText(error.message)}
        </div>
      {feedback && (
        <div className={`card ${feedback.type === 'success' ? 'success-message' : 'error-message'}`}>
          {feedback.type && <strong>{feedback.type.toUpperCase()}: </strong>}
          {sanitizeText(feedback.message)}
        </div>
      )}
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
  const title = sanitizeText(job.title);
  const company = sanitizeText(job.company);
  const location = sanitizeText(job.location);
  const description = sanitizeText(job.description);
  const requirements = sanitizeText(job.requirements);

  return (
    <div className={`job-card ${isClosed ? 'closed' : ''}`}>
      {isClosed && <div className="closed-badge">CLOSED</div>}
      
      <div className="job-content">
        <h2 className="job-title">{title}</h2>
        {company && (
          <p className="job-company">Company: {company}</p>
        )}
        {location && (
          <p className="job-location">Location: {location}</p>
        )}
        <p className="job-description">{description}</p>
        {requirements && (
          <div className="job-requirements">
            <strong>Requirements:</strong>
            <p>{requirements}</p>
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

