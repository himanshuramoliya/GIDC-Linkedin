// Use a relative API path so the browser always talks to the same origin
// (ngrok URL in your case) and the dev server / reverse proxy forwards to
// the real backend on localhost:5000.
const DEFAULT_API_URL = '/api';

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.__ENV?.REACT_APP_API_URL) ||
  DEFAULT_API_URL;

export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const buildMediaUrl = (path = '') => {
  if (!path) return '';
  return `${MEDIA_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

