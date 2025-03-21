// frontend/src/services/api.js
import axios from 'axios';
import { config } from '@/config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true  // Essential for sending cookies
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we're not logged in yet, don't redirect to login page for auth errors
    if (error.response?.status === 401 && 
        !error.config.url.includes('/auth/login') && 
        !error.config.url.includes('/auth/profile')) {
      // Only redirect to login if it's not a login/profile API call
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;