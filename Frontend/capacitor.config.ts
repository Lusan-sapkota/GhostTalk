import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'GhostTalk',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'ionic',
    cleartext: true,
    hostname: undefined,
    // For development, specify the correct port
    // Comment this out for production builds
    url: 'http://192.168.18.2:8100'
  },
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
    initialFocus: false,
    useLegacyBridge: false
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#6736e9',
      overlaysWebView: false
    },
    plugins: {
      PushNotifications: {
        presentationOptions: ["badge", "sound", "alert"]
      },
      BarcodeScanner: {
        cameraDirection: 'back',
        // These are necessary for iOS permissions
        NSCameraUsageDescription: 'To scan QR codes for finding other users'
      }
    }
  }
};

export default config;
