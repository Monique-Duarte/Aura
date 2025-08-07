import React, { useState, useMemo } from 'react';
import {
  IonSpinner,
  IonInput,
  IonItem,
  IonText,
  IonLabel,
  IonList,
  IonListHeader,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';

import { usePartnership } from '../hooks/usePartnership';
import { useTransactionSummary } from '../hooks/useTransactionSummary';
import { useCategorySummary } from '../hooks/useCategorySummary';
import FamilyBalanceChart from './FamilyBalanceChart';
import FamilyCategoryChart from './FamilyCategoryChart';
import CategorySummaryList from './CategorySummaryList';
import { useAuth } from '../hooks/AuthContext';
import ActionButton from './ActionButton';
import '../styles/Dashboard.css'

interface Period {
  startDate: Date;
  endDate: Date;
}

interface FamilyChartManagerProps {
  period: Period | null;
}

const FamilyChartManager: React.FC<FamilyChartManagerProps> = ({ period }) => {
  const { user } = useAuth();
  const {
    loading,
    activePartnership,
    pendingInvitations,
    sentInvitation,
    sendInvitation,
    acceptInvitation,
    cancelOrDecline,
  } = usePartnership();

  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Define os IDs dos membros apenas se houver um vínculo ativo.
  const memberIds = useMemo(() => {
    if (activePartnership && user) {
      return activePartnership.members;
    }
    // Se não houver vínculo, os hooks de resumo usarão apenas o ID do usuário atual.
    return user ? [user.uid] : [];
  }, [activePartnership, user]);

  // Hooks para buscar os dados dos gráficos.
  const { summary: familyBalance, loading: balanceLoading } = useTransactionSummary(period, memberIds);
  const { chartData: familyCategoryChartData, summaryList: familyCategorySummaryList, loading: categoryLoading } = useCategorySummary(period, memberIds);

  const handleSendInvite = async () => {
    setError('');
    setIsSending(true);
    try {
      await sendInvitation(inviteEmail);
      setInviteEmail(''); // Limpa o campo após o envio
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
    } finally {
      setIsSending(false);
    }
  };

  // Renderiza um spinner enquanto o estado da parceria está sendo carregado.
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><IonSpinner /></div>;
  }

  // --- Cenário 1: Vínculo Ativo ---
  // Se existe uma parceria aceita, mostra os gráficos combinados.
  if (activePartnership) {
    return (
      <div key="linked">
        <IonText className="ion-text-center">
          <p>Exibindo dados combinados com <strong>{activePartnership.partnerDisplayName}</strong>.</p>
        </IonText>

        <h3 className="summary-list-title">Balanço Conjunto</h3>
        {balanceLoading ? <IonSpinner /> : (
          <FamilyBalanceChart
            summary={familyBalance}
            user1Name={user?.displayName || 'Você'}
            user2Name={activePartnership.partnerDisplayName || 'Parceiro(a)'}
          />
        )}

        <div style={{ marginTop: '32px' }}>
          {categoryLoading || !familyCategoryChartData ? <IonSpinner /> : (
            <>
              <FamilyCategoryChart
                data={familyCategoryChartData}
                user1Name={user?.displayName || 'Você'}
                user2Name={activePartnership.partnerDisplayName || 'Parceiro(a)'}
              />
              <CategorySummaryList summary={familyCategorySummaryList} />
            </>
          )}
        </div>

        <ActionButton fill="clear" color="danger" onClick={() => cancelOrDecline(activePartnership.id)} className="ion-margin-top">
          Cancelar Vínculo
        </ActionButton>
      </div>
    );
  }

  // --- Cenário 2: Convites Recebidos Pendentes ---
  // Se o usuário recebeu convites, mostra a lista para aceitar ou recusar.
  if (pendingInvitations.length > 0) {
    return (
      <div key="invitations" className="ion-text-center">
        <IonList>
          <IonListHeader>Convites Pendentes</IonListHeader>
          {pendingInvitations.map(inv => (
            <IonCard key={inv.id} style={{ margin: '16px 0' }}>
              <IonCardHeader>
                <IonCardTitle>Convite de</IonCardTitle>
                <IonText color="primary">
                  <h3>{inv.partnerDisplayName}</h3>
                </IonText>
                <IonText>
                  <p>{inv.partnerEmail}</p>
                </IonText>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center' }}>
                  <ActionButton onClick={() => acceptInvitation(inv.id)}>Aceitar</ActionButton>
                  <ActionButton fill="outline" color="danger" onClick={() => cancelOrDecline(inv.id)}>Recusar</ActionButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
      </div>
    );
  }

  // --- Cenário 3: Convite Enviado Pendente ---
  // Se o usuário enviou um convite, mostra um status de "aguardando".
  if (sentInvitation) {
    return (
      <div key="sent" className="ion-text-center">
        <IonCard>
            <IonCardHeader>
                <IonCardTitle color="primary">Convite Enviado</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <p>Você enviou um convite para</p>
                <IonText color="primary"><h3>{sentInvitation.partnerDisplayName}</h3></IonText>
                <p>Aguardando resposta.</p>
                <ActionButton fill="clear" color="danger" onClick={() => cancelOrDecline(sentInvitation.id)} className="ion-margin-top">
                    Cancelar Convite
                </ActionButton>
            </IonCardContent>
        </IonCard>
      </div>
    );
  }

  // --- Cenário 4: Sem Vínculo ---
  // Se nenhum dos cenários acima for verdadeiro, mostra o formulário para convidar.
  return (
    <div key="unlinked" className="form-field-group">
      <IonText><p className='text-family'>Compartilhe suas finanças com outro usuário para ver um resumo conjunto.</p></IonText>
      <IonItem>
        <IonLabel position="floating">E-mail do parceiro(a)</IonLabel>
        <IonInput type="email" value={inviteEmail} onIonChange={e => setInviteEmail(e.detail.value!)} disabled={isSending} />
      </IonItem>
      <ActionButton expand="block" onClick={handleSendInvite} className="ion-margin-top" disabled={isSending}>
        {isSending ? <IonSpinner name="crescent" /> : 'Enviar Convite'}
      </ActionButton>
      {error && <IonText color="danger"><p className="ion-text-center ion-padding-top">{error}</p></IonText>}
    </div>
  );
};

export default FamilyChartManager;