import React, { useState, useRef } from 'react';
import {
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
  IonList,
  IonToast,
  IonItemDivider,
} from '@ionic/react';
import { add, pencil, trash, close, logoGoogle, eyedropOutline } from 'ionicons/icons';
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

// Nossa paleta de cores customizada
const PREDEFINED_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#F7B2AD', 
  '#8A63D2', '#2E933C', '#F4A261', '#E76F51', '#2A9D8F',
  '#E9C46A', '#fefae0'
];

const Configuracao: React.FC = () => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth(); 
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [showToast, setShowToast] = useState(false);

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
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | IncomeCategory | null>(null);
  const [categoryType, setCategoryType] = useState<'expense' | 'income' | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#FF6B6B');
  const [categoryToAction, setCategoryToAction] = useState<ExpenseCategory | IncomeCategory | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState(false);
  const [showCategoryActionSheet, setShowCategoryActionSheet] = useState(false);
  const [showAddActionSheet, setShowAddActionSheet] = useState(false);

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
    if (editingCategory) {
      if (categoryType === 'expense') {
        await updateExpenseCategory(editingCategory.id, categoryName, categoryColor);
      } else {
        await updateIncomeCategory(editingCategory.id, categoryName);
      }
    } else {
      if (categoryType === 'expense') {
        await addExpenseCategory(categoryName, categoryColor);
      } else {
        await addIncomeCategory(categoryName);
      }
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

  const isCustomColorSelected = !PREDEFINED_COLORS.map(c => c.toUpperCase()).includes(categoryColor.toUpperCase());

  return (
    // 2. Usamos o PageLayout, passando o título da página
    <PageLayout pageTitle="Configurações">
      {/* 3. Todo o conteúdo que antes ficava dentro do <IonContent> agora fica aqui */}
      {loading ? (
        <div className="spinner-container"><IonSpinner /></div>
      ) : (
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
          <IonList inset={true}>
            <IonItemDivider>
              <IonLabel>Categorias de Despesa</IonLabel>
              <IonNote slot="end">Toque para editar</IonNote>
            </IonItemDivider>
            <div className="category-grid-wrapper">
              {expenseCategories.length > 0 ? (
                <div className="category-grid">
                  {expenseCategories.map(cat => (
                    <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                      <div className="category-color-dot" style={{ backgroundColor: cat.color }}></div>
                      <IonLabel>{cat.name}</IonLabel>
                    </div>
                  ))}
                </div>
              ) : <IonNote className="empty-note">Nenhuma categoria de despesa adicionada.</IonNote>}
            </div>

            <IonItemDivider>
              <IonLabel>Categorias de Renda</IonLabel>
              <IonNote slot="end">Toque para editar</IonNote>
            </IonItemDivider>
            <div className="category-grid-wrapper">
              {incomeCategories.length > 0 ? (
                <div className="category-grid">
                  {incomeCategories.map(cat => (
                    <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                      <IonLabel>{cat.name}</IonLabel>
                    </div>
                  ))}
                </div>
              ) : <IonNote className="empty-note">Nenhuma categoria de renda adicionada.</IonNote>}
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
        onDidDismiss={() => setShowModal(false)}
      >
        <IonItem>
          <IonLabel position="floating">Nome da Categoria</IonLabel>
          <IonInput value={categoryName} onIonChange={e => setCategoryName(e.detail.value!)} />
        </IonItem>
        {categoryType === 'expense' && (
          <div className="color-picker-container">
            <IonLabel>Cor</IonLabel>
            <input 
              ref={colorInputRef}
              type="color" 
              value={categoryColor} 
              onChange={e => setCategoryColor(e.target.value)}
              style={{ display: 'none' }}
            />
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
              
              {isCustomColorSelected && (
                <button
                  type="button"
                  className="color-swatch selected"
                  style={{ backgroundColor: categoryColor }}
                  onClick={() => colorInputRef.current?.click()}
                />
              )}

              <button
                type="button"
                className="color-swatch custom"
                onClick={() => colorInputRef.current?.click()}
              >
                <IonIcon icon={eyedropOutline} />
              </button>
            </div>
          </div>
        )}
        <ActionButton onClick={handleSaveCategory} expand="block" color="primary">
          {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
        </ActionButton>
      </AppModal>

      <ActionAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setCategoryToAction(null)}
        header="Confirmar Exclusão"
        message={`Tem a certeza que deseja excluir la categoria "${categoryToAction?.name}"?`}
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