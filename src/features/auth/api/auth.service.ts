import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { app } from '../../../firebaseConfig';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const auth = getAuth(app);
const db = getFirestore(app);

const createUserDocumentFromUser = async (user: FirebaseUser) => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    const { displayName, email } = user;
    await setDoc(userRef, { displayName, email });
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    createUserDocumentFromUser(user);
  }
});

export const authService = {
  initialize: () => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: '733656810098-4c4tcf7sq8eoa7qms0r296hjk1vgnm5d.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    }
  },

  login: async (email: string, password: string): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  signInWithGoogle: async (): Promise<FirebaseUser> => {
    if (Capacitor.isNativePlatform()) {
      // Etapa 1: Obter o token do Google via plugin do Capacitor
      const googleUser = await GoogleAuth.signIn();
      if (!googleUser.authentication?.idToken) {
        throw new Error("Não foi possível obter o idToken do Google.");
      }
      
      // Etapa 2: Usar o idToken para criar uma credencial do Firebase
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      
      // Etapa 3: Fazer login no Firebase com a credencial
      const userCredential = await signInWithCredential(auth, credential);
      
      return userCredential.user;
    } else {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    }
  },

  register: async (email: string, password: string): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  logout: async () => {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    return signOut(auth);
  },

  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
  
  sendPasswordResetEmail: (email: string) => {
    return sendPasswordResetEmail(auth, email);
  },
};