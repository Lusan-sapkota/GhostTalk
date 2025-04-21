import axios from 'axios';
import { apiService } from './api.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.18.2:5000/api';

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  bio?: string;
  gender?: string;
  proStatus?: string;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  user?: any;
}

interface Avatar {
  id: string;
  name: string;
  url: string;
}

export const userService = {
  async getProfile(): Promise<ProfileResponse> {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Profile data from backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { 
        success: false, 
        message: 'Failed to fetch profile'
      };
    }
  },

  // Only allow bio updates
  async updateProfile(data: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'Not authenticated' };
      }
      
      // Only send bio in the update (backend restriction)
      const updateData = {
        bio: data.bio
      };
      
      const response = await axios.put(`${API_URL}/user/profile`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return { 
        success: false, 
        message: 'Failed to update profile'
      };
    }
  },
  
  async updateOnlineStatus(isOnline: boolean): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const response = await axios.put(`${API_URL}/user/online-status`, 
        { isOnline }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating online status:', error);
      return { 
        success: false, 
        message: 'Failed to update online status'
      };
    }
  },
  
  async generateQRCode(userId: string): Promise<{ success: boolean; message?: string; qrCodeUrl?: string }> {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'Not authenticated' };
      }
      
      console.log(`Generating QR code for user ID: ${userId}`);
      
      const response = await axios.get(`${API_URL}/user/qrcode/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      console.log('QR response received:', response.status);
      
      if (response.status === 200) {
        const blobUrl = URL.createObjectURL(response.data);
        console.log('Generated blob URL:', blobUrl);
        return { 
          success: true, 
          qrCodeUrl: blobUrl 
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to generate QR code: Server returned non-200 status'
        };
      }
    } catch (error: unknown) {
      console.error('Error generating QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        message: 'Failed to generate QR code: ' + errorMessage
      };
    }
  },

  // Get available avatars from the bucket
  async getAvailableAvatars(): Promise<{ success: boolean; avatars?: Avatar[]; message?: string }> {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'Not authenticated' };
      }
      
      console.log('Requesting avatars from backend...');
      
      // Request all avatars with a high limit parameter
      const response = await axios.get(`${API_URL}/user/avatars?limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const avatarCount = response.data.avatars?.length || 0;
      console.log(`Retrieved ${avatarCount} avatars from backend`);
      
      if (avatarCount === 0) {
        console.warn('No avatars returned from backend');
      } else {
        // Log a sample of the first avatar
        console.log('Sample avatar:', response.data.avatars[0]);
      }
      
      return {
        success: true,
        avatars: response.data.avatars || []
      };
    } catch (error) {
      console.error('Error fetching avatars:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
      }
      return {
        success: false,
        message: 'Failed to fetch available avatars'
      };
    }
  },

  // Select an avatar from the bucket
  async selectAvatar(avatarId: string): Promise<{ success: boolean; message?: string; avatar?: string }> {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'Not authenticated' };
      }
      
      console.log(`Selecting avatar: ${avatarId}`);
      
      const response = await axios.put(`${API_URL}/user/avatar/select`, 
        { avatarId }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error selecting avatar:', error);
      
      // Provide more specific error message based on the error type
      let errorMessage = 'Failed to select avatar';
      
      if (axios.isAxiosError(error) && error.response) {
        // Extract the error message from Appwrite response if available
        const data = error.response.data;
        if (data && data.message) {
          errorMessage = `Server error: ${data.message}`;
        } else {
          errorMessage = `Server error (${error.response.status})`;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  },

  async uploadAvatar(formData: FormData): Promise<{ success: boolean; message?: string; avatar?: string }> {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const response = await axios.post(`${API_URL}/user/avatar`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { 
        success: false, 
        message: 'Failed to upload avatar'
      };
    }
  }
};