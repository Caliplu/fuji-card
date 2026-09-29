import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, cartAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (!response.data?.token || !response.data?.user) throw new Error('Sign-in response was incomplete');
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      await mergeCartAfterLogin();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Unable to sign in');
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      if (!response.data?.token || !response.data?.user) throw new Error('Registration response was incomplete');
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      // If error is an object, ensure we throw a string for the UI
      const msg = error.response?.data?.error || error.message || 'Registration failed';
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const mergeCartAfterLogin = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      try {
        await cartAPI.merge(sessionId);
        localStorage.removeItem('sessionId');
      } catch (err) {
        console.log('Cart merge failed:', err);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      if (!response.data?.user) throw new Error('Profile update response was incomplete');
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Unable to update profile');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
