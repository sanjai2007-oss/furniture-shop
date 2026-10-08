import React, { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const user = {
    name: 'Admin',
    role: 'ADMIN',
  };

  const value = {
    user,
    token: null,
    role: 'ADMIN',
    isAuthenticated: true,
    loading: false,
    authError: null,

    login: async () => ({
      success: true,
      user,
    }),

    logout: () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};