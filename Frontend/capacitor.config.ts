import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'GhostTalk',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true
  }
};

export default config;
