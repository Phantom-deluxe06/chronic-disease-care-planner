import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthbuddy.app',
  appName: 'Health Buddy',
  webDir: 'build',
  android: {
    allowMixedContent: true
  }
};

export default config;

