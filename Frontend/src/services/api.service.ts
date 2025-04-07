const BASE_URL = 'http://localhost:5000/api'; // Update this with your actual Flask API URL

class ApiService {
  async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, options);
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
      name: profileData.name,
      gender: profileData.gender,
      bio: profileData.bio || ''
    };
    
    return this.makeRequest('/auth/register', 'POST', data);
  }
  
  async login(email: string, password: string) {
    return this.makeRequest('/auth/login', 'POST', { email, password });
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
}

export const apiService = new ApiService();