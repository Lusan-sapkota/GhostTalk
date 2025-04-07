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
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>; // Add this line
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  setCurrentUser: () => {}, // Add this line with default implementation
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
    try {
      const response = await apiService.login(email, password);
      
      if (response.success) {
        // Check if user is verified
        if (!response.user.isVerified) {
          return {
            success: false,
            message: 'Please verify your email before logging in.',
            needsVerification: true,
            email
          };
        }
        
        // User is verified, proceed with login
        apiService.setToken(response.token, remember);
        setCurrentUser(response.user);
        return {
          success: true,
          message: 'Login successful'
        };
      } else {
        return {
          success: false,
          message: response.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
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
        setCurrentUser, // Add this line
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};