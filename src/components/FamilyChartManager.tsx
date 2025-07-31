import React, { useState, useMemo } from 'react'; // 1. Importar useMemo
import { IonSpinner, IonInput, IonItem, IonButton, IonText, IonLabel } from '@ionic/react';
import { usePartnership } from '../hooks/usePartnership';
import { useTransactionSummary } from '../hooks/useTransactionSummary';
import { useCategorySummary } from '../hooks/useCategorySummary';
import FamilyBalanceChart from './FamilyBalanceChart';
import FamilyCategoryChart from './FamilyCategoryChart';
import CategorySummaryList from './CategorySummaryList';
import { useAuth } from '../hooks/AuthContext';

interface Period {
  startDate: Date;
  endDate: Date;
}

interface FamilyChartManagerProps {
  period: Period | null;
}

const FamilyChartManager: React.FC<FamilyChartManagerProps> = ({ period }) => {
  const { user } = useAuth();
  const { partnership, status, loading, sendInvite, acceptInvite, cancelPartnership } = usePartnership();
  const memberIds = useMemo(() => partnership?.members || [], [partnership]);
  const { summary: familyBalance, loading: balanceLoading } = useTransactionSummary(period, memberIds);
  const { chartData: familyCategoryChartData, summaryList: familyCategorySummaryList, loading: categoryLoading } = useCategorySummary(period, memberIds);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleSendInvite = async () => {
    setError('');
    try {
      await sendInvite(inviteEmail);
    } catch (e: unknown) {
      if (e instanceof Error) { setError(e.message); } 
      else { setError("Ocorreu um erro desconhecido."); }
    }
  };

  const handleAcceptInvite = async () => {
    setError('');
    try {
      await acceptInvite(inviteCode);
    } catch (e: unknown) {
      if (e instanceof Error) { setError(e.message); }
      else { setError("Ocorreu um erro desconhecido."); }
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><IonSpinner /></div>;
  }

  // UI para quando o utilizador NÃO está vinculado
  if (status === 'unlinked') {
    return (
      <div key="unlinked" className="form-field-group">
        <IonText><p>Partilhe os seus dados com outro utilizador para ver um resumo conjunto.</p></IonText>
        <IonItem>
          <IonLabel position="floating">E-mail do parceiro(a)</IonLabel>
          <IonInput type="email" value={inviteEmail} onIonChange={e => setInviteEmail(e.detail.value!)} />
        </IonItem>
        <IonButton expand="block" onClick={handleSendInvite} className="ion-margin-top">Enviar Convite</IonButton>
        {error && <IonText color="danger"><p className="ion-text-center">{error}</p></IonText>}
      </div>
    );
  }

  // UI para quando o utilizador enviou um convite e está a aguardar
  if (status === 'pending_sent') {
    return (
      <div key="pending_sent" className="form-field-group ion-text-center">
        <IonText>
          <p>Convite enviado para <strong>{partnership?.partnerEmail}</strong>.</p>
          <p>Peça para ele(a) verificar o código no app e insira-o abaixo.</p>
        </IonText>
        <IonItem>
          <IonLabel position="floating">Código de Confirmação</IonLabel>
          <IonInput value={inviteCode} onIonChange={e => setInviteCode(e.detail.value!)} />
        </IonItem>
        <IonButton expand="block" onClick={handleAcceptInvite} className="ion-margin-top">Confirmar Vínculo</IonButton>
        <IonButton expand="block" fill="clear" color="danger" onClick={cancelPartnership}>Cancelar Convite</IonButton>
        {error && <IonText color="danger"><p>{error}</p></IonText>}
      </div>
    );
  }

  // UI para quando o utilizador recebeu um convite
  if (status === 'pending_received') {
    return (
      <div key="pending_received" className="ion-text-center">
        <IonText>
          <p>Você recebeu um convite de <strong>{partnership?.partnerEmail}</strong>.</p>
          <p>O seu código de confirmação é:</p>
          <h2 className="invite-code">{partnership?.inviteCode}</h2>
          <p>Informe este código para que ele(a) possa confirmar o vínculo.</p>
        </IonText>
        <IonButton expand="block" fill="clear" color="danger" onClick={cancelPartnership}>Recusar Convite</IonButton>
      </div>
    );
  }

  // UI para quando os utilizadores estão vinculados
  if (status === 'linked') {
    return (
      <div key="linked">
        <IonText className="ion-text-center">
          <p>A exibir dados combinados com <strong>{partnership?.partnerDisplayName}</strong>.</p>
        </IonText>
        
        <h3 className="summary-list-title">Balanço Conjunto</h3>
        {balanceLoading ? <IonSpinner /> : (
          <FamilyBalanceChart 
            summary={familyBalance}
            user1Name={user?.displayName || 'Você'}
            user2Name={partnership?.partnerDisplayName || 'Parceiro(a)'}
          />
        )}

        <div style={{marginTop: '32px'}}>
            {categoryLoading || !familyCategoryChartData ? <IonSpinner /> : (
                <>
                    <FamilyCategoryChart 
                        data={familyCategoryChartData}
                        user1Name={user?.displayName || 'Você'}
                        user2Name={partnership?.partnerDisplayName || 'Parceiro(a)'}
                    />
                    <CategorySummaryList summary={familyCategorySummaryList} />
                </>
            )}
        </div>

        <IonButton expand="block" fill="clear" color="danger" onClick={cancelPartnership} className="ion-margin-top">Cancelar Vínculo</IonButton>
      </div>
    );
  }

  return null;
};

export default FamilyChartManager;