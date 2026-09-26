import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.89a5c0ffa25e4201b8e856f5f02a2027',
  appName: 'Med1 — Bemor',
  webDir: 'dist',
  server: {
    url: 'https://89a5c0ff-a25e-4201-b8e8-56f5f02a2027.lovableproject.com?forceHideBadge=true',
    cleartext: true
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
    }
  }
};

export default config;
