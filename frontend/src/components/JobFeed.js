import React, { useState, useEffect } from 'react';
import { jobAPI } from '../services/api';
import { buildMediaUrl } from '../config';
import { categorizeError, sanitizeText } from '../utils/security';
import './JobFeed.css';

function JobFeed({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [interestedJobs, setInterestedJobs] = useState(new Set());

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobs();
      const sanitizedJobs = response.data.map((job) => {
        const safeJob = {
          ...job,
          title: sanitizeText(job.title),
          description: sanitizeText(job.description),
          company: sanitizeText(job.company),
          location: sanitizeText(job.location),
          requirements: sanitizeText(job.requirements),
        };

        if (job.postedByUser) {
          safeJob.postedByUser = {
            ...job.postedByUser,
            name: sanitizeText(job.postedByUser.name),
            photo: sanitizeText(job.postedByUser.photo),
          };
        }
        return safeJob;
      });
      setJobs(sanitizedJobs);
      setError(null);
    } catch (err) {
      setError(categorizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleShowInterest = async (jobId) => {
    try {
      await jobAPI.showInterest(jobId);
      setInterestedJobs(prev => new Set([...prev, jobId]));
      setFeedback({ type: 'success', message: 'Interest shown successfully!' });
    } catch (err) {
      setFeedback(categorizeError(err));
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
        <div className="error-message">
          {error.type && <strong>{error.type.toUpperCase()}: </strong>}
          {sanitizeText(error.message)}
        </div>
      </div>
    );
  }
      {feedback && (
        <div className={`card ${feedback.type === 'success' ? 'success-message' : 'error-message'}`}>
          {feedback.type && <strong>{feedback.type.toUpperCase()}: </strong>}
          {sanitizeText(feedback.message)}
        </div>
      )}


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
          {jobs.map(job => {
            const posterName = sanitizeText(job.postedByUser?.name) || 'Unknown';
            const title = sanitizeText(job.title);
            const company = sanitizeText(job.company);
            const location = sanitizeText(job.location);
            const description = sanitizeText(job.description);
            const requirements = sanitizeText(job.requirements);

            return (
            <div key={job.id} className="job-card">
              <div className="job-header">
                {job.postedByUser?.photo && (
                  <img 
                    src={buildMediaUrl(job.postedByUser.photo)} 
                    alt={posterName}
                    className="job-poster-photo"
                  />
                )}
                <div className="job-poster-info">
                  <h3 className="job-poster-name">{posterName}</h3>
                  <span className="job-date">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

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
          );
          })}
        </div>
      )}
    </div>
  );
}

export default JobFeed;

