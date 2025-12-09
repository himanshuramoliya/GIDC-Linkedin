import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user-id header to requests if user is logged in
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    config.headers['user-id'] = userData.id;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (formData) => {
    return api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  login: (email) => {
    return api.post('/auth/login', { email });
  },
};

// User API
export const userAPI = {
  getProfile: (userId) => {
    return api.get(`/users/${userId}`);
  },
};

// Job API
export const jobAPI = {
  createJob: (jobData) => {
    return api.post('/jobs', jobData);
  },
  getJobs: () => {
    return api.get('/jobs');
  },
  getJob: (jobId) => {
    return api.get(`/jobs/${jobId}`);
  },
  closeJob: (jobId) => {
    return api.patch(`/jobs/${jobId}/close`);
  },
  showInterest: (jobId) => {
    return api.post(`/jobs/${jobId}/interest`);
  },
  getUserJobs: (userId) => {
    return api.get(`/users/${userId}/jobs`);
  },
};

export default api;

