import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.controle.aura', 
  appName: 'Aura',
  webDir: 'dist',

  server: {
    androidScheme: 'https',
    // hostname: '192.168.0.10', // 📱 Descomente e coloque o IP da sua máquina para testar em um celular real na mesma rede.
  },

  android: {
    backgroundColor: '#ffffff',
  },
  ios: {
    backgroundColor: '#ffffff',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      overlaysWebView: false,
      backgroundColor: '#00000000',
    },
    Keyboard: {
      resize: 'body',
      style: 'light',
    },
  },
};

export default config;