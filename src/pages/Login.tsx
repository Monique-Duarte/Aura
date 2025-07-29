import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonButton, IonText, IonSpinner, IonCheckbox, IonItem, IonLabel } from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import app from '../firebaseConfig';
import logo from '/logo.png';
import '../theme/variables.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, email, senha);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      history.push('/app/dashboard');
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          setErro('E-mail ou senha inválidos.');
        } else {
          setErro('Ocorreu um erro ao tentar fazer login.');
        }
      } else {
        setErro('Ocorreu um erro inesperado.');
      }
      console.error("Erro no login:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErro('');
    setLoadingGoogle(true);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      history.push('/app/dashboard');
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/popup-closed-by-user') {
        setErro('');
      } else {
        setErro('Erro ao entrar com o Google.');
      }
      console.error("Erro no login com Google:", error);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding aura-login-content">
        <div className="aura-login-center">
          <img src={logo} alt="Logo Aura" className="logo-aura" />
          <h1 className="aura-title">Bem-vindo ao Aura!</h1>
          <p className="aura-subtitle">Faça login para continuar</p>
          <form className="aura-form-clean" onSubmit={handleLogin} autoComplete="on">
            <input
              className="aura-input-clean"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="E-mail"
            />
            <input
              className="aura-input-clean"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Senha"
            />

            <IonItem lines="none" style={{ '--background': 'transparent', marginTop: '8px' }}>
              <IonLabel>Lembrar e-mail</IonLabel>
              <IonCheckbox
                slot="start"
                checked={rememberMe}
                onIonChange={e => setRememberMe(e.detail.checked)}
              />
            </IonItem>

            {erro && <IonText color="danger" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>{erro}</IonText>}
            <IonButton expand="block" type="submit" className="aura-btn-main-clean" disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : 'Entrar'}
            </IonButton>
          </form>
          <div className="aura-separator">
            <span>ou entre com</span>
          </div>
          <button type="button" className="aura-btn-google-clean" onClick={handleGoogleLogin} disabled={loadingGoogle}>
            {loadingGoogle ? (
              <IonSpinner name="crescent" color="dark" />
            ) : (
              <span><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{width: 22, verticalAlign: 'middle', marginRight: 8}} />Entrar com Google</span>
            )}
          </button>
          <div className="aura-links-clean">
            <Link to="/register" className="aura-link-clean">Criar conta</Link>
            <Link to="/reset-password" className="aura-link-clean">Esqueci minha senha</Link>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;