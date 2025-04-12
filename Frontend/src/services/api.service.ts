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
    // Always store token in memory for current session
    this.token = token;
    
    // Calculate token expiry (e.g., 7 days for remember me, 1 day for session)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (remember ? 7 : 1));
    
    // Always store in sessionStorage (for tab persistence)
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('authTokenExpires', expiryDate.toISOString());
    
    // Set rememberMe flag in sessionStorage too
    sessionStorage.setItem('rememberMe', remember ? 'true' : 'false');
    
    // If "Remember Me" is checked, also store in localStorage
    if (remember) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('authTokenExpires', expiryDate.toISOString());
      localStorage.setItem('rememberMe', 'true');
    }
    
    // Set initial verification flags to prevent immediate logout
    sessionStorage.setItem('sessionVerified', 'true');
    if (remember) {
      localStorage.setItem('sessionVerified', 'true');
    }
  }
  
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenExpires');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authTokenExpires');
    
    // Clear verification statuses as well
    localStorage.removeItem('sessionVerified');
    sessionStorage.removeItem('sessionVerified');
    localStorage.removeItem('securityTokenVerified');
    sessionStorage.removeItem('securityTokenVerified');
  }
  
  getToken(): string | null {
    // First check memory
    if (this.token) {
      return this.token;
    }
    
    // Check if "Remember Me" was used
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    // Try to get token from session storage first (for current tab)
    let token = sessionStorage.getItem('authToken');
    let expires = sessionStorage.getItem('authTokenExpires');
    
    // If not in session storage or expired, and remember me is enabled,
    // check local storage
    if ((!token || !expires || new Date(expires) < new Date()) && rememberMe) {
      token = localStorage.getItem('authToken');
      expires = localStorage.getItem('authTokenExpires');
    }
    
    // If token exists and is not expired, return it
    if (token && expires && new Date(expires) > new Date()) {
      this.token = token; // Restore to memory
      return token;
    }
    
    // If we got here, token is either missing or expired
    this.clearToken(); // Clear any invalid tokens
    return null;
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

  async validateToken(): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      // Get the current token
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No token found' };
      }

      // Network check before making request
      const isOnline = navigator.onLine;
      if (!isOnline) {
        return { success: false, message: 'Offline mode' };
      }
      
      // Use try-catch with custom fetch to prevent CORS errors in console
      try {
        // Use a custom fetch approach with error suppression
        const response = await this.silentFetch('/auth/validate', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response && response.ok) {
          const data = await response.json();
          return { 
            success: true, 
            user: data.user 
          };
        }
        
        return { 
          success: false, 
          message: 'Invalid token response'
        };
      } catch (fetchError) {
        // Silently handle fetch errors
        return { 
          success: false, 
          message: 'Token validation fetch failed'
        };
      }
    } catch (error) {
      // Return failure without logging
      return { 
        success: false, 
        message: 'Token validation failed'
      };
    }
  }

  // Add this helper method to silently handle fetch requests
  private async silentFetch(endpoint: string, options: RequestInit = {}): Promise<Response | null> {
    try {
      const url = `${this.API_URL}${endpoint}`;
      return await fetch(url, {
        ...options,
        credentials: 'include'
      });
    } catch (error) {
      // Silently fail - no console errors
      return null;
    }
  }
}

export const apiService = new ApiService();