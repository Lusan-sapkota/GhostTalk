import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'GhostTalk',
  webDir: 'dist',
  server: {
    androidScheme: 'file',
    iosScheme: 'ionic',
    cleartext: true,
    // This is key - don't use localhost
    hostname: null
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
    }
  }
};

export default config;
