import axios from 'axios';
import { apiService } from './api.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ProfileUpdateData {
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  proStatus?: string;
  // Add other fields that can be updated in the profile
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const userService = {
  async getProfile() {
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
      
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { 
        success: false, 
        message: 'Failed to fetch profile'
      };
    }
  },

  async updateProfile(data: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        return { success: false, message: 'Not authenticated' };
      }
      
      const response = await axios.put(`${API_URL}/user/profile`, data, {
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
      
      const response = await axios.get(`${API_URL}/user/qrcode/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      return { 
        success: true, 
        qrCodeUrl: URL.createObjectURL(response.data)
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return { 
        success: false, 
        message: 'Failed to generate QR code'
      };
    }
  }
};