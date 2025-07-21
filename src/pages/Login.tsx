import React, { useState } from 'react';
import { IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner } from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import app from '../firebaseConfig';
import logo from '/logo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      history.push('/dashboard');
    } catch (error: any) {
      setErro('E-mail ou senha inválidos.');
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
      history.push('/dashboard');
    } catch (error: any) {
      setErro('Erro ao entrar com o Google.');
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