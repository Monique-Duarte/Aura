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
  IonDatetime,
  IonToggle,
  IonText,
  IonSpinner,
  IonDatetimeButton,
  IonSegment,
  IonSegmentButton,
  IonActionSheet,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonAlert,
} from '@ionic/react';
import { add, close, pencil, trash, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, addDoc, query, where, Timestamp, doc, deleteDoc, updateDoc, writeBatch, onSnapshot, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import app from '../firebaseConfig';
import CategorySelector from '../components/CategorySelector';
import PeriodSelector from '../components/PeriodSelector';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';
import '../styles/Lancamentos.css';
import '../theme/variables.css';
import { getInvoicePeriodForExpense } from '../logic/fatureLogic';

// --- Interfaces ---
interface Period {
  startDate: Date;
  endDate: Date;
}

interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
}

interface ExpenseTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  isRecurring: boolean;
  isPaid?: boolean;
  categories?: string[];
  paymentMethod?: 'credit' | 'debit';
  isInstallment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  cardId?: string;
}

const filterOptions = [
  { key: 'all', label: 'Despesas Totais' },
  { key: 'credit', label: 'Gastos Crédito' },
  { key: 'debit', label: 'Gastos Débito' },
] as const;

type FilterMode = typeof filterOptions[number]['key'];

const Despesas: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [allFetchedExpenses, setAllFetchedExpenses] = useState<ExpenseTransaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados do formulário ---
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | undefined>();
  const [date, setDate] = useState(new Date().toISOString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit'>('debit');
  const [installments, setInstallments] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>();
  const [editingExpense, setEditingExpense] = useState<ExpenseTransaction | null>(null);

  // --- Estados de Alertas e Menus ---
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showPayAllAlert, setShowPayAllAlert] = useState(false);
  const [expenseToAction, setExpenseToAction] = useState<ExpenseTransaction | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showInstallmentDeleteAlert, setShowInstallmentDeleteAlert] = useState(false);

  // --- Estados de Filtro ---
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  useEffect(() => {
    if (!user) return;
    const db = getFirestore(app);
    const cardsRef = collection(db, 'users', user.uid, 'cards');
    const unsubscribe = onSnapshot(query(cardsRef), (snapshot) => {
      const fetchedCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CreditCard[];
      setCards(fetchedCards);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const db = getFirestore(app);
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, where('type', '==', 'expense'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedExpenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as ExpenseTransaction[];
      setAllFetchedExpenses(fetchedExpenses);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const expensesForPeriod = useMemo(() => {
    if (!selectedPeriod) return [];
    
    return allFetchedExpenses.filter(expense => {
      if (expense.paymentMethod !== 'credit' || !expense.cardId) {
        return expense.date >= selectedPeriod.startDate && expense.date <= selectedPeriod.endDate;
      }

      const card = cards.find(c => c.id === expense.cardId);
      if (!card) {
        return expense.date >= selectedPeriod.startDate && expense.date <= selectedPeriod.endDate;
      }

      const invoicePeriod = getInvoicePeriodForExpense(expense.date, card);
      
      return (
        invoicePeriod.endDate.getMonth() === selectedPeriod.startDate.getMonth() &&
        invoicePeriod.endDate.getFullYear() === selectedPeriod.startDate.getFullYear()
      );
    });
  }, [allFetchedExpenses, selectedPeriod, cards]);

  const handleSaveExpense = async () => {
    if (!user || !amount || !description) return;
    const db = getFirestore(app);

    try {
      if (paymentMethod === 'credit' && installments > 1 && !editingExpense) {
        const batch = writeBatch(db);
        const groupId = uuidv4();
        const installmentAmount = Math.abs(amount) / installments;

        for (let i = 0; i < installments; i++) {
          const installmentDate = new Date(date);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          const newDocRef = doc(collection(db, 'users', user.uid, 'transactions'));
          
          const data = {
            type: 'expense',
            amount: installmentAmount,
            description: `${description} (${i + 1}/${installments})`,
            date: Timestamp.fromDate(installmentDate),
            isRecurring: false,
            paymentMethod,
            isInstallment: true,
            installmentNumber: i + 1,
            totalInstallments: installments,
            installmentGroupId: groupId,
            categories: selectedCategories,
            isPaid: false,
            ...(selectedCardId && { cardId: selectedCardId }),
          };
          batch.set(newDocRef, data);
        }
        await batch.commit();
      } else {
        const dataToSave = {
          amount: Math.abs(amount),
          description,
          date: Timestamp.fromDate(new Date(date)),
          isRecurring,
          paymentMethod,
          categories: selectedCategories,
          isPaid: paymentMethod === 'debit',
          ...(paymentMethod === 'credit' && selectedCardId && { cardId: selectedCardId }),
          ...(isRecurring && { recurringDay: new Date(date).getDate() }),
        };
        if (editingExpense) {
          const docRef = doc(db, 'users', user.uid, 'transactions', editingExpense.id);
          await updateDoc(docRef, { ...dataToSave, type: 'expense' });
        } else {
          const transactionsRef = collection(db, 'users', user.uid, 'transactions');
          await addDoc(transactionsRef, { ...dataToSave, type: 'expense' });
        }
      }
      closeModalAndReset();
    } catch (error) {
      console.error("Erro ao salvar gasto:", error);
    }
  };

  const handleTogglePaidStatus = async () => {
    if (!user || !expenseToAction) return;
    const db = getFirestore(app);
    const docRef = doc(db, 'users', user.uid, 'transactions', expenseToAction.id);
    try {
      await updateDoc(docRef, { isPaid: !expenseToAction.isPaid });
    } catch (error) {
      console.error("Erro ao atualizar status de pagamento:", error);
    }
  };

  const handlePayAll = async () => {
    if (!user) return;
    const unpaidExpenses = expensesForPeriod.filter(exp => !exp.isPaid);
    if (unpaidExpenses.length === 0) return;

    const db = getFirestore(app);
    const batch = writeBatch(db);
    unpaidExpenses.forEach(expense => {
      const docRef = doc(db, 'users', user.uid, 'transactions', expense.id);
      batch.update(docRef, { isPaid: true });
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error("Erro ao pagar todas as contas:", error);
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
    setSelectedCardId(expenseToAction.cardId);
    setShowModal(true);
  };

  const handleDeleteClick = () => {
    if (!expenseToAction) return;
    if (expenseToAction.isInstallment) {
      setShowInstallmentDeleteAlert(true);
    } else {
      setShowDeleteAlert(true);
    }
  };

  const confirmDelete = async () => {
    if (!user || !expenseToAction) return;
    const db = getFirestore(app);
    try {
      const docRef = doc(db, 'users', user.uid, 'transactions', expenseToAction.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao excluir gasto:", error);
    }
    setShowDeleteAlert(false);
    setExpenseToAction(null);
  };

  const confirmDeleteSingleInstallment = async () => {
    await confirmDelete();
    setShowInstallmentDeleteAlert(false);
  };

  const confirmDeleteFutureInstallments = async () => {
    if (!user || !expenseToAction?.installmentGroupId || typeof expenseToAction?.installmentNumber !== 'number') return;
    const db = getFirestore(app);
    try {
      const batch = writeBatch(db);
      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        where('installmentGroupId', '==', expenseToAction.installmentGroupId),
        where('installmentNumber', '>=', expenseToAction.installmentNumber)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(document => batch.delete(document.ref));
      await batch.commit();
    } catch (error) {
      console.error("Erro ao excluir parcelas futuras:", error);
    }
    setShowInstallmentDeleteAlert(false);
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
    setSelectedCardId(undefined);
  };

  const displayedExpenses = useMemo(() => {
    if (filterMode === 'all') return expensesForPeriod;
    return expensesForPeriod.filter(exp => exp.paymentMethod === filterMode);
  }, [expensesForPeriod, filterMode]);

  const unpaidExpenses = displayedExpenses.filter(exp => !exp.isPaid);
  const paidExpenses = displayedExpenses.filter(exp => exp.isPaid);
  const totalExpense = displayedExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Despesas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="summary-card">
          <IonText><p>Despesas totais no período</p></IonText>
          <IonText color="danger">
            <h2>{totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
          </IonText>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <PeriodSelector onPeriodChange={setSelectedPeriod} />
        </div>

        <div className="dashboard-chart-legend" style={{ justifyContent: 'center' }}>
          {filterOptions.map(opt => (
            <button
              key={opt.key}
              className={`dashboard-legend-btn${filterMode === opt.key ? ' active' : ''}`}
              onClick={() => setFilterMode(opt.key)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>

        {unpaidExpenses.length > 0 && (
          <div className="pay-all-container">
            <ActionButton fill="outline" onClick={() => setShowPayAllAlert(true)} icon={checkmarkCircleOutline}>
              Pagar Todas as Contas Pendentes
            </ActionButton>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner /></div>
        ) : (
          <>
            <IonList>
              {unpaidExpenses.map(expense => (
                <IonItem key={expense.id} lines="inset" button onClick={() => handleItemClick(expense)} className="item-unpaid">
                  <IonLabel>
                    <h2>{expense.description}</h2>
                    <p>{expense.date.toLocaleDateString('pt-BR')}</p>
                  </IonLabel>
                  <div slot="end" className="item-details-end">
                    <IonText color="danger">
                      <p>{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </IonText>
                    {expense.paymentMethod && (
                      <div className={`payment-method-tag ${expense.paymentMethod}`}>
                        {expense.paymentMethod === 'credit' ? 'CRÉD' : 'DÉB'}
                      </div>
                    )}
                  </div>
                </IonItem>
              ))}
            </IonList>

            {paidExpenses.length > 0 && (
              <div className="paid-section">
                <div className="divider"><span>Contas Pagas</span></div>
                <IonList>
                  {paidExpenses.map(expense => (
                    <IonItem key={expense.id} lines="inset" button onClick={() => handleItemClick(expense)} className="item-paid">
                      <IonLabel>
                        <h2>{expense.description}</h2>
                        <p>{expense.date.toLocaleDateString('pt-BR')}</p>
                      </IonLabel>
                      <div slot="end" className="item-details-end">
                        <IonText color="danger">
                          <p>{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </IonText>
                        {expense.paymentMethod && (
                          <div className={`payment-method-tag ${expense.paymentMethod}`}>
                            {expense.paymentMethod === 'credit' ? 'CRÉD' : 'DÉB'}
                          </div>
                        )}
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}
          </>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)}><IonIcon icon={add} /></IonFabButton>
        </IonFab>

        <AppModal
          title={editingExpense ? 'Editar Gasto' : 'Novo Gasto'}
          isOpen={showModal}
          onDidDismiss={closeModalAndReset}
        >
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
              <IonLabel position="floating">
                {installments > 1 ? 'Valor Total (R$)' : 'Valor (R$)'}
              </IonLabel>
              <IonInput type="number" value={amount} onIonChange={e => setAmount(parseFloat(e.detail.value!))} placeholder="2000,00" />
            </IonItem>
          </div>
          <div className="form-field-group">
            <IonItem lines="none" className="date-item">
              <IonLabel>
                {installments > 1 ? 'Data da Primeira Parcela' : 'Data'}
              </IonLabel>
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

          {paymentMethod === 'credit' && (
            <div className="form-field-group">
              <IonItem>
                <IonLabel>Cartão de Crédito</IonLabel>
                <IonSelect value={selectedCardId} placeholder="Selecione (Opcional)" onIonChange={e => setSelectedCardId(e.detail.value)}>
                  {cards.map(card => <IonSelectOption key={card.id} value={card.id}>{card.name}</IonSelectOption>)}
                </IonSelect>
              </IonItem>
            </div>
          )}

          {paymentMethod === 'credit' && !editingExpense && (
            <div className="form-field-group">
              <IonItem>
                <IonLabel position="floating">Nº de Parcelas</IonLabel>
                <IonInput type="number" value={installments} onIonChange={e => setInstallments(parseInt(e.detail.value!, 10) || 1)} />
              </IonItem>
              {installments > 1 && amount && (
                <IonText color="medium" style={{ paddingLeft: '16px', fontSize: '0.8rem' }}>
                  <p>{installments}x de {(amount / installments).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </IonText>
              )}
            </div>
          )}
          <div className="form-field-group">
            <IonItem lines="none" className="toggle-item">
              <IonLabel>Gasto Fixo Mensal?</IonLabel>
              <IonToggle checked={isRecurring} onIonChange={e => setIsRecurring(e.detail.checked)} />
            </IonItem>
          </div>
          <ActionButton onClick={handleSaveExpense}>
            {editingExpense ? 'Salvar Alterações' : 'Salvar Gasto'}
          </ActionButton>
        </AppModal>

        <IonModal keepContentsMounted={true}>
            <IonDatetime id="datetime-in-modal" value={date} onIonChange={e => { const value = e.detail.value; if (typeof value === 'string') { setDate(value); } }} presentation="date" />
        </IonModal>

        <ActionAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={'Confirmar Exclusão'}
          message={'Tem certeza que deseja excluir este lançamento?'}
          onConfirm={confirmDelete}
          confirmButtonText="Excluir"
        />

        <IonAlert
            isOpen={showInstallmentDeleteAlert}
            onDidDismiss={() => setShowInstallmentDeleteAlert(false)}
            header={'Excluir Despesa Parcelada'}
            message={'Você deseja excluir apenas esta parcela ou esta e todas as futuras?'}
            buttons={[
                {
                    text: 'Apenas Esta',
                    handler: confirmDeleteSingleInstallment
                },
                {
                    text: 'Esta e as Próximas',
                    cssClass: 'alert-button-danger',
                    handler: confirmDeleteFutureInstallments
                },
                {
                    text: 'Cancelar',
                    role: 'cancel',
                },
            ]}
        />

        <ActionAlert
          isOpen={showPayAllAlert}
          onDidDismiss={() => setShowPayAllAlert(false)}
          header={'Confirmar Pagamento'}
          message={'Deseja marcar todas as contas pendentes como pagas?'}
          onConfirm={() => {
            handlePayAll();
            setShowPayAllAlert(false);
          }}
          confirmButtonText="Pagar Todas"
        />
        
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={expenseToAction?.description}
          buttons={[
              ...(expenseToAction && !expenseToAction.isPaid ? [{
                  text: 'Pagar Conta',
                  icon: checkmarkCircleOutline,
                  handler: handleTogglePaidStatus,
                  cssClass: 'action-sheet-edit',
              }] : []),
              ...(expenseToAction && expenseToAction.isPaid ? [{
                  text: 'Marcar como não pago',
                  icon: closeCircleOutline,
                  handler: handleTogglePaidStatus,
                  cssClass: 'action-sheet-edit',
              }] : []),
              {
                  text: 'Editar',
                  icon: pencil,
                  handler: handleEditClick,
                  cssClass: 'action-sheet-edit',
              },
              // A lógica para antecipar foi removida por simplicidade, pode ser adicionada depois se necessário
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

export default Despesas;