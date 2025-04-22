import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api'; // Update this with your actual Flask API URL

export class ApiService {
  private API_URL: string;
  private token: string | null = null;

  constructor() {
    // Get the current hostname from the browser
    const hostname = window.location.hostname;
    
    // Determine if we're running in GitHub Codespaces
    const isGitHubCodespaces = hostname.includes('.github.dev');
    
    if (isGitHubCodespaces) {
      // Extract the codespace prefix (remove any port number that might be part of it)
      const baseHostnameParts = hostname.split('.');
      const codespaceWithPort = baseHostnameParts[0]; // e.g. "automatic-engine-xqqxj997v77hv67q-8100"
      
      // Remove any port suffix from the codespace name
      const codespacePrefix = codespaceWithPort.replace(/-\d+$/, ''); // Remove port suffix
      
      // Create URL with backend port
      this.API_URL = `https://${codespacePrefix}-5000.${baseHostnameParts.slice(1).join('.')}`;
      console.log('Codespaces API URL constructed as:', this.API_URL);
    } else {
      // Regular local development
      this.API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    }
    
    // Add /api to the URL path
    this.API_URL = `${this.API_URL}/api`;
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

  // Update the makeRequest method to remove the problematic header
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

      // Remove this problematic header that causes CORS issues
      // if (process.env.NODE_ENV === 'development') {
      //   headers['X-Test-IP'] = '8.8.8.8'; // Google DNS IP for testing
      // }
      
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
    
    // Calculate token expiry (e.g., 14 days for remember me, 1 day for session)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (remember ? 14 : 1));
    
    // Store information in sessionStorage (for current tab)
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('authTokenExpires', expiryDate.toISOString());
    sessionStorage.setItem('sessionVerified', 'true');
    
    // If "Remember Me" is checked, also store in localStorage for persistence
    if (remember) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('authTokenExpires', expiryDate.toISOString());
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('sessionVerified', 'true');
    }
    
    console.log(`Token stored with remember=${remember}, expires=${expiryDate.toISOString()}`);
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
    
    // Check sessionStorage (current tab)
    const sessionToken = sessionStorage.getItem('authToken');
    const sessionExpiry = sessionStorage.getItem('authTokenExpires');
    
    if (sessionToken && sessionExpiry) {
      const expiryDate = new Date(sessionExpiry);
      if (expiryDate > new Date()) {
        this.token = sessionToken;
        return sessionToken;
      }
      // Clear expired token
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authTokenExpires');
    }
    
    // Check localStorage (cross-tab/browser persistence)
    const localToken = localStorage.getItem('authToken');
    const localExpiry = localStorage.getItem('authTokenExpires');
    
    if (localToken && localExpiry) {
      const expiryDate = new Date(localExpiry);
      if (expiryDate > new Date()) {
        this.token = localToken;
        // Also set in session for this tab
        sessionStorage.setItem('authToken', localToken);
        sessionStorage.setItem('authTokenExpires', localExpiry);
        return localToken;
      }
      // Clear expired token
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenExpires');
    }
    
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

  async submitSupportTicket(data: {
    name: string;
    email: string;
    subject: string;
    category: string;
    message: string;
    attachment?: File;
  }): Promise<{ success: boolean; message: string; ticketId?: string }> {
    try {
      // Check if there's an attachment
      if (data.attachment) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('subject', data.subject);
        formData.append('category', data.category);
        formData.append('message', data.message);
        formData.append('attachment', data.attachment);
        
        const headers: Record<string, string> = {};
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        // Don't set Content-Type when using FormData - browser will set it with correct boundary
        const response = await fetch(`${this.API_URL}/support/ticket/with-attachment`, {
          method: 'POST',
          headers,
          body: formData
        });
        
        const responseData = await response.json();
        return responseData;
      } else {
        // No attachment - use regular JSON request
        return this.makeRequest('/support/ticket', 'POST', {
          name: data.name,
          email: data.email,
          subject: data.subject,
          category: data.category,
          message: data.message
        });
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      return { success: false, message: 'Failed to submit support ticket' };
    }
  }

  // Update the requestSubscription method to handle profile fetch errors

  async requestSubscription(data: {
    plan: string;
    country: string;
  }): Promise<{ success: boolean; message: string; requestId?: string }> {
    try {
      // Get user info from auth context or storage
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'You must be logged in to request a subscription' };
      }
      
      // Get user email and name - handle failures gracefully
      let userEmail = '';
      let userName = '';
      
      try {
        // Try to get user profile but don't fail if this doesn't work
        const userData = await this.getCurrentUserProfile();
        if (userData && userData.success && userData.user) {
          userEmail = userData.user.email || '';
          userName = userData.user.name || '';
        }
      } catch (profileError) {
        console.log('Could not fetch user profile, continuing with subscription request');
        // Don't fail - continue with the subscription request
      }
      
      // If we couldn't get the email from the profile, try localStorage
      if (!userEmail) {
        try {
          const cachedData = localStorage.getItem('userData');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            userEmail = parsedData.email || '';
            userName = parsedData.name || '';
          }
        } catch (e) {
          console.log('Could not get user data from cache');
        }
      }
      
      const requestData = {
        ...data,
        email: userEmail,
        name: userName
      };
      
      // Use fetch instead of axios to have more control over the response handling
      const response = await fetch(`${this.API_URL}/billing/subscription-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', await response.text());
        return {
          success: false,
          message: `Server returned non-JSON response (${response.status})`
        };
      }
      
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Error requesting subscription:', error);
      return {
        success: false,
        message: error instanceof Error ? `Request failed: ${error.message}` : 'Failed to submit subscription request'
      };
    }
  }

  getBaseUrl(): string {
    return this.API_URL;
  }

  // Search users
  searchUsers(query: string, limit: number = 20, offset: number = 0): Promise<any> {
    return this.makeRequest(
      `/search/users?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
      'GET'
    );
  }

  // Find a user by ID (useful for QR scanning)
  // Find a user by ID (useful for QR scanning)
  getUserById(userId: string): Promise<any> {
    return this.makeRequest(`/search/by-id/${userId}`, 'GET');
  }

  // Add these methods to ApiService class
  async getUserSettings(): Promise<any> {
    try {
      const response = await this.makeRequest('/user/settings', 'GET');
      console.log("API response for settings:", response);
      return response;
    } catch (error) {
      console.error("Error fetching settings:", error);
      throw error;
    }
  }

  async updateUserSettings(settings: {
    requireMessageApproval?: boolean;
    enableSearch?: boolean;
    readReceipts?: boolean;
    genderVisibility?: string;
    bioVisibility?: string;
    emailVisibility?: string;
    memberSinceVisibility?: string;
    favoritesRequest?: boolean; // Note: singular, not plural
    twoFactorAuthEnabled?: boolean;
    chatRetention?: string;
    enableNotifications?: boolean; // Add this property
    notificationsSounds?: string; // Add this property
  }): Promise<any> {
    try {
      const response = await this.makeRequest('/user/settings', 'PUT', settings);
      console.log("API response for updating settings:", response);
      return response;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }

  async updateSearchVisibility(enabled: boolean): Promise<any> {
    return this.makeRequest('/user/search-visibility', 'PUT', { enableSearch: enabled });
  }

  // Add these methods to your ApiService class

  // Get all devices where the user is logged in
  async getLoggedDevices(): Promise<any> {
    return this.makeRequest('/user/devices', 'GET');
  }

  // Log out from a specific device
  async logoutDevice(deviceId: string): Promise<any> {
    return this.makeRequest(`/user/devices/${deviceId}/logout`, 'POST');
  }

  // Update device name (optional)
  async updateDeviceName(deviceId: string, name: string): Promise<any> {
    return this.makeRequest(`/user/devices/${deviceId}/name`, 'PUT', { name });
  }

  // Rate the app (to track if user has already rated)
  async trackAppRating(): Promise<any> {
    return this.makeRequest('/user/app-rating', 'POST');
  }

  // Add the following methods to your apiService class

  async getFriendsList(): Promise<any> {
    return this.makeRequest('/friend/list', 'GET');
  }

  async getFriendRequests(): Promise<any> {
    return this.makeRequest('/friend/requests', 'GET');
  }

  async sendFriendRequest(userId: string): Promise<any> {
    return this.makeRequest('/friend/request/send', 'POST', { userId });
  }

  async acceptFriendRequest(requestId: string): Promise<any> {
    return this.makeRequest('/friend/request/accept', 'POST', { requestId });
  }

  async rejectFriendRequest(requestId: string): Promise<any> {
    return this.makeRequest('/friend/request/reject', 'POST', { requestId });
  }

  async cancelFriendRequest(requestId: string): Promise<any> {
    return this.makeRequest('/friend/request/cancel', 'POST', { requestId });
  }

  async removeFriend(userId: string): Promise<any> {
    return this.makeRequest('/friend/remove', 'POST', { userId });
  }
}

export const apiService = new ApiService();