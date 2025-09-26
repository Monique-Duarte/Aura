import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  IonFab, IonFabButton, IonIcon, IonInput, IonItem, IonLabel, IonList,
  IonText, IonSpinner, IonActionSheet, IonToggle, IonDatetime,
  IonDatetimeButton, IonModal,
} from '@ionic/react';
import { add, close, pencil, trash, walletOutline, checkmarkCircleOutline, swapHorizontalOutline } from 'ionicons/icons';
import { useAuth } from '../../../app/providers/AuthContext';
import { 
    getFirestore, collection, addDoc, query, onSnapshot, Timestamp, 
    doc, updateDoc, where, getDocs, writeBatch, QueryDocumentSnapshot, DocumentData
} from 'firebase/firestore';
import { app }  from '../../../firebaseConfig';
import AppModal from '../../../shared/components/AppModal';
import ActionButton from '../../../shared/components/ActionButton';
import ActionAlert from '../../../shared/components/ActionAlert';
import InputAlert from '../../../shared/components/InputAlert';
import ReserveChartContainer from '../components/ReserveChartContainer';
import PageLayout from '../../../shared/components/PageLayout';
import { useDate } from '../../../app/providers/DateContext';
import { useReserveHistory } from '../hooks/useReserveHistory';

// --- Interfaces ---
interface ReserveGoal {
  id: string;
  name: string;
  yieldPercentage?: number;
  targetAmount?: number;
  balance: number;
}

interface ReserveTransaction {
  id: string;
  reserveId: string;
  type: 'reserve_add' | 'reserve_withdraw';
  amount: number;
  date: Timestamp;
}

const Reserva: React.FC = () => {
  const [goalName, setGoalName] = useState('');
  const [yieldPercentage, setYieldPercentage] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');

  const yieldInputRef = useRef<HTMLIonInputElement>(null);
  const targetAmountInputRef = useRef<HTMLIonInputElement>(null);
  const initialAmountInputRef = useRef<HTMLIonInputElement>(null);

  // Referências para os modais de calendário
  const goalModalRef = useRef<HTMLIonModalElement>(null);
  const transactionModalRef = useRef<HTMLIonModalElement>(null);
  
  const { user } = useAuth();
  const { currentPeriod } = useDate();
  const [goals, setGoals] = useState<ReserveGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [transactionMode, setTransactionMode] = useState<'add' | 'withdraw'>('add');
  const [goalCreationDate, setGoalCreationDate] = useState(new Date().toISOString());
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString());
  const [editingGoal, setEditingGoal] = useState<ReserveGoal | null>(null);
  const [goalToAction, setGoalToAction] = useState<ReserveGoal | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAdjustBalanceAlert, setShowAdjustBalanceAlert] = useState(false);
  const [rawGoals, setRawGoals] = useState<Omit<ReserveGoal, 'balance'>[]>([]);
  const [reserveTransactions, setReserveTransactions] = useState<ReserveTransaction[]>([]);
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

  const totalDeposited = useMemo(() => goals.reduce((sum, goal) => sum + goal.balance, 0), [goals]);
  const finalBalanceWithYield = useMemo(() => {
    const data = totalChartData.datasets[0]?.data;
    if (!historyLoading && data && data.length > 0) {
      return data[data.length - 1];
    }
    return totalDeposited;
  }, [totalChartData, totalDeposited, historyLoading]);

  const handleSaveGoal = async () => {
    if (!user || !goalName) return;
    const db = getFirestore(app);
    const yieldValue = yieldInputRef.current?.value;
    const targetAmountValue = targetAmountInputRef.current?.value;

    const dataToSave = { 
        name: goalName, 
        yieldPercentage: parseFloat(yieldValue as string) || 0,
        targetAmount: parseFloat(targetAmountValue as string) || 0,
    };

    try {
      if (editingGoal) {
        const docRef = doc(db, 'users', user.uid, 'reserves', editingGoal.id);
        await updateDoc(docRef, dataToSave);
      } else {
        const newGoalRef = await addDoc(collection(db, 'users', user.uid, 'reserves'), dataToSave);
        const initialAmountValue = initialAmountInputRef.current?.value;
        const initialAmountNumber = parseFloat(initialAmountValue as string) || 0;
        if (initialAmountNumber > 0) {
          const initialTransaction = {
            description: `Depósito Inicial - ${goalName}`,
            amount: Math.abs(initialAmountNumber),
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
    setYieldPercentage(goalToAction.yieldPercentage?.toString() || '');
    setTargetAmount(goalToAction.targetAmount?.toString() || '');
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
    const transactionAmountNumber = parseFloat(transactionAmount) || 0;
    const dataToSave = {
      description: `${transactionMode === 'add' ? 'Adicionar Valor' : 'Resgate'} - ${goalToAction.name}`,
      amount: Math.abs(transactionAmountNumber),
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
    setYieldPercentage('');
    setInitialAmount('');
    setTargetAmount('');
    setGoalCreationDate(new Date().toISOString());
  };

  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    setTransactionAmount('');
    setIsRecurring(false);
    setTransactionDate(new Date().toISOString());
  };

  return (
    <PageLayout pageTitle="Reserva">
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
                    {typeof goal.yieldPercentage === 'number' && goal.yieldPercentage > 0 ? 
                      <p>Rendimento: {goal.yieldPercentage}% ao mês</p> 
                      : 
                      <p>Sem rendimento</p>
                    }
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
        onClose={closeGoalModal}
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
                <IonInput ref={initialAmountInputRef} type="number" value={initialAmount} onIonChange={e => setInitialAmount(e.detail.value!)} placeholder="Opcional. Ex: 500,00" />
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
            <IonInput ref={targetAmountInputRef} type="number" value={targetAmount} onIonChange={e => setTargetAmount(e.detail.value!)} placeholder="Opcional. Ex: 10000,00" />
          </IonItem>
        </div>
        <div className="form-field-group">
          <IonItem>
            <IonLabel position="floating">Rendimento Mensal (%)</IonLabel>
            <IonInput ref={yieldInputRef} type="number" value={yieldPercentage} onIonChange={e => setYieldPercentage(e.detail.value!)} placeholder="Opcional. Ex: 1.1" />
          </IonItem>
        </div>
        <div className="ion-padding-horizontal ion-padding-bottom">
          <ActionButton onClick={handleSaveGoal} expand="block" color="primary">
            {editingGoal ? 'Salvar Alterações' : 'Criar Objetivo'}
          </ActionButton>
        </div>
      </AppModal>

      <AppModal
        title={transactionMode === 'add' ? 'Adicionar Valor' : 'Resgatar Valor'}
        isOpen={showTransactionModal}
        onClose={closeTransactionModal}
      >
        <div className="ion-padding">
          <p className="ion-text-center">Movimentar para <strong>{goalToAction?.name}</strong></p>
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Valor (R$)</IonLabel>
              <IonInput type="number" value={transactionAmount} onIonChange={e => setTransactionAmount(e.detail.value!)} placeholder="100,00" />
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
          <div className="ion-padding-horizontal ion-padding-bottom">
              <ActionButton onClick={handleSaveTransaction} expand="block" color="primary">
                  Confirmar
              </ActionButton>
          </div>
        </div>
      </AppModal>
      
      <IonModal ref={goalModalRef} keepContentsMounted={true}>
          <IonDatetime 
            id="datetime-goal-modal" 
            value={goalCreationDate} 
            onIonChange={e => {
                const value = e.detail.value;
                if (typeof value === 'string') { setGoalCreationDate(value); }
                goalModalRef.current?.dismiss();
            }} 
            presentation="date" 
          />
      </IonModal>
      <IonModal ref={transactionModalRef} keepContentsMounted={true}>
          <IonDatetime 
            id="datetime-transaction-modal" 
            value={transactionDate} 
            onIonChange={e => {
                const value = e.detail.value;
                if (typeof value === 'string') { setTransactionDate(value); }
                transactionModalRef.current?.dismiss();
            }} 
            presentation="date" 
          />
      </IonModal>

      <ActionAlert
          isOpen={showDeleteAlert}
          onClose={() => setShowDeleteAlert(false)}
          header={'Confirmar Exclusão'}
          message={'Tem certeza? Este objetivo e todas as suas transações serão apagados permanentemente.'}
          onConfirm={confirmDeleteGoal}
          confirmButtonText="Excluir"
      />
      
      <InputAlert
          isOpen={showAdjustBalanceAlert}
          onClose={() => setShowAdjustBalanceAlert(false)}
          header={'Ajustar Saldo'}
          message={`Qual o valor correto para "${goalToAction?.name}"?`}
          inputs={[{ name: 'newBalance', type: 'number', placeholder: 'Ex: 1550,75', value: goalToAction?.balance }]}
          onConfirm={(data: { newBalance: string }) => confirmBalanceAdjustment(data)}
      />
      
      <IonActionSheet
          isOpen={showActionSheet}
          onClose={() => setShowActionSheet(false)}
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
    </PageLayout>
  );
};

export default Reserva;