import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonText, IonSpinner } from '@ionic/react';
import { Link, useHistory } from 'react-router-dom';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
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
    const db = getFirestore(app);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      await updateProfile(user, { displayName: nome });
      const userDocRef = doc(db, 'users', user.uid);

      await setDoc(userDocRef, {
        displayName: nome,
        email: user.email,
        createdAt: Timestamp.fromDate(new Date()),
      });

      const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'preferences');
      await setDoc(settingsDocRef, {
        financialStartDay: 1,
      });

      history.push('/app/dashboard');

    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setErro('Este endereço de e-mail já está cadastrado.');
            break;
          case 'auth/invalid-email':
            setErro('O formato do e-mail é inválido.');
            break;
          case 'auth/weak-password':
            setErro('A senha é muito fraca. Tente uma mais forte.');
            break;
          default:
            setErro('Erro ao criar conta. Verifique os dados e tente novamente.');
            break;
        }
      } else {
        setErro('Ocorreu um erro inesperado. Tente novamente.');
      }
      console.error("Falha no registro:", error);
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