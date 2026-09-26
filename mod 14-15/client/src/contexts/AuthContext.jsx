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
          const { data: response } = await api.get('/auth/me');
          const result = response.data || response;
          setUser(result.user);
          setPermissions(result.permissions || []);
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
    const { data: response } = await api.post('/auth/login', { email, password });
    const result = response.data || response;
    localStorage.setItem('stocksense_token', result.token);
    setToken(result.token);
    setUser(result.user);
    setPermissions(result.permissions || []);
    return result;
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

  const hasPermission = (perm) => {
    if (user?.role_name === 'Inventory Manager' || user?.role_name === 'ADMIN' || user?.role_name === 'Super Admin') {
      return true;
    }
    return permissions.includes(perm);
  };

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
