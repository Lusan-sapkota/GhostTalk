const BASE_URL = 'http://localhost:5000/api'; // Update this with your actual Flask API URL

class ApiService {
  async makeRequest(endpoint: string, method: string = 'GET', data?: any, options?: any) {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const requestOptions: RequestInit = {
      method,
      headers,
      // Add credentials: 'include' for authentication requests
      credentials: 'include',
      // Merge any additional options provided
      ...options
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, requestOptions);
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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
      // Use credentials: 'include' to support cookies for authentication
      return this.makeRequest('/auth/login', 'POST', { email, password }, { credentials: 'include' });
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Authentication failed' };
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
    if (remember) {
      localStorage.setItem('authToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
    }
  }
  
  clearToken() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }
  
  getToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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
    const response = await this.makeRequest('/auth/verify-magic-link', 'POST', { token });
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async sendSessionAlert(email: string, sessionData: any) {
    return this.makeRequest('/auth/session-alert', 'POST', { email, sessionData });
  }
}

export const apiService = new ApiService();