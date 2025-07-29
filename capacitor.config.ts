import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'aura',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'DEFAULT', // Pode ser 'DARK' ou 'LIGHT' dependendo do seu tema
      overlaysWebView: true,
    },
  },
};

export default config;