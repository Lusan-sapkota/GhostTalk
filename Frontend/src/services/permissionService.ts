import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { isPlatform } from '@ionic/react';

export type AppPermission = 'camera' | 'microphone' | 'storage' | 'notifications';

// Description of why each permission is needed
const permissionDescriptions: Record<AppPermission, string> = {
  camera: 'Access to your camera is needed for taking profile photos and scanning QR codes.',
  microphone: 'Microphone access is required for sending voice messages to your contacts.',
  storage: 'Storage access allows you to save photos and other media shared in chats.',
  notifications: 'Notification permission is needed to alert you of new messages and friend requests.'
};

// Check if running on Android
export const isAndroidApp = (): boolean => {
  return isPlatform('android') && Capacitor.isNativePlatform();
};

class PermissionService {
  // Check if initial permissions have been requested (for Android after onboarding)
  async hasRequestedInitialPermissions(): Promise<boolean> {
    if (!isAndroidApp()) return true; // Only relevant for Android app
    
    const { value } = await Preferences.get({ key: 'initialPermissionsRequested' });
    return value === 'true';
  }
  
  // Mark initial permissions as requested
  async setInitialPermissionsRequested(): Promise<void> {
    await Preferences.set({ key: 'initialPermissionsRequested', value: 'true' });
  }
  
  // Get permission description
  getPermissionDescription(permission: AppPermission): string {
    return permissionDescriptions[permission];
  }
  
  // Check permission status
  async checkPermission(permission: AppPermission): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // Web permission checks
      switch (permission) {
        case 'camera':
          return await this.checkWebCameraPermission();
        case 'microphone':
          return await this.checkWebMicrophonePermission();
        case 'notifications':
          return await this.checkWebNotificationPermission();
        case 'storage':
          return true; // Web storage doesn't need permission
        default:
          return false;
      }
    }
    
    // Native platform permission checks
    try {
      switch (permission) {
        case 'camera': {
          const cameraStatus = await Camera.checkPermissions();
          return cameraStatus.camera === 'granted';
        }
        case 'microphone': {
          const micStatus = await Camera.checkPermissions();
          return micStatus.microphone === 'granted';
        }
        case 'storage': {
          // Storage permissions are handled differently in newer Android versions
          return true; // Simplify for now
        }
        case 'notifications': {
          const notificationStatus = await PushNotifications.checkPermissions();
          return notificationStatus.receive === 'granted';
        }
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking ${permission} permission:`, error);
      return false;
    }
  }
  
  // Request a permission
  async requestPermission(permission: AppPermission): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // Web permission requests
      switch (permission) {
        case 'camera':
          return await this.requestWebCameraPermission();
        case 'microphone':
          return await this.requestWebMicrophonePermission();
        case 'notifications':
          return await this.requestWebNotificationPermission();
        case 'storage':
          return true; // Web storage doesn't need permission
        default:
          return false;
      }
    }
    
    // Native platform permission requests
    try {
      switch (permission) {
        case 'camera': {
          const cameraStatus = await Camera.requestPermissions();
          return cameraStatus.camera === 'granted';
        }
        case 'microphone': {
          // Camera plugin also handles microphone permissions
          const micStatus = await Camera.requestPermissions();
          return micStatus.microphone === 'granted';
        }
        case 'storage': {
          // Storage permissions are handled differently in newer Android versions
          return true; // Simplify for now
        }
        case 'notifications': {
          const notificationStatus = await PushNotifications.requestPermissions();
          return notificationStatus.receive === 'granted';
        }
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error);
      return false;
    }
  }
  
  // Request all initial permissions (called after onboarding on Android)
  async requestInitialPermissions(): Promise<Record<AppPermission, boolean>> {
    const results: Record<AppPermission, boolean> = {
      camera: false,
      microphone: false,
      storage: false,
      notifications: false
    };
    
    // Request each permission
    results.camera = await this.requestPermission('camera');
    results.microphone = await this.requestPermission('microphone');
    results.storage = await this.requestPermission('storage');
    results.notifications = await this.requestPermission('notifications');
    
    // Mark as requested
    await this.setInitialPermissionsRequested();
    
    return results;
  }
  
  // Web-specific permission checks
  private async checkWebCameraPermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permissionStatus.state === 'granted';
    } catch (error) {
      // If query not supported, we have to try access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }
  
  private async checkWebMicrophonePermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissionStatus.state === 'granted';
    } catch (error) {
      // If query not supported, we have to try access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }
  
  private async checkWebNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    return Notification.permission === 'granted';
  }
  
  // Web-specific permission requests
  private async requestWebCameraPermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }
  
  private async requestWebMicrophonePermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }
  
  private async requestWebNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

export const permissionService = new PermissionService();