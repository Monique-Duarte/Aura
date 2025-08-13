import React, { useState } from 'react';
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
  IonSpinner,
  IonListHeader,
  IonActionSheet,
  IonNote,
} from '@ionic/react';
import { add, pencil, trash, warningOutline, close } from 'ionicons/icons';
import { useCategories, Category as ExpenseCategory } from '../hooks/useCategories';
import { useIncomeCategories, IncomeCategory } from '../hooks/useIncomeCategories';
import { getAuth, deleteUser } from 'firebase/auth';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';
import '../styles/Configuracao.css';

const Configuracao: React.FC = () => {
  const { 
    userCategories: expenseCategories, 
    loading: expenseLoading, 
    addCategory: addExpenseCategory, 
    updateCategory: updateExpenseCategory, 
    deleteCategory: deleteExpenseCategory 
  } = useCategories();

  const {
    categories: incomeCategories,
    loading: incomeLoading,
    addCategory: addIncomeCategory,
    updateCategory: updateIncomeCategory,
    deleteCategory: deleteIncomeCategory
  } = useIncomeCategories();

  // 3. Estados unificados para controlar os modais e ações
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | IncomeCategory | null>(null);
  const [categoryType, setCategoryType] = useState<'expense' | 'income' | null>(null);
  
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#ffffff');
  
  const [categoryToAction, setCategoryToAction] = useState<ExpenseCategory | IncomeCategory | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState(false);
  const [showCategoryActionSheet, setShowCategoryActionSheet] = useState(false);
  const [showAddActionSheet, setShowAddActionSheet] = useState(false);

  const loading = expenseLoading || incomeLoading;

  // Funções para abrir os modais
  const openAddModal = (type: 'expense' | 'income') => {
    setEditingCategory(null);
    setCategoryType(type);
    setCategoryName('');
    setCategoryColor('#ffffff');
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!categoryToAction) return;
    setEditingCategory(categoryToAction);
    // Verifica o tipo da categoria para saber se tem cor
    if ('color' in categoryToAction) {
      setCategoryType('expense');
      setCategoryName(categoryToAction.name);
      setCategoryColor(categoryToAction.color);
    } else {
      setCategoryType('income');
      setCategoryName(categoryToAction.name);
    }
    setShowModal(true);
  };

  // Função de salvar unificada
  const handleSaveCategory = async () => {
    if (!categoryName) return;

    if (editingCategory) { // Editando
      if (categoryType === 'expense') {
        await updateExpenseCategory(editingCategory.id, categoryName, categoryColor);
      } else {
        await updateIncomeCategory(editingCategory.id, categoryName);
      }
    } else { // Adicionando
      if (categoryType === 'expense') {
        await addExpenseCategory(categoryName, categoryColor);
      } else {
        await addIncomeCategory(categoryName);
      }
    }
    setShowModal(false);
  };

  // Funções de exclusão unificadas
  const handleDeleteClick = () => {
    if (!categoryToAction) return;
    setShowDeleteAlert(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToAction) {
      if ('color' in categoryToAction) {
        await deleteExpenseCategory(categoryToAction.id);
      } else {
        await deleteIncomeCategory(categoryToAction.id);
      }
      setCategoryToAction(null);
    }
    setShowDeleteAlert(false);
  };

  const confirmDeleteAccount = async () => {
    const authUser = getAuth().currentUser;
    if (authUser) {
      try {
        await deleteUser(authUser);
        window.location.href = '/login';
      } catch (error) {
        console.error("Erro ao excluir a conta:", error);
      }
    }
    setShowDeleteAccountAlert(false);
  };

  const handleCategoryClick = (category: ExpenseCategory | IncomeCategory) => {
    setCategoryToAction(category);
    setShowCategoryActionSheet(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Configurações</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div style={{ textAlign: 'center' }}><IonSpinner /></div>
        ) : (
          <>
            {/* 4. Secção para Categorias de Despesa */}
            <IonListHeader className="category-header">
              <IonLabel>Categorias de Despesa</IonLabel>
              <IonNote slot="end">Toque para editar</IonNote>
            </IonListHeader>
            <div className="category-grid">
              {expenseCategories.map(cat => (
                <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                  <div className="category-color-dot" style={{ backgroundColor: cat.color }}></div>
                  <IonLabel>{cat.name}</IonLabel>
                </div>
              ))}
            </div>

            {/* 5. NOVA Secção para Categorias de Renda */}
            <IonListHeader className="category-header">
              <IonLabel>Categorias de Renda</IonLabel>
              <IonNote slot="end">Toque para editar</IonNote>
            </IonListHeader>
            <div className="category-grid">
              {incomeCategories.map(cat => (
                <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                  {/* Sem o ponto de cor */}
                  <IonLabel>{cat.name}</IonLabel>
                </div>
              ))}
            </div>

            <div className="danger-zone">
              <h3>Zona de Perigo</h3>
              <p>A exclusão da sua conta é uma ação permanente e irá apagar o seu perfil de autenticação.</p>
              <ActionButton onClick={() => setShowDeleteAccountAlert(true)} fill="outline" color="danger">
                <IonIcon slot="start" icon={warningOutline} />
                Excluir Minha Conta
              </ActionButton>
            </div>
          </>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          {/* O FAB agora abre um menu de escolha */}
          <IonFabButton onClick={() => setShowAddActionSheet(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Modal unificado para adicionar/editar */}
        <AppModal
          title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          isOpen={showModal}
          onDidDismiss={() => setShowModal(false)}
        >
          <IonItem>
            <IonLabel position="floating">Nome da Categoria</IonLabel>
            <IonInput value={categoryName} onIonChange={e => setCategoryName(e.detail.value!)} />
          </IonItem>
          {/* O seletor de cor só aparece para categorias de despesa */}
          {categoryType === 'expense' && (
            <IonItem lines="none" className="color-picker-item">
              <IonLabel>Cor</IonLabel>
              <div className="color-input-wrapper">
                <input 
                  type="color" 
                  value={categoryColor} 
                  onChange={e => setCategoryColor(e.target.value)}
                />
                <input 
                  type="text" 
                  value={categoryColor.toUpperCase()} 
                  readOnly
                />
              </div>
            </IonItem>
          )}
          <ActionButton onClick={handleSaveCategory}>
            {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
          </ActionButton>
        </AppModal>

        <ActionAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setCategoryToAction(null)}
          header="Confirmar Exclusão"
          message={`Tem a certeza que deseja excluir a categoria "${categoryToAction?.name}"?`}
          onConfirm={confirmDeleteCategory}
          confirmButtonText="Excluir"
        />

        <ActionAlert
          isOpen={showDeleteAccountAlert}
          onDidDismiss={() => setShowDeleteAccountAlert(false)}
          header="Excluir Conta Permanentemente"
          message="Tem a certeza ABSOLUTA? Esta ação não pode ser desfeita."
          onConfirm={confirmDeleteAccount}
          confirmButtonText="Sim, Excluir Tudo"
        />
        
        {/* ActionSheet para escolher qual categoria adicionar */}
        <IonActionSheet
          isOpen={showAddActionSheet}
          onDidDismiss={() => setShowAddActionSheet(false)}
          header="Adicionar Nova Categoria"
          buttons={[
            { text: 'Categoria de Renda', handler: () => openAddModal('income') },
            { text: 'Categoria de Despesa', handler: () => openAddModal('expense') },
            { text: 'Cancelar', role: 'cancel' }
          ]}
        />

        <IonActionSheet
          isOpen={showCategoryActionSheet}
          onDidDismiss={() => setShowCategoryActionSheet(false)}
          header={categoryToAction?.name}
          buttons={[
            { text: 'Editar', icon: pencil, handler: openEditModal, cssClass: 'action-sheet-edit' },
            { text: 'Excluir', role: 'destructive', icon: trash, handler: handleDeleteClick },
            { text: 'Cancelar', icon: close, role: 'cancel' }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Configuracao;