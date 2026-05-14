import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.starbaby.app',
  appName: '星小宝',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
