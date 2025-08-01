import React, { useState, useEffect, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonSpinner,
  IonActionSheet,
  IonToggle,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
} from '@ionic/react';
import { add, close, pencil, trash, walletOutline, checkmarkCircleOutline, swapHorizontalOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/AuthContext';
import { useDate } from '../hooks/DateContext';
import { useReserveHistory } from '../hooks/useReserveHistory';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    onSnapshot, 
    Timestamp, 
    doc, 
    updateDoc, 
    where,
    getDocs,
    writeBatch,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import app from '../firebaseConfig';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';
import InputAlert from '../components/InputAlert';
import ReserveChartContainer from '../components/ReserveChartContainer';
import '../theme/variables.css';

// --- Interfaces ---
interface ReserveGoal {
  id: string;
  name: string;
  yieldPercentage?: number;
  targetAmount?: number;
  balance: number; // Saldo calculado a partir de transações (sem rendimento)
}

interface ReserveTransaction {
  id: string;
  reserveId: string;
  type: 'reserve_add' | 'reserve_withdraw';
  amount: number;
  date: Timestamp;
}

const Reserva: React.FC = () => {
  const { user } = useAuth();
  const { currentPeriod } = useDate(); // Hook para obter o período global
  const [goals, setGoals] = useState<ReserveGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  
  // Estados dos modais e formulários
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [yieldPercentage, setYieldPercentage] = useState<number | undefined>();
  const [initialAmount, setInitialAmount] = useState<number | undefined>();
  const [targetAmount, setTargetAmount] = useState<number | undefined>();
  const [transactionAmount, setTransactionAmount] = useState<number | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [transactionMode, setTransactionMode] = useState<'add' | 'withdraw'>('add');
  const [goalCreationDate, setGoalCreationDate] = useState(new Date().toISOString());
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString());

  // Estados de controle
  const [editingGoal, setEditingGoal] = useState<ReserveGoal | null>(null);
  const [goalToAction, setGoalToAction] = useState<ReserveGoal | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAdjustBalanceAlert, setShowAdjustBalanceAlert] = useState(false);

  // Lógica de busca de dados
  const [rawGoals, setRawGoals] = useState<Omit<ReserveGoal, 'balance'>[]>([]);
  const [reserveTransactions, setReserveTransactions] = useState<ReserveTransaction[]>([]);
  
  // Hook que calcula o histórico e os rendimentos para o gráfico
  const { totalChartData, loading: historyLoading, lastDailyYield } = useReserveHistory(currentPeriod, rawGoals as ReserveGoal[]);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore(app);
    const goalsRef = collection(db, 'users', user.uid, 'reserves');
    const unsubscribe = onSnapshot(query(goalsRef), (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Omit<ReserveGoal, 'balance'>[];
      setRawGoals(goalsData);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore(app);
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, where('type', 'in', ['reserve_add', 'reserve_withdraw']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReserveTransaction[];
      setReserveTransactions(transactionsData);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const balances = new Map<string, number>();
    reserveTransactions.forEach(transaction => {
      const currentBalance = balances.get(transaction.reserveId) || 0;
      if (transaction.type === 'reserve_add') {
        balances.set(transaction.reserveId, currentBalance + transaction.amount);
      } else if (transaction.type === 'reserve_withdraw') {
        balances.set(transaction.reserveId, currentBalance - transaction.amount);
      }
    });

    const goalsWithBalances = rawGoals.map(goal => ({
      ...goal,
      balance: balances.get(goal.id) || 0,
    }));

    setGoals(goalsWithBalances.sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }, [rawGoals, reserveTransactions]);

  // Total depositado (soma simples das transações)
  const totalDeposited = useMemo(() => goals.reduce((sum, goal) => sum + goal.balance, 0), [goals]);

  // Saldo final com rendimentos (pega o último valor do gráfico)
  const finalBalanceWithYield = useMemo(() => {
    const data = totalChartData.datasets[0]?.data;
    if (data && data.length > 0) {
      return data[data.length - 1];
    }
    return totalDeposited; // Fallback para o saldo simples se o gráfico não carregou
  }, [totalChartData, totalDeposited]);

  // Funções de manipulação (handleSaveGoal, handleDeleteGoal, etc. sem alterações)
  const handleSaveGoal = async () => {
    if (!user || !goalName) return;
    const db = getFirestore(app);
    const dataToSave = { 
        name: goalName, 
        yieldPercentage: yieldPercentage || 0,
        targetAmount: targetAmount || 0,
    };

    try {
      if (editingGoal) {
        const docRef = doc(db, 'users', user.uid, 'reserves', editingGoal.id);
        await updateDoc(docRef, dataToSave);
      } else {
        const newGoalRef = await addDoc(collection(db, 'users', user.uid, 'reserves'), dataToSave);
        if (initialAmount && initialAmount > 0) {
          const initialTransaction = {
            description: `Depósito Inicial - ${goalName}`,
            amount: Math.abs(initialAmount),
            date: Timestamp.fromDate(new Date(goalCreationDate)),
            type: 'reserve_add',
            reserveId: newGoalRef.id,
            isRecurring: false,
          };
          await addDoc(collection(db, 'users', user.uid, 'transactions'), initialTransaction);
        }
      }
      closeGoalModal();
    } catch (error) {
      console.error("Erro ao salvar objetivo:", error);
    }
  };

  const handleEditGoalClick = () => {
    if (!goalToAction) return;
    setEditingGoal(goalToAction);
    setGoalName(goalToAction.name);
    setYieldPercentage(goalToAction.yieldPercentage);
    setTargetAmount(goalToAction.targetAmount);
    setShowGoalModal(true);
  };

  const handleDeleteGoalClick = () => {
    if (!goalToAction) return;
    setShowDeleteAlert(true);
  };

  const confirmDeleteGoal = async () => {
    if (!user || !goalToAction) return;
    const db = getFirestore(app);
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(transactionsRef, where('reserveId', '==', goalToAction.id));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        batch.delete(doc.ref);
      });
      const goalRef = doc(db, 'users', user.uid, 'reserves', goalToAction.id);
      batch.delete(goalRef);
      await batch.commit();
    } catch (error) {
      console.error("Erro ao excluir o objetivo e suas transações:", error);
    } finally {
      setShowDeleteAlert(false);
      setGoalToAction(null);
    }
  };

  const handleSaveTransaction = async () => {
    if (!user || !transactionAmount || !goalToAction) return;
    const db = getFirestore(app);
    const dataToSave = {
      description: `${transactionMode === 'add' ? 'Adicionar Valor' : 'Resgate'} - ${goalToAction.name}`,
      amount: Math.abs(transactionAmount),
      date: Timestamp.fromDate(new Date(transactionDate)),
      type: transactionMode === 'add' ? 'reserve_add' : 'reserve_withdraw',
      reserveId: goalToAction.id,
      isRecurring: transactionMode === 'add' ? isRecurring : false,
      ...(transactionMode === 'add' && isRecurring && { recurringDay: new Date(transactionDate).getDate() }),
    };
    await addDoc(collection(db, 'users', user.uid, 'transactions'), dataToSave);
    closeTransactionModal();
  };

  const handleAdjustBalanceClick = () => {
    if (!goalToAction) return;
    setShowAdjustBalanceAlert(true);
  };

  const confirmBalanceAdjustment = async (data: { newBalance: string }) => {
    if (!user || !goalToAction || data.newBalance === null) return;
    const newBalance = parseFloat(data.newBalance);
    const difference = newBalance - goalToAction.balance;

    if (isNaN(difference) || difference === 0) return;

    const db = getFirestore(app);
    const transactionType = difference > 0 ? 'reserve_add' : 'reserve_withdraw';
    const adjustmentTransaction = {
      description: `Ajuste de Saldo - ${goalToAction.name}`,
      amount: Math.abs(difference),
      date: Timestamp.fromDate(new Date()),
      type: transactionType,
      reserveId: goalToAction.id,
      isRecurring: false,
    };
    await addDoc(collection(db, 'users', user.uid, 'transactions'), adjustmentTransaction);
  };

  const openTransactionModal = (mode: 'add' | 'withdraw') => {
    setTransactionMode(mode);
    setShowTransactionModal(true);
  };

  const handleItemClick = (goal: ReserveGoal) => {
    setGoalToAction(goal);
    setShowActionSheet(true);
  };
  
  const closeGoalModal = () => {
    setShowGoalModal(false);
    setEditingGoal(null);
    setGoalName('');
    setYieldPercentage(undefined);
    setInitialAmount(undefined);
    setTargetAmount(undefined);
    setGoalCreationDate(new Date().toISOString());
  };

  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    setTransactionAmount(undefined);
    setIsRecurring(false);
    setTransactionDate(new Date().toISOString());
  };


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Reserva</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="summary-card">
          {viewMode === 'chart' ? (
            <>
              <IonText><p>Total com Rendimentos</p></IonText>
              <IonText color="success">
                <h2>{historyLoading ? <IonSpinner name="crescent" /> : finalBalanceWithYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
              </IonText>
              <IonText color="medium" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  <p>Rendimento do último dia: +{lastDailyYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              </IonText>
            </>
          ) : (
            <>
              <IonText><p>Total Depositado</p></IonText>
              <IonText color="success">
                <h2>{totalDeposited.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
              </IonText>
            </>
          )}
        </div>

        <div className="dashboard-chart-legend" style={{ justifyContent: 'center' }}>
            <button
                className={`dashboard-legend-btn${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
                type="button"
            >
                Lista
            </button>
            <button
                className={`dashboard-legend-btn${viewMode === 'chart' ? ' active' : ''}`}
                onClick={() => setViewMode('chart')}
                type="button"
            >
                Gráfico
            </button>
        </div>

        {(loading || (viewMode === 'chart' && historyLoading)) ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner /></div>
        ) : (
          <>
            {viewMode === 'list' && (
              <IonList>
                {goals.map(goal => (
                  <IonItem key={goal.id} lines="inset" button onClick={() => handleItemClick(goal)}>
                    <IonLabel>
                      <h2>{goal.name}</h2>
                      {goal.yieldPercentage ? <p>Rendimento: {goal.yieldPercentage}% ao mês</p> : <p>Sem rendimento</p>}
                    </IonLabel>
                    <IonText color="success" slot="end">
                      <p>{goal.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </IonText>
                  </IonItem>
                ))}
              </IonList>
            )}

            {viewMode === 'chart' && (
              <ReserveChartContainer goals={goals} />
            )}
          </>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <AppModal
          title={editingGoal ? 'Editar Objetivo' : 'Novo Objetivo'}
          isOpen={showGoalModal}
          onDidDismiss={closeGoalModal}
        >
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Nome do Objetivo</IonLabel>
              <IonInput value={goalName} onIonChange={e => setGoalName(e.detail.value!)} placeholder="Ex: Fundo de Emergência" />
            </IonItem>
          </div>
          {!editingGoal && (
            <>
              <div className="form-field-group">
                <IonItem>
                  <IonLabel position="floating">Valor Inicial (R$)</IonLabel>
                  <IonInput type="number" value={initialAmount} onIonChange={e => setInitialAmount(parseFloat(e.detail.value!))} placeholder="Opcional. Ex: 500,00" />
                </IonItem>
              </div>
              <div className="form-field-group">
                  <IonItem lines="none" className="date-item">
                      <IonLabel>Data do Depósito Inicial</IonLabel>
                      <IonDatetimeButton datetime="datetime-goal-modal"></IonDatetimeButton>
                  </IonItem>
              </div>
            </>
          )}
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Meta Final (R$)</IonLabel>
              <IonInput type="number" value={targetAmount} onIonChange={e => setTargetAmount(parseFloat(e.detail.value!))} placeholder="Opcional. Ex: 10000,00" />
            </IonItem>
          </div>
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Rendimento Mensal (%)</IonLabel>
              <IonInput type="number" value={yieldPercentage} onIonChange={e => setYieldPercentage(parseFloat(e.detail.value!))} placeholder="Opcional. Ex: 1.1" />
            </IonItem>
          </div>
          <ActionButton onClick={handleSaveGoal}>
            {editingGoal ? 'Salvar Alterações' : 'Criar Objetivo'}
          </ActionButton>
        </AppModal>

        <AppModal
          title={transactionMode === 'add' ? 'Adicionar Valor' : 'Resgatar Valor'}
          isOpen={showTransactionModal}
          onDidDismiss={closeTransactionModal}
        >
          <p className="ion-text-center">Movimentar para <strong>{goalToAction?.name}</strong></p>
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Valor (R$)</IonLabel>
              <IonInput type="number" value={transactionAmount} onIonChange={e => setTransactionAmount(parseFloat(e.detail.value!))} placeholder="100,00" />
            </IonItem>
          </div>
          <div className="form-field-group">
              <IonItem lines="none" className="date-item">
                  <IonLabel>Data da Transação</IonLabel>
                  <IonDatetimeButton datetime="datetime-transaction-modal"></IonDatetimeButton>
              </IonItem>
          </div>
          {transactionMode === 'add' && (
            <div className="form-field-group">
              <IonItem lines="none" className="toggle-item">
                <IonLabel>Adicionar todo mês?</IonLabel>
                <IonToggle checked={isRecurring} onIonChange={e => setIsRecurring(e.detail.checked)} />
              </IonItem>
            </div>
          )}
          <ActionButton onClick={handleSaveTransaction}>
            Confirmar
          </ActionButton>
        </AppModal>
        
        <IonModal keepContentsMounted={true}>
            <IonDatetime 
              id="datetime-goal-modal" 
              value={goalCreationDate} 
              onIonChange={e => { const value = e.detail.value; if (typeof value === 'string') { setGoalCreationDate(value); } }} 
              presentation="date" 
            />
        </IonModal>
        <IonModal keepContentsMounted={true}>
            <IonDatetime 
              id="datetime-transaction-modal" 
              value={transactionDate} 
              onIonChange={e => { const value = e.detail.value; if (typeof value === 'string') { setTransactionDate(value); } }} 
              presentation="date" 
            />
        </IonModal>

        <ActionAlert
            isOpen={showDeleteAlert}
            onDidDismiss={() => setShowDeleteAlert(false)}
            header={'Confirmar Exclusão'}
            message={'Tem certeza? Este objetivo e todas as suas transações serão apagados permanentemente.'}
            onConfirm={confirmDeleteGoal}
            confirmButtonText="Excluir"
        />
        
        <InputAlert
            isOpen={showAdjustBalanceAlert}
            onDidDismiss={() => setShowAdjustBalanceAlert(false)}
            header={'Ajustar Saldo'}
            message={`Qual o valor correto para "${goalToAction?.name}"?`}
            inputs={[{ name: 'newBalance', type: 'number', placeholder: 'Ex: 1550,75', value: goalToAction?.balance }]}
            onConfirm={(data: { newBalance: string }) => confirmBalanceAdjustment(data)}
        />
        
        <IonActionSheet
            isOpen={showActionSheet}
            onDidDismiss={() => setShowActionSheet(false)}
            header={goalToAction?.name}
            buttons={[
                { text: 'Adicionar Valor', cssClass: 'action-sheet-edit', icon: checkmarkCircleOutline, handler: () => openTransactionModal('add') },
                { text: 'Resgatar Dinheiro', cssClass: 'action-sheet-edit', icon: walletOutline, handler: () => openTransactionModal('withdraw') },
                { text: 'Ajustar Saldo', cssClass: 'action-sheet-edit', icon: swapHorizontalOutline, handler: handleAdjustBalanceClick },
                { text: 'Editar Objetivo', cssClass: 'action-sheet-edit', icon: pencil, handler: handleEditGoalClick },
                { text: 'Excluir Objetivo', role: 'destructive', icon: trash, handler: handleDeleteGoalClick },
                { text: 'Cancelar', icon: close, role: 'cancel' }
            ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Reserva;