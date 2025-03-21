// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getUserProfile } from '@/services/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error) {
        // If error, we're not authenticated - just continue with null user
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userData = await apiLogin(email, password);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    initialized,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    store: user?.store
  };

  return (
    <AuthContext.Provider value={value}>
      {initialized ? children : 
       <div className="flex h-screen items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
       </div>}
    </AuthContext.Provider>
  );
};