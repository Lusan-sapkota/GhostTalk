import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { apiService } from '../services/api.service';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name?: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.getCurrentUserProfile();
          if (response.success && response.user) {
            setCurrentUser(response.user);
          } else {
            // Token might be invalid
            apiService.clearToken();
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          apiService.clearToken();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);
      if (response.success && response.user) {
        setCurrentUser(response.user);
      }
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(email, password, name);
      if (response.success && response.user) {
        setCurrentUser(response.user);
      }
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: !!currentUser,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};