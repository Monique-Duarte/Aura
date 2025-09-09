import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { 
  signInWithCredential, 
  GoogleAuthProvider, 
  User, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  linkWithPopup,
  linkWithCredential,
  AuthError,
  signInWithPopup,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  doc, 
  getDoc, 
  setDoc, 
  Timestamp, 
  getFirestore 
} from 'firebase/firestore';
import { auth, app } from '../firebaseConfig';
import { Capacitor } from '@capacitor/core';
import { FirebaseError } from 'firebase/app';

export class AuthService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      await GoogleAuth.initialize({
        clientId: '733656810098-4c4tcf7sq8eoa7qms0r296hjk1vgnm5d.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      this.initialized = true;
      console.log('Capacitor Google Auth inicializado com sucesso.');
    } catch (error) {
      console.error('Erro ao inicializar o Capacitor Google Auth:', error);
    }
  }

  /**
   * Detecção mais robusta da plataforma
   * Android Studio às vezes é detectado incorretamente como web
   */
  private isNativePlatform(): boolean {
    const platform = Capacitor.getPlatform();
    console.log('Plataforma detectada:', platform);
    
    // Considera nativo se for android, ios, ou se estiver no contexto do Capacitor
    // mesmo que seja detectado como web (caso do Android Studio)
    return platform === 'android' || 
           platform === 'ios' || 
           (platform === 'web' && (window as any).Capacitor);
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      const functions = getFunctions(app);
      const checkEmail = httpsCallable(functions, 'checkIfEmailExists');
      const result = await checkEmail({ email });
      const data = result.data as { exists: boolean };

      if (!data.exists) {
        throw new Error('E-mail não vinculado.');
      }
      
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      console.error("Erro no processo de recuperação de senha:", error);
      if (error instanceof Error && error.message === 'E-mail não vinculado.') {
        throw error;
      }
      throw new Error('Ocorreu um erro de comunicação. Tente novamente mais tarde.');
    }
  }
  
  async registerWithEmailAndPassword(name: string, email: string, pass: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName: name,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: Timestamp.fromDate(new Date()),
      });
      const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'preferences');
      await setDoc(settingsDocRef, {
        financialStartDay: 1,
      });
      return user;
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            throw new Error('Este endereço de e-mail já está cadastrado.');
          case 'auth/invalid-email':
            throw new Error('O formato do e-mail é inválido.');
          case 'auth/weak-password':
            throw new Error('A senha é muito fraca. Tente uma mais forte.');
          default:
            throw new Error('Erro ao criar conta. Verifique os dados e tente novamente.');
        }
      }
      throw new Error('Ocorreu um erro inesperado. Tente novamente.');
    }
  }

  async signInWithGoogle(): Promise<User | null> {
    try {
      let result;
      const isNative = this.isNativePlatform();
      console.log('Usando fluxo:', isNative ? 'Nativo (Capacitor)' : 'Web (Popup)');

      if (isNative) {
        // --- LÓGICA PARA ANDROID/IOS/ANDROID STUDIO (NATIVO) ---
        await this.initialize();
        const googleUser = await GoogleAuth.signIn();
        
        if (!googleUser?.authentication?.idToken) {
          throw new Error('Não foi possível obter o token de autenticação do Google.');
        }
        
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        result = await signInWithCredential(auth, credential);
      } else {
        // --- LÓGICA PARA NAVEGADOR PURO (WEB) ---
        const provider = new GoogleAuthProvider();
        result = await signInWithPopup(auth, provider);
      }

      const user = result.user;
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        console.log('Documento do usuário não encontrado no Firestore. Criando...');
        await setDoc(userDocRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: Timestamp.fromDate(new Date()),
        });
        const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'preferences');
        await setDoc(settingsDocRef, { financialStartDay: 1 });
        console.log('Documentos do novo usuário criados com sucesso.');
      }
      
      return user;
    } catch (error: unknown) {
      console.error('Erro completo durante o processo de login:', error);

      const isPopupClosedError = error && typeof error === 'object' && 'code' in error && (error as {code: string}).code === 'auth/popup-closed-by-user';
      
      if (error instanceof Error && (error.message.includes('12501') || isPopupClosedError)) {
          throw new Error('Login cancelado pelo usuário.');
      }
      if (error instanceof Error && error.message.includes('DEVELOPER_ERROR')) {
          throw new Error('Erro de configuração do Google Sign-In.');
      }
      
      throw new Error('Ocorreu um erro inesperado durante o login.');
    }
  }

  async linkGoogleAccount(): Promise<{ success: boolean; error?: string }> {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Nenhum usuário logado para vincular.' };
    }
    try {
      if (this.isNativePlatform()) {
        await this.initialize();
        const googleUser = await GoogleAuth.signIn();
        if (!googleUser?.authentication?.idToken) {
          throw new Error('Não foi possível obter o token de autenticação do Google.');
        }
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        await linkWithCredential(user, credential);
      } else {
        const provider = new GoogleAuthProvider();
        await linkWithPopup(user, provider);
      }
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/credential-already-in-use') {
        return { success: false, error: 'Esta conta do Google já está associada a outro usuário.' };
      }
      if (authError.message.includes('12501')) {
        return { success: false, error: 'Vinculação cancelada pelo usuário.' };
      }
      return { success: false, error: 'Ocorreu um erro ao tentar vincular a conta.' };
    }
  }

  async signOut() {
    try {
      await auth.signOut();
      if (this.isNativePlatform()) {
        await GoogleAuth.signOut();
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}

export const authService = new AuthService();