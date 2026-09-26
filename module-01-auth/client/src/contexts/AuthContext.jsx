import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('stocksense_token'));
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
          setPermissions(data.permissions || []);
        } catch (error) {
          localStorage.removeItem('stocksense_token');
          setToken(null);
          setUser(null);
          setPermissions([]);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('stocksense_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setPermissions(data.permissions || []);
    return data;
  };

  const signup = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('stocksense_token');
      setToken(null);
      setUser(null);
      setPermissions([]);
      navigate('/login');
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const hasPermission = (perm) => permissions.includes(perm);

  const value = {
    user,
    token,
    permissions,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    updateUser,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
