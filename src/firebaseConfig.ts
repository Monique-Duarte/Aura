import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyASSf-rv4n52_v_DNzKkMssaQfJFJm88Iw",
  authDomain: "aura-e6045.firebaseapp.com",
  projectId: "aura-e6045",
  storageBucket: "aura-e6045.appspot.com",
  messagingSenderId: "733656810098",
  appId: "1:733656810098:web:c012bac374f17f4a3f78eb",
  measurementId: "G-GCBGM4ZYPV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Se estiver no mobile (Android/iOS), usar redirect
    if (Capacitor.isNativePlatform()) {
      // No mobile, usamos redirect ao invés de popup
      await signInWithRedirect(auth, provider);
      // O resultado será capturado pelo getRedirectResult no componente
      return null;
    } else {
      // Na web, continuar usando popup
      const result = await signInWithPopup(auth, provider);
      return result;
    }
    
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
};

export default app;