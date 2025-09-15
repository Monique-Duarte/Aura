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
import FamilyCategorySummaryList from './FamilyCategorySummaryList';
import { useAuth } from '../hooks/AuthContext';
import ActionButton from './ActionButton';
import '../styles/Dashboard.css';

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
    loading: partnershipLoading,
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

  // Deriva o UID do parceiro a partir da parceria ativa
  const partnerUid = useMemo(() => {
    if (!user || !activePartnership?.members) return null;
    return activePartnership.members.find((uid) => uid !== user.uid) || null;
  }, [user, activePartnership]);

  // CORREÇÃO PRINCIPAL: Busca os dados de cada usuário SEPARADAMENTE
  const { summary: userBalance, loading: userBalanceLoading } = useTransactionSummary(period, user ? [user.uid] : []);
  const { summary: partnerBalance, loading: partnerBalanceLoading } = useTransactionSummary(period, partnerUid ? [partnerUid] : []);
  
  const { summaryList: userCategoryList, loading: userCategoryLoading } = useCategorySummary(period, user ? [user.uid] : []);
  const { summaryList: partnerCategoryList, loading: partnerCategoryLoading } = useCategorySummary(period, partnerUid ? [partnerUid] : []);

  const loading = partnershipLoading || userBalanceLoading || partnerBalanceLoading || userCategoryLoading || partnerCategoryLoading;

  // Combina os dados de categoria dos dois usuários em uma única estrutura
  const combinedCategoryData = useMemo(() => {
    const categoryMap = new Map<string, { userAmount: number; partnerAmount: number; color: string }>();

    userCategoryList.forEach(item => {
      categoryMap.set(item.name, {
        userAmount: item.total,
        partnerAmount: 0,
        color: item.color,
      });
    });

    partnerCategoryList.forEach(item => {
      const existing = categoryMap.get(item.name) || { userAmount: 0, partnerAmount: 0, color: item.color };
      existing.partnerAmount = item.total;
      categoryMap.set(item.name, existing);
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      ...data,
      total: data.userAmount + data.partnerAmount,
    })).sort((a, b) => b.total - a.total);
  }, [userCategoryList, partnerCategoryList]);

  const handleSendInvite = async () => {
    setError('');
    setIsSending(true);
    try {
      await sendInvitation(inviteEmail);
      setInviteEmail('');
    } catch (e: unknown) {
      if (e instanceof Error) { setError(e.message); }
      else { setError("Ocorreu um erro desconhecido."); }
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="spinner-container"><IonSpinner /></div>;
  }

  // --- Cenário 1: Vínculo Ativo ---
  if (activePartnership) {
    const partnerName = activePartnership.partnerDisplayName || 'Parceiro(a)';

    const combinedBalanceSummary = {
      user1Income: userBalance.totalIncome,
      user1Expense: userBalance.totalExpense,
      user2Income: partnerBalance.totalIncome,
      user2Expense: partnerBalance.totalExpense,
    };
    
    const categoryChartData = {
      labels: combinedCategoryData.map(d => d.name),
      datasets: [{
        label: 'Gasto Total',
        data: combinedCategoryData.map(d => d.total),
        backgroundColor: combinedCategoryData.map(d => d.color),
      }],
      detailedData: combinedCategoryData,
    };

    return (
      <div key="linked">
        <div className="partnership-info-banner">
          <IonText><p>Exibindo dados combinados com <strong>{partnerName}</strong>.</p></IonText>
        </div>

        <h3 className="summary-list-title">Balanço Conjunto</h3>
        <FamilyBalanceChart
          summary={combinedBalanceSummary}
          user1Name={user?.displayName || 'Você'}
          user2Name={partnerName}
        />

        <div style={{ marginTop: '32px' }}>
          <h3 className="summary-list-title">Gastos por Categoria</h3>
          <FamilyCategoryChart
            data={categoryChartData}
            user1Name={user?.displayName || 'Você'}
            user2Name={partnerName}
          />
          <FamilyCategorySummaryList 
            summary={combinedCategoryData} 
            user1Name={user?.displayName || 'Você'}
            user2Name={partnerName}
          />
        </div>

        <ActionButton fill="clear" expand="block" color="danger" onClick={() => cancelOrDecline(activePartnership.id)} className="ion-margin-top">
          Cancelar Vínculo
        </ActionButton>
      </div>
    );
  }

  // --- Cenário 2: Convites Recebidos Pendentes ---
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
                  <ActionButton expand="block" color="primary" onClick={() => acceptInvitation(inv.id)}>Aceitar</ActionButton>
                  <ActionButton expand="block" fill="outline" color="danger" onClick={() => cancelOrDecline(inv.id)}>Recusar</ActionButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
      </div>
    );
  }

  // --- Cenário 3: Convite Enviado Pendente ---
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
                <ActionButton expand="block" fill="clear" color="danger" onClick={() => cancelOrDecline(sentInvitation.id)} className="ion-margin-top">
                    Cancelar Convite
                </ActionButton>
            </IonCardContent>
        </IonCard>
      </div>
    );
  }

  // --- Cenário 4: Sem Vínculo ---
  return (
    <div key="unlinked" className="form-field-group">
      <IonText><p className='text-family'>Compartilhe suas finanças com outro usuário para ver um resumo conjunto.</p></IonText>
      <IonItem>
        <IonLabel position="floating">E-mail do parceiro(a)</IonLabel>
        <IonInput type="email" value={inviteEmail} onIonChange={e => setInviteEmail(e.detail.value!)} disabled={isSending} />
      </IonItem>
      <ActionButton expand="block" color="primary" onClick={handleSendInvite} className="ion-margin-top" disabled={isSending}>
        {isSending ? <IonSpinner name="crescent" /> : 'Enviar Convite'}
      </ActionButton>
      {error && <IonText color="danger"><p className="ion-text-center ion-padding-top">{error}</p></IonText>}
    </div>
  );
};

export default FamilyChartManager;