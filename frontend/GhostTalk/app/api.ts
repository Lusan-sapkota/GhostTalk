import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Resolve a backend base URL that works on device, emulator, and web
function resolveApiBaseUrl() {
  // Highest priority: explicit env override
  const envHost = process.env.EXPO_PUBLIC_BACKEND_IP || process.env.REACT_NATIVE_BACKEND_IP;
  if (envHost && typeof envHost === 'string' && envHost.trim().length > 0) {
    const baseUrl = `http://${envHost.trim()}:8000`;
    console.log('Resolved API base URL from EXPO_PUBLIC_BACKEND_IP:', baseUrl);
    return baseUrl;
  }
  // Try to infer LAN IP from Expo Go config when running in dev
  const hostUri = (Constants as any)?.expoGoConfig?.hostUri || (Constants as any)?.expoConfig?.hostUri;
  let host = undefined as string | undefined;
  if (typeof hostUri === 'string') {
    // e.g. "192.168.18.43:8081"
    host = hostUri.split(':')[0];
    console.log('Expo Go detected hostUri:', hostUri, 'extracted host:', host);
  }
  if (!host) {
    // For physical devices, use the local network IP
    // For Android emulator, use 10.0.2.2
    // For iOS simulator, use localhost
    if (Platform.OS === 'android') {
      // Check if we're on a physical device vs emulator
      // If expoGoConfig exists, we're likely on a physical device
      if ((Constants as any)?.expoGoConfig) {
        // Use local network IP for physical Android devices
        // Try to get the IP from environment or use common local network IPs
        host = process.env.EXPO_PUBLIC_BACKEND_IP ||
               process.env.REACT_NATIVE_BACKEND_IP ||
               '192.168.18.2'; // Default fallback
        console.log('Using physical Android device IP:', host);
      } else {
        // Use Android emulator IP
        host = '10.0.2.2';
        console.log('Using Android emulator IP:', host);
      }
    } else if (Platform.OS === 'ios') {
      host = 'localhost';
      console.log('Using iOS localhost');
    } else {
      host = 'localhost';
      console.log('Using default localhost');
    }
  }
  const baseUrl = `http://${host}:8000`;
  console.log('Resolved API base URL:', baseUrl);
  return baseUrl;
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(async (config) => {
  // Skip adding token for certain endpoints
  const skipAuthEndpoints = ['/user/login/', '/user/register/', '/user/request-password-reset/'];
  const shouldSkipAuth = skipAuthEndpoints.some(endpoint => config.url?.includes(endpoint));

  if (!shouldSkipAuth) {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => {
    // Check if response is HTML (Django login page) - but only for error responses
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      console.warn('Received HTML response - checking if it\'s an auth failure');

      // Only treat as auth failure if it's actually an error status or contains login form
      const isAuthFailure = response.status >= 400 ||
                           response.data.includes('login') ||
                           response.data.includes('Login') ||
                           response.data.includes('authenticate');

      if (isAuthFailure) {
        console.warn('Treating as authentication failure - clearing token');

        // Determine the type of authentication page
        let errorMessage = 'Authentication required';
        if (response.data.includes('login') || response.data.includes('Login')) {
          errorMessage = 'Please log in to continue';
        } else if (response.data.includes('password') || response.data.includes('Password')) {
          errorMessage = 'Session expired. Please log in again';
        } else if (response.data.includes('403') || response.data.includes('Forbidden')) {
          errorMessage = 'Access denied. Please log in with proper permissions';
        }

        // Clear invalid token
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('user');

        // Create a custom error
        const authError = new Error(errorMessage);
        authError.name = 'AuthenticationError';
        throw authError;
      } else {
        console.warn('HTML response but not treating as auth failure');
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip token refresh for auth endpoints
      const skipRefreshEndpoints = ['/user/login/', '/user/register/', '/user/refresh-token/', '/user/logout/'];
      const shouldSkipRefresh = skipRefreshEndpoints.some(endpoint => originalRequest?.url?.includes(endpoint));

      if (!shouldSkipRefresh) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const refreshResponse = await api.post('/user/refresh-token/');
          const newToken = refreshResponse.data.token;

          // Update stored token
          await AsyncStorage.setItem('token', newToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Token refresh failed, clear auth data
          console.warn('Token refresh failed, clearing auth data');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          return Promise.reject(refreshError);
        }
      }
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.warn('Access forbidden - token might be expired or invalid');
    }

    // Handle network errors and log response body for easier debugging
    if (!error.response) {
      console.error('Network error - check your internet connection');
      const networkError = new Error('Network connection failed. Please check your internet connection and try again.');
      networkError.name = 'NetworkError';
      return Promise.reject(networkError);
    } else {
      try {
        console.warn('API error response:', {
          status: error.response.status,
          data: error.response.data,
          url: originalRequest?.url,
          method: originalRequest?.method,
        });
      } catch {}
    }

    return Promise.reject(error);
  }
);

export default api;

// Authentication utilities
export const authUtils = {
  async setAuthData(token: string, userData: any) {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  },

  async getAuthData() {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      return {
        token,
        user: userData ? JSON.parse(userData) : null
      };
    } catch (error) {
      console.error('Error getting auth data:', error);
      return { token: null, user: null };
    }
  },

  async clearAuthData() {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  async isAuthenticated() {
    const { token } = await this.getAuthData();
    return !!token;
  }
};

// Email and password validation utilities
export const validationUtils = {
  validateEmailFormat(email: string): { isValid: boolean; error?: string } {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    // Check for disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'temp-mail.org',
      'throwaway.email', 'yopmail.com', 'maildrop.cc', 'tempail.com', 'dispostable.com',
      '0-mail.com', 'mail-temporaire.fr', 'spamgourmet.com', 'getnada.com', 'mailcatch.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      return { isValid: false, error: 'Disposable email addresses are not allowed. Please use a permanent email address.' };
    }

    return { isValid: true };
  },

  validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    // Check for at least one uppercase, one lowercase, and one number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
    }

    return { isValid: true };
  }
};

// User APIs
export const registerUser = (firstName: string, lastName: string, username: string, email: string, password: string) => {
  return api.post('/user/register/', {
    first_name: firstName,
    last_name: lastName,
    username: username,
    email: email,
    password1: password,
    password2: password
  });
};

export const loginUser = (usernameOrEmail: string, password: string) =>
  api.post('/user/login/', { username: usernameOrEmail, password });

export const logoutUser = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      await api.post('/user/logout/', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.warn('Logout API call failed, but clearing local data anyway:', error);
  } finally {
    // Always clear local auth data regardless of API call success
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }
};

export const refreshToken = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('No token available for refresh');
  }

  return api.post('/user/refresh-token/', {}, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const verifyOTP = (userId: number, otpCode: string) => {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('otp_code', otpCode);

  return api.post('/user/verify-otp/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const checkUsername = (username: string) =>
  api.get(`/user/check-username/?username=${encodeURIComponent(username)}`);

export const requestPasswordReset = (email: string) =>
  api.post('/user/request-password-reset/', { email });

export const verifyPasswordResetOTP = (userId: number, otpCode: string) => {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('otp_code', otpCode);

  return api.post('/user/verify-password-reset-otp/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const resetPassword = (userId: number, otpCode: string, newPassword: string, confirmPassword: string) => {
  const formData = new FormData();
  formData.append('user_id', userId.toString());
  formData.append('otp_code', otpCode);
  formData.append('new_password', newPassword);
  formData.append('confirm_password', confirmPassword);

  return api.post('/user/reset-password/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getProfile = () => api.get('/user/me/');

export const updateProfile = (data: any) => api.post('/user/me/', data);

export const getAllProfiles = () => api.get('/user/all/');

export const getProfileDetail = (pk: number) => api.get(`/user/${pk}/`);

export const followUnfollow = (profilePk: number) => api.post('/user/follow/', { profile_pk: profilePk });

// Blog APIs
export const getHomePosts = () => api.get('/home/');

export const getFeedPosts = () => api.get('/feed/');

export const getUserPosts = (username: string) => api.get(`/post/user/${username}/`);

export const getPostDetail = (pk: number) => api.get(`/post/${pk}/`);

export const createPost = (formData: FormData) => {
  return api.post('/post/new/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const updatePost = (pk: number, title: string, content: string) => {
  const form = new FormData();
  form.append('title', title);
  form.append('content', content);
  return api.put(`/post/${pk}/update/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const deletePost = (pk: number) => api.delete(`/post/${pk}/delete/`);

export const likePost = (id: number) => {
  const form = new FormData();
  form.append('id', String(id));
  return api.post('/post/like/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const savePost = (id: number) => {
  const form = new FormData();
  form.append('id', String(id));
  return api.post('/post/save/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Comment APIs
export const createComment = (postId: number, body: string, replyId?: number) => {
  const form = new FormData();
  form.append('body', body);
  if (replyId) {
    form.append('comment_id', String(replyId));
  }
  return api.post(`/post/${postId}/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const likeComment = (id: number) => {
  const form = new FormData();
  form.append('id', String(id));
  return api.post('/post/comment/like/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const getLikedPosts = () => api.get('/liked-posts/');

export const getSavedPosts = () => api.get('/saved-posts/');

export const searchPosts = (query: string) => api.get('/search/', { params: { query } });

// Privacy Settings
export const updatePrivacySettings = (settings: {
  is_private?: boolean;
  show_online_status?: boolean;
  allow_messages_from?: 'everyone' | 'friends' | 'none';
  allow_friend_requests?: boolean;
}) => {
  return api.post('/user/privacy/', settings);
};

export const getPrivacySettings = () => api.get('/user/privacy/');

// Account Settings
export const changePassword = (oldPassword: string, newPassword: string) => {
  return api.post('/user/change-password/', {
    old_password: oldPassword,
    new_password: newPassword
  });
};

export const deleteAccount = (password: string) => {
  return api.post('/user/delete-account/', { password });
};

// Notification Settings
export const updateNotificationSettings = (settings: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  like_notifications?: boolean;
  comment_notifications?: boolean;
  follow_notifications?: boolean;
  message_notifications?: boolean;
}) => {
  return api.post('/user/notification-settings/', settings);
};

export const getNotificationSettings = () => api.get('/user/notification-settings/');

// Friend APIs
export const getFriendsList = (userId: number) => api.get(`/friend/list/${userId}`);

export const sendFriendRequest = (receiverUserId: number) => api.post('/friend/friend_request/', { receiver_user_id: receiverUserId });

export const getFriendRequests = (userId: number) => api.get(`/friend/friend_requests/${userId}/`);

export const acceptFriendRequest = (friendRequestId: number) => api.get(`/friend/friend_request_accept/${friendRequestId}/`);

export const declineFriendRequest = (friendRequestId: number) => api.get(`/friend/friend_request_decline/${friendRequestId}/`);

export const cancelFriendRequest = (receiverUserId: number) => api.post('/friend/friend_request_cancel/', { receiver_user_id: receiverUserId });

export const removeFriend = (receiverUserId: number) => api.post('/friend/friend_remove/', { receiver_user_id: receiverUserId });

// Chat APIs
export const getRooms = () => api.get('/chats/');

export const createRoom = (friendId: number) => api.post(`/chats/chat/${friendId}`);

export const getRoomMessages = (roomName: number, friendId: number) => api.get(`/chats/room/${roomName}-${friendId}`);

// Notification APIs
export const getNotifications = () => api.get('/notifications/');

// Video Call APIs
export const getToken = (vc_to: number) => api.get(`/vc/getToken/?vc_to=${vc_to}`);

export const validateVC = (vc_to: number) => api.get(`/vc/validateVC/?vc_to=${vc_to}`);

export const createMember = (name: string, vc_to: number) => api.post('/vc/createMember/', { name, vc_to });

export const getMember = (vc_to: number) => api.get(`/vc/getMember/?vc_to=${vc_to}`);

// Types
export interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface Profile {
  id: number;
  user: User;
  is_online: boolean;
  bio?: string;
  image?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  image?: string;
  date_posted: string;
  date_updated: string;
  author: User;
  likes_count: number;
  saves_count: number;
  liked?: boolean;
  saved?: boolean;
  comments_count?: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user: User;
  body: string;
  date_added: string;
  likes_count: number;
  reply_id?: number;
}

export interface Notification {
  id: number;
  sender: string;
  notification_type: number;
  text_preview: string;
  date: string;
}
