import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh function
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - add access token
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  // Legacy support: fallback to user-id header if no token
  if (!accessToken) {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        config.headers['user-id'] = userData.id;
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, clear storage and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        processQueue(error, null);
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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
  refresh: (refreshToken) => {
    return api.post('/auth/refresh', { refreshToken });
  },
  logout: (refreshToken) => {
    return api.post('/auth/logout', { refreshToken });
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
  getJobApplicants: (jobId) => {
    return api.get(`/jobs/${jobId}/applicants`);
  },
};

export default api;

