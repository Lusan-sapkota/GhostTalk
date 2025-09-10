import React, { createContext, useContext, useState, useEffect } from 'react';
import { authUtils } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  profile_complete: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const login = async (newToken: string, userData: User) => {
    try {
      await authUtils.setAuthData(newToken, userData);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API if needed
      await authUtils.clearAuthData();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if API call fails, clear local data
      await authUtils.clearAuthData();
      setToken(null);
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    try {
      const { token: storedToken, user: storedUser } = await authUtils.getAuthData();
      setToken(storedToken);
      setUser(storedUser);
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    refreshAuth().finally(() => setIsLoading(false));
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
