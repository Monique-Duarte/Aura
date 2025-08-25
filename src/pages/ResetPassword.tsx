import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonText, IonSpinner } from '@ionic/react';
import { Link } from 'react-router-dom';
import { authService } from '../service/auth.service';
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

    try {
      // Chama o método centralizado no serviço
      await authService.sendPasswordReset(email);
      setMensagem('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      // O erro já vem tratado e formatado do nosso serviço
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro('Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen={true} className="ion-padding" style={{ '--background': 'var(--aura-bg)', color: 'var(--ion-text-color)' }}>
        <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <h1 style={{ color: 'var(--ion-color-primary)', textAlign: 'center', marginBottom: 32 }}>Recuperar Senha</h1>
          <form onSubmit={handleReset}>
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
            {mensagem && <IonText color="success" style={{ display: 'block', marginTop: 16, textAlign: 'center' }}>{mensagem}</IonText>}
            {erro && <IonText color="danger" style={{ display: 'block', marginTop: 16, textAlign: 'center' }}>{erro}</IonText>}
            <IonButton expand="block" type="submit" className="aura-btn-main-clean" disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : 'Enviar link de recuperação'}
            </IonButton>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" style={{ color: 'var(--ion-color-primary)', textDecoration: 'none' }}>Voltar para login</Link>
            </div>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;