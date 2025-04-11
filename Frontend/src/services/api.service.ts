const BASE_URL = 'http://localhost:5000/api'; // Update this with your actual Flask API URL

export class ApiService {
  private API_URL: string;
  private token: string | null = null;

  constructor() {
    // Make sure this points to your running backend
    this.API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    console.log('API URL configured as:', this.API_URL);
    
    // Try to load token from both storages (session preferred, local as fallback)
    const sessionToken = sessionStorage.getItem('authToken');
    const sessionExpires = sessionStorage.getItem('authTokenExpires');
    
    if (sessionToken && sessionExpires && new Date() < new Date(sessionExpires)) {
      this.token = sessionToken;
    } else {
      // If not in session storage or expired, try local storage
      const localToken = localStorage.getItem('authToken');
      const localExpires = localStorage.getItem('authTokenExpires');
      
      if (localToken && localExpires && new Date() < new Date(localExpires)) {
        this.token = localToken;
        
        // Also update session storage for current session
        sessionStorage.setItem('authToken', localToken);
        sessionStorage.setItem('authTokenExpires', localExpires);
      }
    }
  }

  // Improve the makeRequest method with better error handling
  public async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' = 'GET', 
    data?: any,
    options?: RequestInit
  ): Promise<any> {
    const url = `${this.API_URL}${endpoint}`;
    console.log(`Making ${method} request to: ${url}`);
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add auth token if available
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add test IP header in development for location testing
      if (process.env.NODE_ENV === 'development') {
        // You can change this to any IP to test different locations
        headers['X-Test-IP'] = '8.8.8.8'; // Google DNS IP for testing
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(data) : undefined,
        credentials: 'include', // Important for CORS with credentials
        ...options,
      });
      
      // For OPTIONS responses in preflight, return success
      if (method === 'OPTIONS') {
        return { success: true };
      }
      
      // Handle API errors
      if (!response.ok) {
        let errorData: { message?: string } = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Could not parse error response as JSON", e);
        }
        
        return {
          success: false,
          status: response.status,
          message: errorData.message || `Error: ${response.statusText}`,
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  async register(email: string, password: string, profileData: any = {}) {
    const data = {
      email,
      password,
      name: profileData.name, // This will be used as username in the backend
      gender: profileData.gender || 'prefer_not_to_say',
      bio: profileData.bio || ''
    };
    
    return this.makeRequest('/auth/register', 'POST', data);
  }
  
  async login(email: string, password: string) {
    try {
      console.log(`Attempting to login: ${email}`);
      
      // Add better error handling for login
      const response = await this.makeRequest('/auth/login', 'POST', { email, password });
      
      if (response.success && response.token) {
        // Store token after successful login
        this.token = response.token;
        console.log('Login successful, token stored');
      }
      
      return response;
    } catch (error: any) {
      console.error('Login error in api.service:', error);
      return { 
        success: false, 
        message: error.message || 'Authentication failed',
        status: error.status || 401
      };
    }
  }
  
  async logout() {
    return this.makeRequest('/auth/logout', 'POST');
  }
  
  async verifyEmail(token: string) {
    return this.makeRequest('/auth/verify-email', 'POST', { token });
  }
  
  async resendVerification(email: string) {
    return this.makeRequest('/auth/resend-verification', 'POST', { email });
  }
  
  setToken(token: string, remember: boolean = false) {
    this.token = token; // Set token in the service instance
    
    // Store expiration date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    
    // ALWAYS store in sessionStorage for current session
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('authTokenExpires', expiryDate.toISOString());
    
    // If remember me is checked, ALSO store in localStorage for persistence
    if (remember) {
      console.log('Remember me enabled, storing token in localStorage');
      localStorage.setItem('authToken', token);
      localStorage.setItem('authTokenExpires', expiryDate.toISOString());
      localStorage.setItem('rememberMe', 'true');
    } else {
      // Clean up localStorage if remember me is not checked
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenExpires');
      localStorage.removeItem('rememberMe');
    }
  }
  
  clearToken() {
    this.token = null;
    
    // Clear all auth-related data from both storage types
    const keysToRemove = [
      'authToken', 
      'authTokenExpires', 
      'sessionVerified', 
      'sessionDetails',
      'rememberMe',
      'securityTokenVerified'
    ];
    
    // Clear from localStorage
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear from sessionStorage
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('All auth tokens and session data cleared');
  }
  
  getToken() {
    // Try different token sources in specific order
    
    // 1. First, the in-memory token (fastest)
    if (this.token) {
      return this.token;
    }
    
    // 2. Then sessionStorage (for current browser session)
    const sessionToken = sessionStorage.getItem('authToken');
    const sessionExpires = sessionStorage.getItem('authTokenExpires');
    
    if (sessionToken && sessionExpires) {
      const expirationDate = new Date(sessionExpires);
      if (new Date() < expirationDate) {
        this.token = sessionToken;
        return sessionToken;
      }
      // Clear expired token
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authTokenExpires');
    }
    
    // 3. Finally localStorage (for persistent login with remember me)
    const localToken = localStorage.getItem('authToken');
    const localExpires = localStorage.getItem('authTokenExpires');
    
    if (localToken && localExpires) {
      const expirationDate = new Date(localExpires);
      if (new Date() < expirationDate) {
        // Valid token found, also save it to sessionStorage and memory for future use
        this.token = localToken;
        sessionStorage.setItem('authToken', localToken);
        sessionStorage.setItem('authTokenExpires', localExpires);
        return localToken;
      }
      // Clear expired token
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenExpires');
    }
    
    return null; // No valid token found
  }

  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }
  
  async getCurrentUserProfile() {
    return this.makeRequest('/auth/me', 'GET');
  }

  async sendMagicLink(email: string) {
    try {
      const response = await this.makeRequest('/auth/magic-link', 'POST', { email });
      
      // If backend doesn't check verification, do it client-side
      if (response.success && !response.hasOwnProperty('needsVerification')) {
        try {
          // Check user verification status
          const userResponse = await this.makeRequest('/auth/check-verification', 'POST', { email });
          if (!userResponse.isVerified) {
            return {
              ...response,
              needsVerification: true
            };
          }
        } catch (e) {
          console.error('Error checking verification status:', e);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error sending magic link:', error);
      return { success: false, message: 'Failed to send magic link' };
    }
  }

  async forgotPassword(email: string) {
    return this.makeRequest('/auth/forgot-password', 'POST', { email });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.makeRequest('/auth/reset-password', 'POST', { token, password: newPassword });
  }

  async verifyMagicLink(token: string) {
    try {
      console.log("API Service: Verifying magic link token");
      const response = await this.makeRequest('/auth/verify-magic-link', 'POST', { token });
      
      if (response.success && response.token) {
        console.log("Magic link verification successful, setting token");
        this.setToken(response.token);
        
        // The session alert will be sent by the backend now
      } else {
        console.error("Magic link verification failed", response);
      }
      return response;
    } catch (error) {
      console.error("Error in verifyMagicLink:", error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error in magic link verification'
      };
    }
  }

  async sendSessionAlert(email: string, sessionData: any) {
    return this.makeRequest('/auth/session-alert', 'POST', { email, sessionData });
  }

  async generateUsername() {
    try {
      console.log("ApiService: Requesting username from backend");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await this.makeRequest('/auth/generate-username', 'GET', undefined, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log("ApiService: Received response from backend", response);
      
      if (response && response.success) {
        return response.username;
      }
      
      throw new Error(response?.message || 'Username generation failed on server');
    } catch (error) {
      console.error('ApiService: Username generation error:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }

  async testAppwriteEmail(email: string) {
    return this.makeRequest('/auth/test-appwrite-email', 'POST', { email });
  }

  async getAppwriteDiagnostics() {
    return this.makeRequest('/auth/appwrite-diagnostics', 'GET');
  }

  verify2FA(userId: string, code: string) {
    return this.makeRequest('/auth/verify-2fa', 'POST', { userId, code });
  }

  resend2FACode(userId: string) {
    return this.makeRequest('/auth/resend-2fa', 'POST', { userId });
  }

  getUserInfo(userId: string) {
    return this.makeRequest('/auth/user-info', 'POST', { userId });
  }
}

export const apiService = new ApiService();