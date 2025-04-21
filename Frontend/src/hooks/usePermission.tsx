import { useState, useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Define plugin interface
interface PermissionManagerPlugin {
  checkPermissions(): Promise<{ permissions: { 
    camera: string; 
    microphone: string;
    notifications?: string;
    storage?: string;
  } }>;
  requestCameraPermission(): Promise<void>;
  requestMicrophonePermission(): Promise<void>;
  requestNotificationPermission(): Promise<void>;
  requestStoragePermission(): Promise<void>;
}

// Register the custom plugin
const PermissionManager = registerPlugin<PermissionManagerPlugin>('PermissionManager');

export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  notifications?: boolean;
  storage?: boolean;
}

export const usePermission = () => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    microphone: false,
    notifications: false,
    storage: false
  });
  const [loading, setLoading] = useState(true);

  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Browser environment - assume permissions granted
      setPermissions({ camera: true, microphone: true, notifications: true, storage: true });
      setLoading(false);
      return;
    }

    try {
      // Use our custom plugin to check permissions
      const result = await PermissionManager.checkPermissions();
      
      setPermissions({
        camera: result.permissions.camera === 'granted',
        microphone: result.permissions.microphone === 'granted',
        notifications: result.permissions.notifications === 'granted',
        storage: result.permissions.storage === 'granted'
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    setLoading(true);
    try {
      // Request camera permission using our custom plugin
      await PermissionManager.requestCameraPermission();
      
      // Request microphone permission using our custom plugin
      await PermissionManager.requestMicrophonePermission();
      
      // Request notification permission using our custom plugin
      await PermissionManager.requestNotificationPermission();
      
      // Request storage permission using our custom plugin
      await PermissionManager.requestStoragePermission();
      
      // Check updated status
      await checkPermissions();
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissions,
    loading,
    checkPermissions,
    requestPermissions
  };
};