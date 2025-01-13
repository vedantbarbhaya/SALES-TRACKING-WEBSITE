
import api from './api';

export const login = async (email, password) => {
  try {
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

export const getUserProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const updateUserProfile = async (userData) => {
  const { data } = await api.put('/auth/profile', userData);
  return data;
};

