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
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { add, close, pencil, trash } from 'ionicons/icons';
import { useDate } from '../hooks/DateContext';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import app from '../firebaseConfig';
import './Lancamentos.css';

// --- Interfaces ---
interface Category {
  id: string;
  name: string;
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

// --- Constantes ---
const DEFAULT_CATEGORIES = [
  "Casa", "Mercado", "Restaurantes", "Saúde", "Transporte", "Assinaturas", "Outros"
];

const Gastos: React.FC = () => {
  const { user } = useAuth();
  const { currentPeriod } = useDate();
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
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [showNewCategoryAlert, setShowNewCategoryAlert] = useState(false);
  // O estado newCategoryName foi removido pois não é mais necessário

  // --- Funções de busca de dados ---
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const db = getFirestore(app);
    
    // Mapeia as categorias padrão
    const defaultCats: Category[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));

    // Busca categorias customizadas do usuário
    const customCatsRef = collection(db, 'users', user.uid, 'categories');
    const querySnapshot = await getDocs(customCatsRef);
    const customCats = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })) as Category[];

    // Combina e remove duplicatas
    const allCats = [...defaultCats, ...customCats];
    const uniqueCats = Array.from(new Map(allCats.map(cat => [cat.name, cat])).values());
    
    setAvailableCategories(uniqueCats.sort((a, b) => a.name.localeCompare(b.name)));
  }, [user]);

  const fetchExpenses = useCallback(async () => {
    if (!user || !currentPeriod) { setLoading(false); return; }
    setLoading(true);
    try {
        const db = getFirestore(app);
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const q = query(
          transactionsRef,
          where('type', '==', 'expense'),
          where('date', '>=', currentPeriod.startDate),
          where('date', '<=', currentPeriod.endDate)
        );
        const querySnapshot = await getDocs(q);
        const fetchedExpenses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: (doc.data().date as Timestamp).toDate(),
        })) as ExpenseTransaction[];
        setExpenses(fetchedExpenses);
    } catch (error) {
        console.error("Erro ao buscar gastos:", error);
    } finally {
        setLoading(false);
    }
  }, [user, currentPeriod]);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [fetchExpenses, fetchCategories]);

  // --- Funções de manipulação de dados ---
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

  // CORREÇÃO: A função agora aceita o nome da categoria como argumento
  const handleCreateCategory = async (categoryName: string) => {
    if (!user || !categoryName.trim()) return;
    const db = getFirestore(app);
    const customCatsRef = collection(db, 'users', user.uid, 'categories');
    try {
        await addDoc(customCatsRef, { name: categoryName.trim() });
        fetchCategories(); // Atualiza a lista de categorias
    } catch (error) {
        console.error("Erro ao criar categoria:", error);
    }
  };

  const handleCategoryChange = (e: CustomEvent) => {
    const selected: string[] = e.detail.value;
    if (selected.includes('__CREATE_NEW__')) {
        setShowNewCategoryAlert(true);
        // Remove a opção "criar" da seleção atual
        setSelectedCategories(selected.filter(cat => cat !== '__CREATE_NEW__'));
    } else {
        setSelectedCategories(selected);
    }
  };

  const handleEditClick = (expense: ExpenseTransaction) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount);
    setDate(expense.date.toISOString());
    setIsRecurring(expense.isRecurring);
    setPaymentMethod(expense.paymentMethod || 'debit');
    setSelectedCategories(expense.categories || []);
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!user || !expenseToDelete) return;
    const db = getFirestore(app);
    const docRef = doc(db, 'users', user.uid, 'transactions', expenseToDelete);
    try {
        await deleteDoc(docRef);
        fetchExpenses();
    } catch (error) {
        console.error("Erro ao excluir gasto:", error);
    }
    setShowDeleteAlert(false);
    setExpenseToDelete(null);
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

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner /></div>
        ) : (
          <IonList>
            {expenses.map(expense => (
              <IonItemSliding key={expense.id}>
                <IonItemOptions side="start">
                  <IonItemOption color="primary" onClick={() => handleEditClick(expense)}>
                    <IonIcon slot="icon-only" icon={pencil} />
                  </IonItemOption>
                </IonItemOptions>
                <IonItem lines="inset">
                  <IonLabel>
                    <h2>{expense.description}</h2>
                    <p>{expense.date.toLocaleDateString('pt-BR')}</p>
                  </IonLabel>
                  <IonText color="danger" slot="end">
                    <p>{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </IonText>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => handleDeleteClick(expense.id)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
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
                  <IonItem>
                    <IonLabel position="floating">Categorias</IonLabel>
                    <IonSelect
                        value={selectedCategories}
                        multiple={true}
                        cancelText="Cancelar"
                        okText="Ok"
                        onIonChange={handleCategoryChange}
                        placeholder="Selecione uma ou mais"
                    >
                        {availableCategories.map(cat => (
                            <IonSelectOption key={cat.id} value={cat.name}>{cat.name}</IonSelectOption>
                        ))}
                        <IonSelectOption value="__CREATE_NEW__">➕ Criar nova categoria...</IonSelectOption>
                    </IonSelect>
                  </IonItem>
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
            buttons={[ { text: 'Cancelar', role: 'cancel' }, { text: 'Excluir', handler: confirmDelete } ]}
        />
        <IonAlert
            isOpen={showNewCategoryAlert}
            onDidDismiss={() => setShowNewCategoryAlert(false)}
            header={'Nova Categoria'}
            message={'Digite o nome da nova categoria que deseja criar.'}
            inputs={[{ name: 'categoryName', type: 'text', placeholder: 'Ex: Lazer' }]}
            buttons={[
                { text: 'Cancelar', role: 'cancel' },
                { text: 'Criar', handler: (data) => handleCreateCategory(data.categoryName) },
            ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Gastos;
