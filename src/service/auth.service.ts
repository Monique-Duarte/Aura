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
} from 'firebase/auth';
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

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('E-mail de recuperação enviado para:', email);
    } catch (error) {
      console.error("Falha ao enviar e-mail de recuperação:", error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
            throw new Error('Nenhuma conta encontrada com este e-mail.');
          case 'auth/invalid-email':
            throw new Error('O formato do e-mail é inválido.');
          default:
            throw new Error('Erro ao enviar e-mail. Verifique o endereço e tente novamente.');
        }
      }
      throw new Error('Ocorreu um erro inesperado. Tente novamente.');
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
      
      console.log('Usuário registrado e documentos criados com sucesso.');
      return user;

    } catch (error) {
      console.error("Falha no registro (serviço):", error);
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
      await this.initialize();
      const googleUser = await GoogleAuth.signIn();

      if (!googleUser?.authentication?.idToken) {
        throw new Error('Não foi possível obter o token de autenticação do Google.');
      }
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const result = await signInWithCredential(auth, credential);
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
        await setDoc(settingsDocRef, {
          financialStartDay: 1,
        });
        console.log('Documentos do novo usuário criados com sucesso.');
      }
      
      return result.user;
    } catch (error) {
      console.error('Erro completo durante o processo de login:', error);
      if (error instanceof Error) {
        if (error.message.includes('12501')) {
          throw new Error('Login cancelado pelo usuário.');
        }
        if (error.message.includes('DEVELOPER_ERROR')) {
            throw new Error('Erro de configuração. Verifique o clientId, SHA-1 e o nome do pacote.');
        }
      }
      throw new Error('Ocorreu um erro inesperado durante o login.');
    }
  }

/**
   * Vincula a conta do Google ao usuário logado, usando o fluxo nativo no mobile
   * e o popup na web.
   */
  async linkGoogleAccount(): Promise<{ success: boolean; error?: string }> {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Nenhum usuário logado para vincular.' };
    }

    try {
      if (Capacitor.isNativePlatform()) {
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
      console.error("Erro ao vincular a conta do Google:", authError.code, authError.message);
      
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
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}

export const authService = new AuthService();