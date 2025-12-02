import React, { useState, useEffect } from 'react';
import { jobAPI } from '../services/api';
import './JobFeed.css';

function JobFeed({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interestedJobs, setInterestedJobs] = useState(new Set());

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobs();
      setJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleShowInterest = async (jobId) => {
    try {
      await jobAPI.showInterest(jobId);
      setInterestedJobs(prev => new Set([...prev, jobId]));
      alert('Interest shown successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to show interest');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading jobs...</div>
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

  return (
    <div className="container">
      <h1 className="page-title">Job Feed</h1>
      <p className="page-subtitle">Discover new opportunities</p>

      {jobs.length === 0 ? (
        <div className="card">
          <p>No active job postings at the moment. Check back later!</p>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                {job.postedByUser?.photo && (
                  <img 
                    src={`http://localhost:5000${job.postedByUser.photo}`} 
                    alt={job.postedByUser.name}
                    className="job-poster-photo"
                  />
                )}
                <div className="job-poster-info">
                  <h3 className="job-poster-name">{job.postedByUser?.name || 'Unknown'}</h3>
                  <span className="job-date">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

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
              </div>

              <div className="job-actions">
                <button
                  onClick={() => handleShowInterest(job.id)}
                  className={`btn ${interestedJobs.has(job.id) ? 'btn-secondary' : 'btn-primary'}`}
                  disabled={interestedJobs.has(job.id)}
                >
                  {interestedJobs.has(job.id) ? '✓ Interest Shown' : 'Show Interest'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobFeed;

