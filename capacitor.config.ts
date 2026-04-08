import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restocost.app',
  appName: 'RestoCost',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
