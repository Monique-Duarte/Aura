import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonButton, IonText, IonSpinner, IonCheckbox, IonItem, IonLabel, IonNote, IonFooter, IonIcon } from '@ionic/react';
import { eye, eyeOff } from 'ionicons/icons';
import { Link, useHistory } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { authService } from '../api/auth.service';
import { app } from '../../../firebaseConfig';
import logo from '/logo.png';
import '../../../app/styles/variables.css';
import '../../../shared/styles/Login.css';
import { APP_VERSION } from '../../../constants';
import { useNotifier } from '../../../app/providers/NotificationContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const history = useHistory();
  const { showNotification } = useNotifier();
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    authService.initialize();
    
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        let errorMessage = 'Ocorreu um erro inesperado.';
        if (error instanceof FirebaseError) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'E-mail ou senha inválidos.';
            } else {
            errorMessage = 'Ocorreu um erro ao tentar fazer login.';
            }
        }
        showNotification({ message: errorMessage, color: 'danger' });
        console.error("Erro no login:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const user = await authService.signInWithGoogle();
      if (user) {
        history.push('/app/dashboard');
      } else {
        throw new Error('Usuário não foi retornado pelo serviço de login.');
      }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao entrar com o Google.';
        showNotification({ message: errorMessage, color: 'danger' });
        console.error("Erro no login com Google:", error);
    } finally {
      setLoadingGoogle(false);
    }
  };

return (
  <IonPage>
    <IonContent fullscreen={true}>
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
        <div className="password-input-container">
          <input
            className="aura-input-clean"
            type={showPassword ? 'text' : 'password'}
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Senha"
          />
          <IonIcon
            icon={showPassword ? eyeOff : eye}
            onClick={togglePasswordVisibility}
            className="password-toggle-icon"
          />
        </div>

          <IonItem lines="none" style={{ '--background': 'transparent', marginTop: '8px' }}>
            <IonLabel>Lembrar e-mail</IonLabel>
            <IonCheckbox
              slot="start"
              checked={rememberMe}
              onIonChange={e => setRememberMe(e.detail.checked)}
            />
          </IonItem> 
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

    <IonFooter className="ion-no-border">
      <div className="ion-text-center ion-padding-bottom">
        <IonNote color="medium">{APP_VERSION}</IonNote>
      </div>
    </IonFooter>
  </IonPage>
);
};

export default Login;