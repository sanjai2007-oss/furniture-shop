import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate existing session on mount
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await authService.getCurrentUser();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          } else {
            logout();
          }
        } catch {
          // If token verification fails (network down or expired)
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authService.login(email, password);
      if (res.success && res.data) {
        const { access_token, user: loggedUser } = res.data;
        setToken(access_token);
        setUser(loggedUser);
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        return { success: true, user: loggedUser };
      } else {
        const msg = res.message || 'Login failed';
        setAuthError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    authError,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
