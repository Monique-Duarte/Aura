import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonText, IonSpinner } from '@ionic/react';
import { Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import app from '../firebaseConfig';
import '../theme/variables.css';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setLoading(true);
    const auth = getAuth(app);
    try {
      await sendPasswordResetEmail(auth, email);
      setMensagem('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      setErro('Erro ao enviar e-mail. Verifique o endereço e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': 'var(--aura-bg)', color: 'var(--ion-text-color)' }}>
        <form onSubmit={handleReset} style={{ maxWidth: 400, margin: '0 auto', marginTop: 60 }}>
          <h1 style={{ color: 'var(--ion-color-primary)', textAlign: 'center', marginBottom: 32 }}>Recuperar Senha</h1>
          <input
            className="aura-input-clean"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="E-mail"
          />
          {mensagem && <IonText color="success" style={{ display: 'block', marginTop: 16, textAlign: 'center' }}>{mensagem}</IonText>}
          {erro && <IonText color="danger" style={{ display: 'block', marginTop: 16, textAlign: 'center' }}>{erro}</IonText>}
          <IonButton expand="block" type="submit" className="aura-btn-main-clean" disabled={loading}>
            {loading ? <IonSpinner name="crescent" /> : 'Enviar link de recuperação'}
          </IonButton>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/login" style={{ color: 'var(--ion-color-primary)', textDecoration: 'underline' }}>Voltar para login</Link>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
