import React, { useState, useEffect, useCallback } from 'react';
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
  IonModal,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonDatetime,
  IonToggle,
  IonText,
  IonSpinner,
  IonDatetimeButton,
  IonAlert,
  IonActionSheet,
} from '@ionic/react';
import { add, close, pencil, trash } from 'ionicons/icons';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import app from '../firebaseConfig';
import './Lancamentos.css';
import PeriodSelector from '../components/PeriodSelector';

// --- Interfaces ---
interface Period {
  startDate: Date;
  endDate: Date;
}

interface IncomeTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  isRecurring: boolean;
}

const Renda: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | undefined>();
  const [date, setDate] = useState(new Date().toISOString());
  const [isRecurring, setIsRecurring] = useState(false);

  // Estados de controle
  const [editingIncome, setEditingIncome] = useState<IncomeTransaction | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [incomeToAction, setIncomeToAction] = useState<IncomeTransaction | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  const fetchIncomes = useCallback(async () => {
    if (!user || !selectedPeriod) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = getFirestore(app);
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(
        transactionsRef,
        where('type', '==', 'income'),
        where('date', '>=', selectedPeriod.startDate),
        where('date', '<=', selectedPeriod.endDate)
      );

      const querySnapshot = await getDocs(q);
      const fetchedIncomes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })).sort((a, b) => b.date.getTime() - a.date.getTime()) as IncomeTransaction[];

      setIncomes(fetchedIncomes);
    } catch (error) {
      console.error("Erro ao buscar rendas:", error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const handleSaveIncome = async () => {
    if (!user || !amount || !description) return;
    const db = getFirestore(app);

    const dataToSave = {
      amount: Math.abs(amount),
      description,
      date: Timestamp.fromDate(new Date(date)),
      isRecurring,
      ...(isRecurring && { recurringDay: new Date(date).getDate() }),
    };

    try {
      if (editingIncome) {
        const docRef = doc(db, 'users', user.uid, 'transactions', editingIncome.id);
        await updateDoc(docRef, dataToSave);
      } else {
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        await addDoc(transactionsRef, { ...dataToSave, type: 'income' });
      }
      closeModalAndReset();
      fetchIncomes();
    } catch (error) {
      console.error("Erro ao salvar renda:", error);
    }
  };

  const handleItemClick = (income: IncomeTransaction) => {
    setIncomeToAction(income);
    setShowActionSheet(true);
  };

  const handleEditClick = () => {
    if (!incomeToAction) return;
    setEditingIncome(incomeToAction);
    setDescription(incomeToAction.description);
    setAmount(incomeToAction.amount);
    setDate(incomeToAction.date.toISOString());
    setIsRecurring(incomeToAction.isRecurring);
    setShowModal(true);
  };

  const handleDeleteClick = () => {
    if (!incomeToAction) return;
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!user || !incomeToAction) return;
    const db = getFirestore(app);
    const docRef = doc(db, 'users', user.uid, 'transactions', incomeToAction.id);
    try {
      await deleteDoc(docRef);
      fetchIncomes();
    } catch (error) {
      console.error("Erro ao excluir renda:", error);
    }
    setShowDeleteAlert(false);
    setIncomeToAction(null);
  };

  const closeModalAndReset = () => {
    setShowModal(false);
    setEditingIncome(null);
    setDescription('');
    setAmount(undefined);
    setDate(new Date().toISOString());
    setIsRecurring(false);
  };

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Renda</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="summary-card">
          <IonText><p>Renda total no período</p></IonText>
          <IonText color="success">
            <h2>{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
          </IonText>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <PeriodSelector onPeriodChange={setSelectedPeriod} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner /></div>
        ) : (
          <IonList>
            {incomes.map(income => (
              <IonItem key={income.id} lines="inset" button onClick={() => handleItemClick(income)}>
                <IonLabel>
                  <h2>{income.description}</h2>
                  <p>{income.date.toLocaleDateString('pt-BR')}</p>
                </IonLabel>
                <IonText color="success" slot="end">
                  <p>{income.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </IonText>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={closeModalAndReset} initialBreakpoint={0.75} breakpoints={[0, 0.75, 1]}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingIncome ? 'Editar Renda' : 'Nova Renda'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeModalAndReset}><IonIcon icon={close} /></IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="income-modal-form">
              <div className="form-fields-container">
                <div className="form-field-group">
                  <IonItem>
                    <IonLabel position="floating">Descrição</IonLabel>
                    <IonInput value={description} onIonChange={e => setDescription(e.detail.value!)} placeholder="Ex: Salário, Freelance" />
                  </IonItem>
                </div>
                <div className="form-field-group">
                  <IonItem>
                    <IonLabel position="floating">Valor (R$)</IonLabel>
                    <IonInput type="number" value={amount} onIonChange={e => setAmount(parseFloat(e.detail.value!))} placeholder="1500,00" />
                  </IonItem>
                </div>
                <div className="form-field-group">
                  <IonItem lines="none" className="date-item">
                    <IonLabel>Data</IonLabel>
                    <IonDatetimeButton datetime="datetime-in-modal"></IonDatetimeButton>
                  </IonItem>
                </div>
                <div className="form-field-group">
                  <IonItem lines="none" className="toggle-item">
                    <IonLabel>Renda Fixa Mensal?</IonLabel>
                    <IonToggle checked={isRecurring} onIonChange={e => setIsRecurring(e.detail.checked)} />
                  </IonItem>
                </div>
              </div>
              <IonButton expand="block" onClick={handleSaveIncome} className="save-button">
                {editingIncome ? 'Salvar Alterações' : 'Salvar Renda'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonModal keepContentsMounted={true}>
            <IonDatetime id="datetime-in-modal" value={date} onIonChange={e => { const value = e.detail.value; if (typeof value === 'string') { setDate(value); } }} presentation="date" />
        </IonModal>

        <IonAlert
            isOpen={showDeleteAlert}
            onDidDismiss={() => setShowDeleteAlert(false)}
            header={'Confirmar Exclusão'}
            message={'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.'}
            buttons={[
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Excluir', cssClass: 'alert-button-danger', handler: confirmDelete },
            ]}
        />
        
        <IonActionSheet
            isOpen={showActionSheet}
            onDidDismiss={() => setShowActionSheet(false)}
            header={incomeToAction?.description}
            buttons={[
                {
                    text: 'Editar',
                    icon: pencil,
                    handler: handleEditClick,
                    cssClass: 'action-sheet-edit',
                },
                {
                    text: 'Excluir',
                    role: 'destructive',
                    icon: trash,
                    handler: handleDeleteClick
                },
                {
                    text: 'Cancelar',
                    icon: close,
                    role: 'cancel'
                }
            ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Renda;
