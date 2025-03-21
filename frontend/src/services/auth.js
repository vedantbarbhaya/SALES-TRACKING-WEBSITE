// frontend/src/services/auth.js
import api from './api';

export const login = async (email, password) => {
  try {
    // When using HTTP-only cookies, the cookie will be set automatically
    const { data } = await api.post('/auth/login', { 
      email, 
      password 
    });
    return data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Make a request to the logout endpoint to clear the cookie
    await api.post('/auth/logout');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};