import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { apiService } from '../services/api.service';
import { socketService } from '../services/socket.service';

interface User {
  id: string;
  name: string;
  email: string;
  proStatus?: string; // Add this property
  avatar?: string;    // Also add this commonly used property
  bio?: string;       // Add commonly used property 
  gender?: string;    // Add commonly used property
  isOnline?: boolean; // Add commonly used property
  isVerified?: boolean; // Add commonly used property
  registration?: number | string; // Add commonly used property
  lastSeen?: number;  // Add commonly used property
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
  isPro: boolean; // Add this line
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
  isPro: false, // Add this line
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
  const [isPro, setIsPro] = useState<boolean>(false); // Add this line

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // First check for cached user data to avoid unnecessary API calls
        const cachedUserData = localStorage.getItem('userData');
        const isSessionVerified = localStorage.getItem('sessionVerified') === 'true' || 
                                sessionStorage.getItem('sessionVerified') === 'true';
        
        // Get token (or null if not available/expired)
        const token = apiService.getToken();
        
        // If we have a verified session and cached data, use it immediately
        if (isSessionVerified && cachedUserData) {
          try {
            const userData = JSON.parse(cachedUserData);
            setCurrentUser(userData);
            console.log('Initial restore from cached user data');
            
            // Only perform background validation if we're online
            if (navigator.onLine) {
              // Use requestIdleCallback for non-critical operations
              const performBackgroundValidation = async () => {
                try {
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 3000);
                  
                  const response = await fetch(`${apiService.getBaseUrl()}/auth/validate`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({}),
                    signal: controller.signal
                  });
                  
                  clearTimeout(timeoutId);
                  
                  // Actually use the response
                  if (!response.ok && !!currentUser) {
                    console.log("Background validation failed - logging out");
                    apiService.clearToken();
                    setCurrentUser(null);
                  }
                } catch (e) {
                  // Only log the error
                  console.debug('Background validation error:', e);
                }
              };
              
              // Use requestIdleCallback if available, otherwise setTimeout
              if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(performBackgroundValidation);
              } else {
                setTimeout(performBackgroundValidation, 2000);
              }
            }
            
            return; // Exit early with cached data
          } catch (parseError) {
            console.error('Error parsing cached user data:', parseError);
            // Continue with normal flow if cache parsing fails
          }
        }
        
        if (token) {
          try {
            // Make a POST request instead of GET if that's what your API expects
            const response = await apiService.makeRequest('/auth/verify-token', 'POST');
            
            if (response.success && response.user) {
              // Set the current user from the response
              setCurrentUser(response.user);
              console.log("Token verification successful, user authenticated:", response.user);
              
              // Update cache
              localStorage.setItem('userData', JSON.stringify(response.user));
            } else {
              console.log("Token verification failed, clearing auth state");
              apiService.clearToken();
              setCurrentUser(null);
            }
          } catch (error) {
            console.error("Error during token verification:", error);
            // Only clear token for auth errors, not network errors
            if (!(error instanceof TypeError) || !error.message.includes('Failed to fetch')) {
              apiService.clearToken();
              setCurrentUser(null);
            }
          }
        } else {
          setCurrentUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    const checkAuthState = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Your existing auth checking code
          
          // Also ensure socket connection is established
          socketService.ensureConnected(token);
          
        } catch (error) {
          // Error handling
        }
      }
    };
    
    checkAuthState();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.proStatus) {
      setIsPro(currentUser.proStatus === 'monthly' || currentUser.proStatus === 'yearly');
    } else {
      setIsPro(false);
    }
  }, [currentUser]);

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

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      console.log(`Auth Context: Logging in ${email} with remember=${rememberMe}`);
      
      const response = await apiService.login(email, password);
      
      if (response.success && response.token) {
        // Store token with apiService
        apiService.setToken(response.token, rememberMe);
        
        // Connect socket AFTER setting the token
        socketService.connect(response.token);
        
        // Set current user
        setCurrentUser(response.user);
        
        // Add this console.log to check if user is set correctly
        console.log("Login successful, user set:", response.user);
        
        console.log("Successfully connected socket after login");

        // Explicitly set rememberMe in localStorage if checked
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        // Set current user
        setCurrentUser(response.user);
        
        // Cache user data for offline fallback
        if (response.user) {
          localStorage.setItem('userData', JSON.stringify(response.user));
        }

        setIsLoading(false);
        return {
          success: true,
          message: "Login successful"
        };
      } else {
        // Handle failed login
        setIsLoading(false);
        
        // Check if verification is needed
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

      // Disconnect socket
      socketService.disconnect();
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

  const silentValidation = async () => {
    try {
      const token = apiService.getToken();
      if (!token) return false;
      
      // Use a POST method if GET is not allowed
      const response = await fetch(`${apiService.getBaseUrl()}/auth/validate`, {
        method: 'POST', // Try POST instead of GET if you're getting 405 errors
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Empty body for POST request
      });
      
      return response.ok;
    } catch (error) {
      console.debug('Silent validation error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: !!currentUser,
        isPro, // Add this line
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