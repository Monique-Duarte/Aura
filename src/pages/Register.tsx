import React, { useState } from 'react';
import { IonPage, IonContent, IonInput, IonButton, IonText, IonSpinner } from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import app from '../firebaseConfig';

const Register: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const auth = getAuth(app);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nome });
      }
      history.push('/dashboard');
    } catch (error: any) {
      setErro('Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': 'var(--aura-bg)', color: 'var(--ion-text-color)' }}>
        <form onSubmit={handleRegister} style={{ maxWidth: 400, margin: '0 auto', marginTop: 60 }}>
          <h1 style={{ color: 'var(--ion-color-primary)', textAlign: 'center', marginBottom: 32 }}>Criar Conta</h1>
          <div className="aura-input-wrapper">
            <input
              className="aura-input-clean"
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              autoComplete="name"
              placeholder="Nome"
            />
          </div>
          <div className="aura-input-wrapper">
            <input
              className="aura-input-clean"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="E-mail"
            />
          </div>
          <div className="aura-input-wrapper">
            <input
              className="aura-input-clean"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Senha"
            />
          </div>
          <div className="aura-input-wrapper">
            <input
              className="aura-input-clean"
              type="password"
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Confirmar Senha"
            />
          </div>
          {erro && <IonText color="danger" style={{ display: 'block', marginTop: 16, textAlign: 'center' }}>{erro}</IonText>}
          <IonButton expand="block" type="submit" className="aura-btn-main-clean" disabled={loading}>
            {loading ? <IonSpinner name="crescent" /> : 'Cadastrar'}
          </IonButton>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/login" style={{ color: 'var(--ion-color-primary)', textDecoration: 'underline' }}>Já tem conta? Entrar</Link>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Register;
