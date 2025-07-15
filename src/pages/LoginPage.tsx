import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLoading,
  IonToast,
  IonCheckbox,
} from '@ionic/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { useHistory } from 'react-router-dom';
import { FaEnvelope, FaLock } from 'react-icons/fa';

const LoginPage: React.FC = () => {
  console.log('Renderizando LoginPage');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [salvarSenha, setSalvarSenha] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.body.classList.contains('theme-dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('theme-dark'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const history = useHistory();

  const handleRegister = async () => {
    if (!email || !password) {
      setToastMessage('Preencha todos os campos para registrar.');
      setShowToast(true);
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setToastMessage('Usuário registrado com sucesso! Faça login.');
      setShowToast(true);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setToastMessage('Este e-mail já está em uso.');
      } else if (error.code === 'auth/weak-password') {
        setToastMessage('Senha muito fraca (mínimo 6 caracteres).');
      } else {
        setToastMessage(`Erro ao registrar: ${error.message}`);
      }
      setShowToast(true);
      console.error('Erro ao registrar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setToastMessage('Preencha todos os campos para entrar.');
      setShowToast(true);
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setToastMessage('Login realizado com sucesso!');
      setShowToast(true);
      setEmail('');
      setPassword('');
      history.replace('/home');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setToastMessage('E-mail ou senha incorretos.');
      } else {
        setToastMessage(`Erro ao fazer login: ${error.message}`);
      }
      setShowToast(true);
      console.error('Erro ao fazer login:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setToastMessage('Login com Google realizado com sucesso!');
      setShowToast(true);
      history.replace('/home');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setToastMessage('Login com Google cancelado.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setToastMessage('Requisição de pop-up cancelada.');
      } else {
        setToastMessage(`Erro ao fazer login com Google: ${error.message}`);
      }
      setShowToast(true);
      console.error('Erro ao fazer login com Google:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="login-toolbar">
          <IonTitle>Login / Registro</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="login-bg">
        <div className="login-container">
          <img src="/logo.png" alt="Logo Aura" className="aura-logo-full" />
          <div className="app-name">Aura</div>
          <form className="login-form" onSubmit={e => e.preventDefault()}>
            <div className="login-title login-title-left">Login</div>
            <div className="login-input-item">
              <FaEnvelope className="input-icon" />
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
                placeholder="Email"
                className="login-input"
              />
            </div>
            <div className="login-input-item">
              <FaLock className="input-icon" />
              <IonInput
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value!)}
                placeholder="Senha"
                className="login-input"
              />
            </div>
            <div className="login-options-row">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  className="login-checkbox"
                  checked={salvarSenha}
                  onChange={e => setSalvarSenha(e.target.checked)}
                />
                <span className="login-checkbox-label">Salvar senha</span>
              </label>
              <a href="#" className="login-forgot">Esqueceu a senha?</a>
            </div>
            <button type="button" onClick={handleLogin} className="login-btn-main" disabled={loading || !email || !password}>
              Entrar
            </button>
            <button type="button" onClick={handleRegister} className="login-btn-google-main" style={{background: 'transparent', color: 'var(--cor-primaria)', border: '1.5px solid var(--cor-primaria)', marginBottom: '18px', marginTop: '0'}} disabled={loading || !email || !password}>
              Criar conta
            </button>
            <div className="login-divider"></div>
            <div className="login-or">ou</div>
            <button type="button" onClick={handleGoogleLogin} className="login-btn-google-main" disabled={loading}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
              Login com Google
            </button>
          </form>
        </div>
        <IonLoading isOpen={loading} message={'Aguarde...'} duration={0} spinner="crescent" />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="dark"
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;