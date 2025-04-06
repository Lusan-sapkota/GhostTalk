import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

// Type definitions for API responses
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

interface AuthResponse extends ApiResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  registration?: string;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  requireLogin: boolean;
  chatType: string;
  creatorId: string;
  createdAt: number;
  lastActivity: number;
  members: number;
}

export class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    // Create Axios instance with default config
    this.api = axios.create({
      baseURL: 'http://localhost:5000/api', // Change to your backend URL
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle common errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Handle specific HTTP errors
          if (error.response.status === 401) {
            // Unauthorized - clear token and redirect to login
            this.clearToken();
            // In a real app with routing, you might redirect to login page here
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from storage on initialization
    this.token = localStorage.getItem('authToken');
  }

  // Auth Token Management
  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  public getToken(): string | null {
    return this.token;
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Authentication API Calls
  public async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/register', { email, password, name });
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', { email, password });
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public logout(): void {
    this.clearToken();
  }

  // User API Calls
  public async getCurrentUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await this.api.get<ApiResponse<UserProfile>>('/user/profile');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public async updateUserProfile(name?: string, email?: string): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await this.api.put<ApiResponse<UserProfile>>('/user/profile', { name, email });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await this.api.get<ApiResponse<UserProfile>>(`/user/profile/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Chat API Calls
  public async sendMessage(recipientId: string, message: string): Promise<ApiResponse<ChatMessage>> {
    try {
      const response = await this.api.post<ApiResponse<ChatMessage>>('/chat/send', { recipientId, message });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public async getChatHistory(otherUserId: string): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const response = await this.api.get<ApiResponse<ChatMessage[]>>(`/chat/history/${otherUserId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public async getAllChats(): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const response = await this.api.get<ApiResponse<ChatMessage[]>>('/chat/all');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  // Room API Calls
  public async createRoom(
    name: string, 
    description: string = "", 
    isPrivate: boolean = false,
    requireLogin: boolean = true,
    chatType: string = 'discussion'
  ): Promise<ApiResponse<ChatRoom>> {
    try {
      const response = await this.api.post<ApiResponse<ChatRoom>>('/room/create', { 
        name, 
        description, 
        isPrivate,
        requireLogin,
        chatType
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public async getPublicRooms(): Promise<ApiResponse<ChatRoom[]>> {
    try {
      const response = await this.api.get<ApiResponse<ChatRoom[]>>('/room/public');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public async getPrivateRooms(): Promise<ApiResponse<ChatRoom[]>> {
    try {
      const response = await this.api.get<ApiResponse<ChatRoom[]>>('/room/private');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  public async getAllRooms(): Promise<ApiResponse<ChatRoom[]>> {
    try {
      const response = await this.api.get<ApiResponse<ChatRoom[]>>('/room/all');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }
}

// Create a singleton instance
export const apiService = new ApiService();
export default apiService;