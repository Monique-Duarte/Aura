import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonFab, IonFabButton, IonIcon, IonInput, IonItem, IonLabel, IonList, IonDatetime,
  IonToggle, IonText, IonSpinner, IonDatetimeButton, IonActionSheet, IonModal, IonButton,
  IonSelect, IonSelectOption, IonAlert,
} from '@ionic/react';
import { add, close, pencil, trash, downloadOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, addDoc, query, where, Timestamp, doc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { app }  from '../firebaseConfig';
import PeriodSelector from '../components/PeriodSelector';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';
import ExportDataModal from '../components/ExportDataModal';
import CurrencyInput from '../components/CurrencyInput';
import { useIncomeCategories } from '../hooks/useIncomeCategories';
import '../styles/Lancamentos.css';
import '../theme/variables.css';

// --- Interfaces ---
interface Period {
  startDate: Date;
  endDate: Date;
}
// 2. Interface atualizada para incluir a categoria
interface IncomeTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  isRecurring: boolean;
  categoryId?: string; 
}

const Renda: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  // 3. Usa o novo hook para buscar e adicionar categorias de renda
  const { categories: incomeCategories, addCategory: addIncomeCategory } = useIncomeCategories();

  // Estados do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | undefined>();
  const [date, setDate] = useState(new Date().toISOString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(); // Estado para a categoria selecionada

  // Estados de controle
  const [editingIncome, setEditingIncome] = useState<IncomeTransaction | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [incomeToAction, setIncomeToAction] = useState<IncomeTransaction | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [showAddCategoryAlert, setShowAddCategoryAlert] = useState(false); // Estado para o alerta de nova categoria

  // Lógica de busca de rendas (alterada para usar onSnapshot)
  useEffect(() => {
    if (!user || !selectedPeriod) {
      setIncomes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const db = getFirestore(app);
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(
      transactionsRef,
      where('type', '==', 'income'),
      where('date', '>=', selectedPeriod.startDate),
      where('date', '<=', selectedPeriod.endDate)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedIncomes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })).sort((a, b) => b.date.getTime() - a.date.getTime()) as IncomeTransaction[];
      setIncomes(fetchedIncomes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedPeriod]);

  // Função de salvar atualizada para incluir a categoria
  const handleSaveIncome = async () => {
    if (!user || !amount || !description) return;
    const db = getFirestore(app);
    const dataToSave = {
      amount: Math.abs(amount),
      description,
      date: Timestamp.fromDate(new Date(date)),
      isRecurring,
      categoryId: selectedCategoryId || null, // Salva o ID da categoria
      ...(isRecurring && { recurringDay: new Date(date).getDate() }),
    };

    try {
      if (editingIncome) {
        const docRef = doc(db, 'users', user.uid, 'transactions', editingIncome.id);
        await updateDoc(docRef, { ...dataToSave, type: 'income' });
      } else {
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        await addDoc(transactionsRef, { ...dataToSave, type: 'income' });
      }
      closeModalAndReset();
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
    setSelectedCategoryId(incomeToAction.categoryId); // Popula a categoria ao editar
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
    setSelectedCategoryId(undefined); // Limpa a categoria
  };

  // Função para lidar com a seleção de categoria
  const handleCategoryChange = (e: CustomEvent) => {
    const value = e.detail.value;
    if (value === 'add_new') {
      setShowAddCategoryAlert(true);
    } else {
      setSelectedCategoryId(value);
    }
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
          <IonButtons slot="end">
            <IonButton onClick={() => setShowExportModal(true)}>
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
          </IonButtons>
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
            {incomes.map(income => {
              const category = incomeCategories.find(c => c.id === income.categoryId);
              return (
                <IonItem key={income.id} lines="inset" button onClick={() => handleItemClick(income)}>
                  <IonLabel>
                    <h2>{income.description}</h2>
                    {/* Exibe o nome da categoria se ela existir */}
                    <p>{income.date.toLocaleDateString('pt-BR')} {category ? `· ${category.name}` : ''}</p>
                  </IonLabel>
                  <IonText color="success" slot="end">
                    <p>{income.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </IonText>
                </IonItem>
              );
            })}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <AppModal
          title={editingIncome ? 'Editar Renda' : 'Nova Renda'}
          isOpen={showModal}
          onDidDismiss={closeModalAndReset}
        >
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Descrição</IonLabel>
              <IonInput value={description} onIonChange={e => setDescription(e.detail.value!)} placeholder="Ex: Salário, Freelance" />
            </IonItem>
          </div>
          {/* 4. NOVO CAMPO DE CATEGORIA */}
          <div className="form-field-group">
            <IonItem>
              <IonLabel>Categoria</IonLabel>
              <IonSelect
                value={selectedCategoryId}
                placeholder="Selecione (Opcional)"
                onIonChange={handleCategoryChange}
              >
                {incomeCategories.map(cat => (
                  <IonSelectOption key={cat.id} value={cat.id}>{cat.name}</IonSelectOption>
                ))}
                <IonSelectOption value="add_new" style={{ color: 'var(--ion-color-primary)' }}>
                  + Adicionar Categoria
                </IonSelectOption>
              </IonSelect>
            </IonItem>
          </div>
          <div className="form-field-group">
            <CurrencyInput label="Valor (R$)" value={amount} onValueChange={setAmount} />
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
          <ActionButton onClick={handleSaveIncome} expand="block" color="primary">
            {editingIncome ? 'Salvar Alterações' : 'Salvar Renda'}
          </ActionButton>
        </AppModal>

        <IonModal keepContentsMounted={true}>
          <IonDatetime id="datetime-in-modal" value={date} onIonChange={e => { const value = e.detail.value; if (typeof value === 'string') { setDate(value); } }} presentation="date" />
        </IonModal>

        <ActionAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={'Confirmar Exclusão'}
          message={'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.'}
          onConfirm={confirmDelete}
          confirmButtonText="Excluir"
        />
        
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={incomeToAction?.description}
          buttons={[
            { text: 'Editar', icon: pencil, handler: handleEditClick, cssClass: 'action-sheet-edit' },
            { text: 'Excluir', role: 'destructive', icon: trash, handler: handleDeleteClick },
            { text: 'Cancelar', icon: close, role: 'cancel' }
          ]}
        />

        <ExportDataModal
          isOpen={showExportModal}
          onDidDismiss={() => setShowExportModal(false)}
        />

        {/* Alerta para adicionar nova categoria */}
        <IonAlert
          isOpen={showAddCategoryAlert}
          onDidDismiss={() => setShowAddCategoryAlert(false)}
          header={'Nova Categoria de Renda'}
          message={'Digite o nome da nova categoria.'}
          inputs={[{ name: 'categoryName', type: 'text', placeholder: 'Ex: Freelance' }]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { 
              text: 'Salvar', 
              handler: (data) => {
                if (data.categoryName) {
                  addIncomeCategory(data.categoryName);
                }
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Renda;