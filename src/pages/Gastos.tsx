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
  IonSegment,
  IonSegmentButton,
  IonActionSheet,
} from '@ionic/react';
import { add, close, pencil, trash, walletOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import app from '../firebaseConfig';
import './Lancamentos.css';
import CategorySelector from '../components/CategorySelector';
import PeriodSelector from '../components/PeriodSelector'; // Importa o seletor de período

// --- Interfaces ---
interface Period {
  startDate: Date;
  endDate: Date;
}

interface ExpenseTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  isRecurring: boolean;
  categories?: string[];
  paymentMethod?: 'credit' | 'debit';
  isInstallment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
}

const Gastos: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | undefined>();
  const [date, setDate] = useState(new Date().toISOString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit'>('debit');
  const [installments, setInstallments] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Estados de controle
  const [editingExpense, setEditingExpense] = useState<ExpenseTransaction | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [expenseToAction, setExpenseToAction] = useState<ExpenseTransaction | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null); // Estado para o período selecionado

  const fetchExpenses = useCallback(async () => {
    // ALTERAÇÃO: Usa o 'selectedPeriod' do estado em vez do 'currentPeriod' do hook
    if (!user || !selectedPeriod) { setLoading(false); return; }
    setLoading(true);
    try {
        const db = getFirestore(app);
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const q = query(
          transactionsRef,
          where('type', '==', 'expense'),
          where('date', '>=', selectedPeriod.startDate),
          where('date', '<=', selectedPeriod.endDate)
        );
        const querySnapshot = await getDocs(q);
        const fetchedExpenses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: (doc.data().date as Timestamp).toDate(),
        })).sort((a, b) => b.date.getTime() - a.date.getTime()) as ExpenseTransaction[];
        setExpenses(fetchedExpenses);
    } catch (error) {
        console.error("Erro ao buscar gastos:", error);
    } finally {
        setLoading(false);
    }
  }, [user, selectedPeriod]); // ALTERAÇÃO: Depende do 'selectedPeriod'

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSaveExpense = async () => {
    if (!user || !amount || !description) return;
    const db = getFirestore(app);

    try {
        if (paymentMethod === 'credit' && installments > 1 && !editingExpense) {
            const batch = writeBatch(db);
            const groupId = uuidv4();
            for (let i = 0; i < installments; i++) {
                const installmentDate = new Date(date);
                installmentDate.setMonth(installmentDate.getMonth() + i);
                const newDocRef = doc(collection(db, 'users', user.uid, 'transactions'));
                batch.set(newDocRef, {
                    type: 'expense', amount: Math.abs(amount),
                    description: `${description} (${i + 1}/${installments})`,
                    date: Timestamp.fromDate(installmentDate), isRecurring: false,
                    paymentMethod, isInstallment: true, installmentNumber: i + 1,
                    totalInstallments: installments, installmentGroupId: groupId,
                    categories: selectedCategories,
                });
            }
            await batch.commit();
        } else {
            const dataToSave = {
                amount: Math.abs(amount), description,
                date: Timestamp.fromDate(new Date(date)),
                isRecurring, paymentMethod, categories: selectedCategories,
                ...(isRecurring && { recurringDay: new Date(date).getDate() }),
            };
            if (editingExpense) {
                const docRef = doc(db, 'users', user.uid, 'transactions', editingExpense.id);
                await updateDoc(docRef, dataToSave);
            } else {
                const transactionsRef = collection(db, 'users', user.uid, 'transactions');
                await addDoc(transactionsRef, { ...dataToSave, type: 'expense' });
            }
        }
        closeModalAndReset();
        fetchExpenses();
    } catch (error) {
        console.error("Erro ao salvar gasto:", error);
    }
  };

  const handleItemClick = (expense: ExpenseTransaction) => {
    setExpenseToAction(expense);
    setShowActionSheet(true);
  };

  const handleEditClick = () => {
    if (!expenseToAction) return;
    setEditingExpense(expenseToAction);
    setDescription(expenseToAction.description);
    setAmount(expenseToAction.amount);
    setDate(expenseToAction.date.toISOString());
    setIsRecurring(expenseToAction.isRecurring);
    setPaymentMethod(expenseToAction.paymentMethod || 'debit');
    setSelectedCategories(expenseToAction.categories || []);
    setShowModal(true);
  };

  const handleDeleteClick = () => {
    if (!expenseToAction) return;
    setShowDeleteAlert(true);
  };

  const handleAnticipateClick = async () => {
    if (!user || !expenseToAction) return;
    const db = getFirestore(app);
    const docRef = doc(db, 'users', user.uid, 'transactions', expenseToAction.id);
    try {
        await updateDoc(docRef, {
            date: Timestamp.fromDate(new Date()),
        });
        fetchExpenses();
    } catch (error) {
        console.error("Erro ao antecipar parcela:", error);
    }
  };

  const confirmDelete = async () => {
    if (!user || !expenseToAction) return;
    const db = getFirestore(app);
    const docRef = doc(db, 'users', user.uid, 'transactions', expenseToAction.id);
    try {
        await deleteDoc(docRef);
        fetchExpenses();
    } catch (error) {
        console.error("Erro ao excluir gasto:", error);
    }
    setShowDeleteAlert(false);
    setExpenseToAction(null);
  };

  const closeModalAndReset = () => {
    setShowModal(false);
    setEditingExpense(null);
    setDescription('');
    setAmount(undefined);
    setDate(new Date().toISOString());
    setIsRecurring(false);
    setPaymentMethod('debit');
    setInstallments(1);
    setSelectedCategories([]);
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  const isFutureInstallment = expenseToAction?.isInstallment && expenseToAction.date > new Date();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Gastos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="summary-card">
          <IonText><p>Gastos totais no período</p></IonText>
          <IonText color="danger">
            <h2>{totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
          </IonText>
        </div>

        {/* ALTERAÇÃO: Seletor de período movido para fora do card */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <PeriodSelector onPeriodChange={setSelectedPeriod} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner /></div>
        ) : (
          <IonList>
            {expenses.map(expense => (
              <IonItem key={expense.id} lines="inset" button onClick={() => handleItemClick(expense)}>
                <IonLabel>
                  <h2>{expense.description}</h2>
                  <p>{expense.date.toLocaleDateString('pt-BR')}</p>
                </IonLabel>
                <IonText color="danger" slot="end">
                  <p>{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </IonText>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)}><IonIcon icon={add} /></IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={closeModalAndReset} initialBreakpoint={0.9} breakpoints={[0, 0.9, 1]}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingExpense ? 'Editar Gasto' : 'Novo Gasto'}</IonTitle>
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
                    <IonInput value={description} onIonChange={e => setDescription(e.detail.value!)} placeholder="Ex: Tênis, Supermercado" />
                  </IonItem>
                </div>
                <div className="form-field-group">
                  <CategorySelector 
                    selectedCategories={selectedCategories} 
                    onCategoryChange={setSelectedCategories} 
                  />
                </div>
                <div className="form-field-group">
                  <IonItem>
                    <IonLabel position="floating">Valor (R$)</IonLabel>
                    <IonInput type="number" value={amount} onIonChange={e => setAmount(parseFloat(e.detail.value!))} placeholder="100,00" />
                  </IonItem>
                </div>
                <div className="form-field-group">
                  <IonItem lines="none" className="date-item">
                    <IonLabel>Data</IonLabel>
                    <IonDatetimeButton datetime="datetime-in-modal"></IonDatetimeButton>
                  </IonItem>
                </div>
                <div className="form-field-group">
                    <IonLabel style={{ paddingLeft: '16px', color: 'var(--ion-color-medium-shade)' }}>Forma de Pagamento</IonLabel>
                    <IonSegment value={paymentMethod} onIonChange={e => {
                        const value = e.detail.value;
                        if (value === 'credit' || value === 'debit') {
                            setPaymentMethod(value);
                        }
                    }}>
                        <IonSegmentButton value="debit"><IonLabel>Débito</IonLabel></IonSegmentButton>
                        <IonSegmentButton value="credit"><IonLabel>Crédito</IonLabel></IonSegmentButton>
                    </IonSegment>
                </div>
                {paymentMethod === 'credit' && !editingExpense && (
                  <div className="form-field-group">
                    <IonItem>
                      <IonLabel position="floating">Nº de Parcelas</IonLabel>
                      <IonInput type="number" value={installments} onIonChange={e => setInstallments(parseInt(e.detail.value!, 10))} />
                    </IonItem>
                  </div>
                )}
                <div className="form-field-group">
                  <IonItem lines="none" className="toggle-item">
                    <IonLabel>Gasto Fixo Mensal?</IonLabel>
                    <IonToggle checked={isRecurring} onIonChange={e => setIsRecurring(e.detail.checked)} />
                  </IonItem>
                </div>
              </div>
              <IonButton expand="block" onClick={handleSaveExpense} className="save-button">
                {editingExpense ? 'Salvar Alterações' : 'Salvar Gasto'}
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
            message={'Tem certeza que deseja excluir este lançamento?'}
            buttons={[
                { text: 'Cancelar', role: 'cancel' },
                { 
                  text: 'Excluir', 
                  cssClass: 'alert-button-danger', 
                  handler: confirmDelete 
                }
            ]}
        />
        
        <IonActionSheet
            isOpen={showActionSheet}
            onDidDismiss={() => setShowActionSheet(false)}
            header={expenseToAction?.description}
            buttons={[
                {
                    text: 'Editar',
                    icon: pencil,
                    handler: handleEditClick,
                    cssClass: 'action-sheet-edit',
                },
                ...(isFutureInstallment ? [{
                    text: 'Antecipar Parcela',
                    icon: walletOutline,
                    handler: handleAnticipateClick,
                    cssClass: 'action-sheet-anticipate',
                }] : []),
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

export default Gastos;
