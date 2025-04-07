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
  login: (email: string, password: string, remember?: boolean) => Promise<any>;
  register: (email: string, password: string, profileData?: any) => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
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

  // Enhanced register function with additional profile data
  const register = async (email: string, password: string, profileData?: any) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(email, password, profileData);
      if (response.success && response.user) {
        // We don't set the current user yet - they need to verify email first
        // setCurrentUser(response.user);
      }
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Enhanced login with remember me functionality
  const login = async (email: string, password: string, remember: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);
      if (response.success && response.user) {
        setCurrentUser(response.user);
        
        // Store token based on remember preference
        if (remember) {
          localStorage.setItem('authToken', response.token);
        } else {
          sessionStorage.setItem('authToken', response.token);
        }
      }
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };
  
  // Enhanced logout to clear all storage
  const logout = async () => {
    try {
      await apiService.logout();
      setCurrentUser(null);
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    } catch (error) {
      console.error('Logout error:', error);
    }
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