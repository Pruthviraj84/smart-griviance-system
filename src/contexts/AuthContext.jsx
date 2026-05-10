import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, getUser, setAuth, clearAuth } from '../utils/auth';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();
    if (token && storedUser) {
      setUser(storedUser);
      connectSocket();
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token, userData) => {
    const normalizedRole = userData.role === 'Super Admin' ? 'SuperAdmin' : userData.role;
    const normalizedUser = { ...userData, role: normalizedRole };
    setAuth(token, normalizedUser);
    setUser(normalizedUser);
    connectSocket();
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    disconnectSocket();
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      const token = getToken();
      if (token) setAuth(token, next);
      return next;
    });
  }, []);

  const isAuthenticated = !!user && !!getToken();

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
