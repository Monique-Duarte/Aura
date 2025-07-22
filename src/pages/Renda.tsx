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
  IonItemSliding,
  IonItemOptions,
  IonItemOption, 
} from '@ionic/react';
import { add, close, pencil, trash } from 'ionicons/icons';
import { useDate } from '../hooks/DateContext';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import app from '../firebaseConfig';
import './Lancamentos.css';

interface IncomeTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  isRecurring: boolean;
}

const Renda: React.FC = () => {
  const { user } = useAuth();
  const { currentPeriod } = useDate();
  const [showModal, setShowModal] = useState(false);
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o formulário no modal
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | undefined>();
  const [date, setDate] = useState(new Date().toISOString());
  const [isRecurring, setIsRecurring] = useState(false);

  // Estado para controlar a edição e exclusão
  const [editingIncome, setEditingIncome] = useState<IncomeTransaction | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);

  const fetchIncomes = useCallback(async () => {
    if (!user || !currentPeriod) {
        setLoading(false);
        return;
    };
    setLoading(true);
    try {
        const db = getFirestore(app);
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const q = query(
          transactionsRef,
          where('type', '==', 'income'),
          where('date', '>=', currentPeriod.startDate),
          where('date', '<=', currentPeriod.endDate)
        );

        const querySnapshot = await getDocs(q);
        const fetchedIncomes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: (doc.data().date as Timestamp).toDate(),
        })) as IncomeTransaction[];

        setIncomes(fetchedIncomes);
    } catch (error) {
        console.error("Erro ao buscar rendas:", error);
    } finally {
        setLoading(false);
    }
  }, [user, currentPeriod]);

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

  const handleEditClick = (income: IncomeTransaction) => {
    setEditingIncome(income);
    setDescription(income.description);
    setAmount(income.amount);
    setDate(income.date.toISOString());
    setIsRecurring(income.isRecurring);
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setIncomeToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!user || !incomeToDelete) return;
    const db = getFirestore(app);
    const docRef = doc(db, 'users', user.uid, 'transactions', incomeToDelete);
    try {
        await deleteDoc(docRef);
        fetchIncomes(); // Atualiza a lista
    } catch (error) {
        console.error("Erro ao excluir renda:", error);
    }
    setShowDeleteAlert(false);
    setIncomeToDelete(null);
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

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner /></div>
        ) : (
          <IonList>
            {incomes.map(income => (
              <IonItemSliding key={income.id}>
                <IonItemOptions side="start">
                  <IonItemOption color="primary" onClick={() => handleEditClick(income)}>
                    <IonIcon slot="icon-only" icon={pencil} />
                  </IonItemOption>
                </IonItemOptions>

                <IonItem lines="inset">
                  <IonLabel>
                    <h2>{income.description}</h2>
                    <p>{income.date.toLocaleDateString('pt-BR')}</p>
                  </IonLabel>
                  
                  <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonText color="success">
                      <p style={{ margin: 0 }}>{income.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </IonText>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <IonButton color="primary" fill="clear" size="small" style={{ height: '22px'}} onClick={() => handleEditClick(income)}>
                        <IonIcon slot="icon-only" icon={pencil} />
                      </IonButton>
                      <IonButton color="danger" fill="clear" size="small" style={{ height: '22px'}} onClick={() => handleDeleteClick(income.id)}>
                        <IonIcon slot="icon-only" icon={trash} />
                      </IonButton>
                    </div>
                  </div>
                </IonItem>

                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => handleDeleteClick(income.id)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
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
      </IonContent>
    </IonPage>
  );
};

export default Renda;
