import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  IonFab, IonFabButton, IonIcon, IonItem, IonLabel, IonList, IonDatetime,
  IonToggle, IonText, IonSpinner, IonDatetimeButton, IonActionSheet, IonModal, IonButton,
  IonSelect, IonSelectOption, IonAlert, IonButtons, IonInput,
} from '@ionic/react';
import { add, close, pencil, trash, downloadOutline } from 'ionicons/icons';
import { useAuth } from '../../../app/providers/AuthContext';
import { getFirestore, collection, addDoc, query, where, Timestamp, doc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { app } from '../../../firebaseConfig';
import AppModal from '../../../shared/components/AppModal';
import ActionButton from '../../../shared/components/ActionButton';
import ActionAlert from '../../../shared/components/ActionAlert';
import ExportDataModal from '../../../components/ExportDataModal';
import CurrencyInput from '../../../shared/components/CurrencyInput';
import { useIncomeCategories } from '../../categories/hooks/useIncomeCategories';
import '../../../shared/styles/Lancamentos.css';
import PageLayout from '../../../shared/components/PageLayout';
import PeriodSelector from '../../../shared/components/PeriodSelector';
import { useIncomeForm } from '../hooks/useIncomeForm';
import { Transaction } from '../../../shared/types/types'; // Importamos o tipo principal

// --- Interfaces ---
interface Period {
  startDate: Date;
  endDate: Date;
}

// CORREÇÃO: Nossa interface local agora estende a Transaction e define o tipo e a data corretamente
interface IncomeTransaction extends Omit<Transaction, 'date' | 'type'> {
  id: string;
  type: 'income';
  date: Date;
}


const Renda: React.FC = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const { visibleCategories: incomeCategories, addCategory: addIncomeCategory } = useIncomeCategories();

  // Usando o novo hook
  const { formState, handleInputChange, setFormForEditing, resetForm } = useIncomeForm();

  // Estados de controle da UI
  const [editingIncome, setEditingIncome] = useState<IncomeTransaction | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [incomeToAction, setIncomeToAction] = useState<IncomeTransaction | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [showAddCategoryAlert, setShowAddCategoryAlert] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const modal = useRef<HTMLIonModalElement>(null);

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

  const handleSaveIncome = async () => {
    if (!user || !formState.amount || !formState.description) return;
    const db = getFirestore(app);
    const dataToSave = {
      amount: Math.abs(formState.amount),
      description: formState.description,
      date: Timestamp.fromDate(new Date(formState.date)),
      isRecurring: formState.isRecurring,
      // Se uma categoria for selecionada, salve-a como um array de uma posição
      categories: formState.selectedCategoryId ? [formState.selectedCategoryId] : [],
      ...(formState.isRecurring && { recurringDay: new Date(formState.date).getDate() }),
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
    setFormForEditing(incomeToAction);
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
    resetForm();
  };

  const handleCategoryChange = (e: CustomEvent) => {
    const value = e.detail.value;
    if (value === 'add_new') {
      setShowAddCategoryAlert(true);
    } else {
      handleInputChange('selectedCategoryId', value);
    }
  };

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);

  return (
    <PageLayout
      pageTitle="Renda"
      headerActionButtons={
        <IonButtons slot="end">
          <IonButton onClick={() => setShowExportModal(true)}>
            <IonIcon slot="icon-only" icon={downloadOutline} />
          </IonButton>
        </IonButtons>
      }
    >
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
            const category = income.categories && income.categories.length > 0
              ? incomeCategories.find(c => c.id === income.categories![0])
              : null;
            return (
              <IonItem key={income.id} lines="inset" button onClick={() => handleItemClick(income)}>
                <IonLabel>
                  <h2>{income.description}</h2>
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
        <IonFabButton onClick={() => { setEditingIncome(null); resetForm(); setShowModal(true); }}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      <AppModal
        title={editingIncome ? 'Editar Renda' : 'Nova Renda'}
        isOpen={showModal}
        onClose={closeModalAndReset}
      >
        <div className="form-field-group">
          <IonItem>
            <IonLabel position="floating">Descrição</IonLabel>
            <IonInput value={formState.description} onIonChange={e => handleInputChange('description', e.detail.value!)} placeholder="Ex: Salário, Freelance" />
          </IonItem>
        </div>
        <div className="form-field-group">
          <IonItem>
            <IonLabel>Categoria</IonLabel>
            <IonSelect
              value={formState.selectedCategoryId}
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
          <CurrencyInput label="Valor (R$)" value={formState.amount} onValueChange={(value) => handleInputChange('amount', value)} />
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
            <IonToggle checked={formState.isRecurring} onIonChange={e => handleInputChange('isRecurring', e.detail.checked)} />
          </IonItem>
        </div>
        <ActionButton onClick={handleSaveIncome} expand="block" color="primary">
          {editingIncome ? 'Salvar Alterações' : 'Salvar Renda'}
        </ActionButton>
      </AppModal>

      <IonModal ref={modal} keepContentsMounted={true}>
        <IonDatetime id="datetime-in-modal" value={formState.date} onIonChange={e => handleInputChange('date', e.detail.value as string)} presentation="date" />
      </IonModal>

      <ActionAlert
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
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
        onClose={() => setShowExportModal(false)}
      />

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
    </PageLayout>
  );
};

export default Renda;