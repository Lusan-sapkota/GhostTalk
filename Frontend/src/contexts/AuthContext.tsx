import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { apiService } from '../services/api.service';

interface User {
  id: string;
  name: string;
  email: string;
}

interface SessionVerificationResponse {
  success: boolean;
  message?: string;
  user?: User;
  sessionDetails?: any;
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ 
    success: boolean; 
    message: string;
    needsVerification?: boolean;
    email?: string;
  }>;
  register: (email: string, password: string, profileData?: any) => Promise<any>;
  logout: () => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  handleSessionVerification: (response: SessionVerificationResponse) => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: 'Login failed' }),
  register: async () => ({ success: false }),
  logout: async () => {},
  setCurrentUser: () => {},
  handleSessionVerification: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = apiService.getToken();
        
        if (token) {
          console.log("Found token, verifying...");
          try {
            const response = await apiService.makeRequest('/auth/verify-token', 'POST');
            
            console.log("Auth verification response:", response);
            
            if (response && response.success && response.user) {
              console.log("Setting authenticated user:", response.user);
              setCurrentUser(response.user);
              
              // Check if session is verified
              const sessionVerified = localStorage.getItem('sessionVerified') === 'true' || 
                                     sessionStorage.getItem('sessionVerified') === 'true';
              
              if (!sessionVerified) {
                // Handle unverified session if needed
                console.log("User authenticated but session not verified");
              }
            } else {
              console.log("Invalid token response, clearing authentication");
              apiService.clearToken();
              setCurrentUser(null);
            }
          } catch (verifyError) {
            console.error("Error verifying token:", verifyError);
            apiService.clearToken();
            setCurrentUser(null);
          }
        } else {
          console.log("No authentication token found");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        apiService.clearToken();
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const register = async (email: string, password: string, profileData?: any) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(email, password, profileData);
      if (response.success && response.user) {
      }
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const login = async (email: string, password: string, remember: boolean = false) => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Attempting login...');
      
      const response = await apiService.login(email, password);
      console.log('AuthContext: Login response:', response);
      
      if (response.success && response.token && response.user) {
        // Store token with remember preference
        apiService.setToken(response.token, remember);
        
        // Explicitly set current user from response
        setCurrentUser(response.user);
        
        // Reset session verification status when logging in
        localStorage.removeItem('sessionVerified');
        sessionStorage.removeItem('sessionVerified');
        
        // Store the remember preference so we know it on refresh
        if (remember) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        return {
          success: true,
          message: 'Login successful'
        };
      } else {
        setIsLoading(false);
        
        // Handle verification needed case
        if (response.needsVerification) {
          return {
            success: false,
            message: 'Please verify your email before logging in.',
            needsVerification: true,
            email
          };
        }
        
        return {
          success: false,
          message: response.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      setIsLoading(false);
      
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  };
  
  const logout = async () => {
    try {
      // Call the backend logout endpoint
      await apiService.logout();
      
      // Clear all authentication data
      apiService.clearToken();
      
      // Remove "Remember me" preference
      localStorage.removeItem('rememberMe');
      
      // Set current user to null
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if backend logout fails, clear local data
      apiService.clearToken();
      localStorage.removeItem('rememberMe');
      setCurrentUser(null);
    }
  };
  
  // Implementation of session verification handler

  const handleSessionVerification = (response: SessionVerificationResponse) => {
    if (response.success) {
      // Store verification status in both storage types
      localStorage.setItem('sessionVerified', 'true');
      sessionStorage.setItem('sessionVerified', 'true');
      
      // Also mark the security token as verified
      localStorage.setItem('securityTokenVerified', 'true');
      sessionStorage.setItem('securityTokenVerified', 'true');
      
      // Store session details
      if (response.sessionDetails) {
        const sessionDetailsStr = JSON.stringify(response.sessionDetails);
        localStorage.setItem('sessionDetails', sessionDetailsStr);
        sessionStorage.setItem('sessionDetails', sessionDetailsStr);
      }
      
      console.log('Session verification successful - user can now access the app');
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
        setCurrentUser,
        handleSessionVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};