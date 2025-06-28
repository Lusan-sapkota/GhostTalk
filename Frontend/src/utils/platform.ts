import { isPlatform } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

export const isAndroidApp = (): boolean => {
  // Returns true only if running on Android as a native app
  return isPlatform('android') && Capacitor.isNativePlatform();
};

export const isAndroidOrDev = (): boolean => {
  // Returns true if Android app or local development
  return isAndroidApp() || window.location.hostname === '192.168.18.2';
};