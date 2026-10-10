import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.medall.app',
  appName: 'Med ALL',
  webDir: 'dist',
  server: {
    cleartext: false
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff'
  },
  android: {
    backgroundColor: '#ffffff'
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff'
    },
    Keyboard: {
      resize: 'native'
    },
    LocalNotifications: {
      iconColor: '#2F80ED'
    }
  }
};

export default config;
