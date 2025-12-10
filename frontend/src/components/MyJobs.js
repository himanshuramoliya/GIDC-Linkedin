import React, { useState, useEffect } from 'react';
import { jobAPI } from '../services/api';
import { buildMediaUrl } from '../config';
import { categorizeError, sanitizeText } from '../utils/security';
import './MyJobs.css';

function MyJobs({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [applicantsMap, setApplicantsMap] = useState({});
  const [loadingApplicants, setLoadingApplicants] = useState({});
  const [selectedJobId, setSelectedJobId] = useState(null);

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

  const loadApplicants = async (jobId) => {
    if (user.role !== 'employer') return;
    
    if (applicantsMap[jobId]) {
      // Toggle visibility
      setSelectedJobId(selectedJobId === jobId ? null : jobId);
      return;
    }

    try {
      setLoadingApplicants(prev => ({ ...prev, [jobId]: true }));
      const response = await jobAPI.getJobApplicants(jobId);
      setApplicantsMap(prev => ({ ...prev, [jobId]: response.data }));
      setSelectedJobId(jobId);
    } catch (err) {
      setFeedback(categorizeError(err));
    } finally {
      setLoadingApplicants(prev => ({ ...prev, [jobId]: false }));
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
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onClose={handleCloseJob}
                    user={user}
                    onViewApplicants={loadApplicants}
                    applicants={applicantsMap[job.id]}
                    loadingApplicants={loadingApplicants[job.id]}
                    showApplicants={selectedJobId === job.id}
                  />
                ))}
              </div>
            </div>
          )}

          {closedJobs.length > 0 && (
            <div className="jobs-section">
              <h2 className="section-title">Closed Jobs</h2>
              <div className="jobs-list">
                {closedJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onClose={handleCloseJob} 
                    isClosed
                    user={user}
                    onViewApplicants={loadApplicants}
                    applicants={applicantsMap[job.id]}
                    loadingApplicants={loadingApplicants[job.id]}
                    showApplicants={selectedJobId === job.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ job, onClose, isClosed, user, onViewApplicants, applicants, loadingApplicants, showApplicants }) {
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
          {user?.role === 'employer' && (
            <button
              onClick={() => onViewApplicants(job.id)}
              className="btn btn-primary"
              style={{ marginRight: '10px' }}
            >
              {loadingApplicants ? 'Loading...' : showApplicants ? 'Hide' : 'View'} Applicants
            </button>
          )}
          <button
            onClick={() => onClose(job.id)}
            className="btn btn-danger"
          >
            Close Job
          </button>
        </div>
      )}

      {showApplicants && applicants && (
        <div className="applicants-section" style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px' }}>Applicants ({applicants.length})</h3>
          {applicants.length === 0 ? (
            <p>No applicants yet.</p>
          ) : (
            <div className="applicants-list">
              {applicants.map((applicant) => (
                <ApplicantCard key={applicant.interestId} applicant={applicant} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ApplicantCard({ applicant }) {
  const user = applicant.user;
  const photoUrl = user.photo ? buildMediaUrl(user.photo) : null;

  return (
    <div className="applicant-card" style={{ 
      padding: '15px', 
      marginBottom: '10px', 
      background: 'white', 
      borderRadius: '8px',
      border: '1px solid #ddd'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        {photoUrl && (
          <img 
            src={photoUrl} 
            alt={sanitizeText(user.name)} 
            style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '15px', objectFit: 'cover' }}
          />
        )}
        <div>
          <h4 style={{ margin: 0 }}>{sanitizeText(user.name)}</h4>
          <p style={{ margin: '5px 0', color: '#666' }}>{sanitizeText(user.email)}</p>
          <p style={{ margin: '5px 0', color: '#666' }}>{sanitizeText(user.phone)}</p>
        </div>
      </div>
      
      {user.experiences && user.experiences.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>Experience:</strong>
          <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
            {user.experiences.map((exp, index) => (
              <li key={index}>
                {sanitizeText(exp.company)} - {sanitizeText(exp.position)} ({exp.years} years)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#888' }}>
        Applied on: {new Date(applicant.appliedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

export default MyJobs;

