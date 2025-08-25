import React, { useState } from 'react';
import {
  IonFab, IonFabButton, IonIcon, IonInput, IonItem, IonLabel,
  IonSpinner, IonListHeader, IonActionSheet, IonNote, IonList,
  IonToast, IonItemDivider, IonSegment, IonSegmentButton
} from '@ionic/react';
import { add, pencil, trash, close, logoGoogle, eyedropOutline } from 'ionicons/icons';
import { HexColorPicker } from 'react-colorful';
import { useAuth } from '../hooks/AuthContext';
import { authService } from '../service/auth.service';
import PageLayout from '../components/PageLayout';
import { useCategories, Category as ExpenseCategory } from '../hooks/useCategories';
import { useIncomeCategories, IncomeCategory } from '../hooks/useIncomeCategories';
import { getAuth, deleteUser } from 'firebase/auth';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';
import '../styles/Configuracao.css';

const PREDEFINED_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#F7B2AD', 
  '#8A63D2', '#2E933C', '#F4A261', '#E76F51', '#2A9D8F',
  '#E9C46A', '#fefae0'
];

const Configuracao: React.FC = () => {
  const { user } = useAuth(); 
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const { 
    visibleCategories: expenseCategories,
    hiddenCategories: hiddenExpenseCategories,
    loading: expenseLoading, 
    addCategory: addExpenseCategory, 
    updateCategory: updateExpenseCategory, 
    hideOrDeleteCategory: deleteExpenseCategory,
    reEnableCategory: reEnableExpenseCategory
  } = useCategories();

  const {
    visibleCategories: incomeCategories,
    hiddenCategories: hiddenIncomeCategories,
    loading: incomeLoading,
    addCategory: addIncomeCategory,
    updateCategory: updateIncomeCategory,
    hideOrDeleteCategory: deleteIncomeCategory,
    reEnableCategory: reEnableIncomeCategory
  } = useIncomeCategories();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | IncomeCategory | null>(null);
  const [categoryType, setCategoryType] = useState<'expense' | 'income' | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#FF6B6B');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [categoryToAction, setCategoryToAction] = useState<ExpenseCategory | IncomeCategory | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState(false);
  const [showCategoryActionSheet, setShowCategoryActionSheet] = useState(false);
  const [showAddActionSheet, setShowAddActionSheet] = useState(false);
  const [categoryView, setCategoryView] = useState<'visible' | 'hidden'>('visible');

  const loading = expenseLoading || incomeLoading;

  const openAddModal = (type: 'expense' | 'income') => {
    setEditingCategory(null);
    setCategoryType(type);
    setCategoryName('');
    setCategoryColor('#FF6B6B');
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!categoryToAction) return;
    setEditingCategory(categoryToAction);
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

  const handleSaveCategory = async () => {
    if (!categoryName) return;
    if (editingCategory && editingCategory.isDefault) {
      if (categoryType === 'expense') { await addExpenseCategory(categoryName, categoryColor); } 
      else if (categoryType === 'income') { await addIncomeCategory(categoryName); }
    } else if (editingCategory) {
      if (categoryType === 'expense') { await updateExpenseCategory(editingCategory.id, categoryName, categoryColor); } 
      else if (categoryType === 'income') { await updateIncomeCategory(editingCategory.id, categoryName); }
    } else {
      if (categoryType === 'expense') { await addExpenseCategory(categoryName, categoryColor); } 
      else if (categoryType === 'income') { await addIncomeCategory(categoryName); }
    }
    setShowModal(false);
  };

  const handleDeleteClick = () => {
    if (!categoryToAction) return;
    setShowDeleteAlert(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToAction) {
      if ('color' in categoryToAction) {
        await deleteExpenseCategory(categoryToAction as ExpenseCategory);
      } else {
        await deleteIncomeCategory(categoryToAction as IncomeCategory);
      }
      setCategoryToAction(null);
    }
    setShowDeleteAlert(false);
  };

  const handleReEnableCategory = async () => {
    if (categoryToAction) {
      if ('color' in categoryToAction) {
        await reEnableExpenseCategory(categoryToAction as ExpenseCategory);
      } else {
        await reEnableIncomeCategory(categoryToAction as IncomeCategory);
      }
    }
    setShowCategoryActionSheet(false);
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

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    setLinkError('');
    try {
      const result = await authService.linkGoogleAccount();
      if (result.success) {
        setShowToast(true);
      } else {
        setLinkError(result.error || 'Falha ao vincular conta.');
      }
    } catch (error) {
      console.error("Falha inesperada ao vincular conta:", error);
      setLinkError('Ocorreu um erro inesperado.');
    } finally {
      setIsLinking(false);
    }
  };

  const isEmailUser = user?.providerData.some(p => p.providerId === 'password');
  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com');
  const showLinkButton = isEmailUser && !isGoogleUser;

  return (
    <PageLayout pageTitle="Configurações">
      {loading ? ( <div className="spinner-container"><IonSpinner /></div> ) : (
        <>
          <IonListHeader>Gerenciamento da Conta</IonListHeader>
          <IonList inset={true}>
            <IonItem>
              <IonIcon icon={logoGoogle} slot="start" />
              <IonLabel>Login com Google</IonLabel>
              {showLinkButton && (
                <ActionButton onClick={handleLinkGoogle} disabled={isLinking} slot="end">
                  {isLinking ? <IonSpinner name="crescent" /> : 'Vincular'}
                </ActionButton>
              )}
              {isGoogleUser && (
                <IonNote slot="end" color="success">Vinculado</IonNote>
              )}
            </IonItem>
            {linkError && (
              <IonItem lines="none">
                  <IonLabel color="danger" className="ion-text-wrap ion-text-center">{linkError}</IonLabel>
              </IonItem>
            )}
            <IonItem button={true} detail={false} onClick={() => setShowDeleteAccountAlert(true)} lines="none" className="delete-account-item">
              <IonIcon icon={trash} slot="start" color="danger" />
              <IonLabel color="danger">Excluir minha conta</IonLabel>
            </IonItem>
          </IonList>

          <IonListHeader>Personalização</IonListHeader>
          
          <div className="ion-padding-horizontal">
            <IonSegment 
              value={categoryView} 
              onIonChange={e => setCategoryView(e.detail.value as 'visible' | 'hidden')}>
              <IonSegmentButton value="visible">
                <IonLabel>Visíveis</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="hidden">
                <IonLabel>Ocultadas</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          <IonList inset={true}>
            <IonItemDivider>
              <IonLabel>Categorias de Despesa</IonLabel>
              <IonNote slot="end">Toque para opções</IonNote>
            </IonItemDivider>
            <div className="category-grid-wrapper">
              {categoryView === 'visible' ? (
                expenseCategories.length > 0 ? (
                  <div className="category-grid">
                    {expenseCategories.map(cat => (
                      <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                        <div className="category-color-dot" style={{ backgroundColor: cat.color }}></div>
                        <IonLabel>{cat.name}</IonLabel>
                      </div>
                    ))}
                  </div>
                ) : <IonNote className="empty-note">Nenhuma categoria visível.</IonNote>
              ) : (
                hiddenExpenseCategories.length > 0 ? (
                  <div className="category-grid">
                    {hiddenExpenseCategories.map(cat => (
                      <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                        <div className="category-color-dot" style={{ backgroundColor: cat.color }}></div>
                        <IonLabel>{cat.name}</IonLabel>
                      </div>
                    ))}
                  </div>
                ) : <IonNote className="empty-note">Nenhuma categoria ocultada.</IonNote>
              )}
            </div>

            <IonItemDivider>
              <IonLabel>Categorias de Renda</IonLabel>
              <IonNote slot="end">Toque para opções</IonNote>
            </IonItemDivider>
            <div className="category-grid-wrapper">
              {categoryView === 'visible' ? (
                incomeCategories.length > 0 ? (
                  <div className="category-grid">
                    {incomeCategories.map(cat => (
                      <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                        <IonLabel>{cat.name}</IonLabel>
                      </div>
                    ))}
                  </div>
                ) : <IonNote className="empty-note">Nenhuma categoria de renda visível.</IonNote>
              ) : (
                hiddenIncomeCategories.length > 0 ? (
                  <div className="category-grid">
                    {hiddenIncomeCategories.map(cat => (
                      <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                        <IonLabel>{cat.name}</IonLabel>
                      </div>
                    ))}
                  </div>
                ) : <IonNote className="empty-note">Nenhuma categoria de renda ocultada.</IonNote>
              )}
            </div>
          </IonList>
        </>
      )}

      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={() => setShowAddActionSheet(true)}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      <AppModal
        title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
        isOpen={showModal}
        onDidDismiss={() => {
        setShowModal(false);
        setShowCustomPicker(false); 
      }}
      >
        <IonItem>
          <IonLabel position="floating">Nome da Categoria</IonLabel>
          <IonInput value={categoryName} onIonChange={e => setCategoryName(e.detail.value!)} />
        </IonItem>
        {categoryType === 'expense' && (
        <div className="color-picker-container">
          <IonLabel>Cor</IonLabel>
          {showCustomPicker ? (
          <div className="custom-picker-wrapper">
            <HexColorPicker color={categoryColor} onChange={setCategoryColor} />
            <ActionButton fill="clear" onClick={() => setShowCustomPicker(false)}>
              Voltar para a paleta
            </ActionButton>
          </div>
        ) : (
          <div className="color-swatch-grid">
            {PREDEFINED_COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={`color-swatch ${categoryColor.toUpperCase() === color.toUpperCase() ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setCategoryColor(color)}
              />
            ))}
            <button
              type="button"
              className="color-swatch custom"
              onClick={() => setShowCustomPicker(true)} 
            >
              <IonIcon icon={eyedropOutline} />
            </button>
          </div>
        )}
        </div>
      )}
        <ActionButton onClick={handleSaveCategory} expand="block" color="primary">
          {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
        </ActionButton>
      </AppModal>

      <ActionAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setCategoryToAction(null)}
        header="Confirmar Ação"
        message={`Tem certeza que deseja ${categoryToAction?.isDefault ? 'ocultar' : 'excluir'} a categoria "${categoryToAction?.name}"?`}
        onConfirm={confirmDeleteCategory}
        confirmButtonText={categoryToAction?.isDefault ? 'Ocultar' : 'Excluir'}
      />
      <ActionAlert
        isOpen={showDeleteAccountAlert}
        onDidDismiss={() => setShowDeleteAccountAlert(false)}
        header="Excluir Conta Permanentemente"
        message="Tem a certeza ABSOLUTA? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteAccount}
        confirmButtonText="Sim, Excluir Tudo"
      />

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
          ...(categoryView === 'hidden' ? 
            [{ text: 'Reabilitar Categoria', handler: handleReEnableCategory }] 
            : []),
          ...(categoryView === 'visible' ?
            [
              { text: 'Editar', icon: pencil, handler: openEditModal },
              { 
                text: categoryToAction?.isDefault ? 'Ocultar' : 'Excluir',
                role: 'destructive',
                icon: trash,
                handler: handleDeleteClick
              }
            ]
            : []),
          { text: 'Cancelar', icon: close, role: 'cancel' }
        ]}
      />
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message="Conta do Google vinculada com sucesso!"
        duration={3000}
        color="success"
      />
    </PageLayout>
  );
};

export default Configuracao;