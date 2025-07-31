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
  IonNote, // Adicionado para o subtítulo
} from '@ionic/react';
import { add, pencil, trash, warningOutline, close } from 'ionicons/icons';
import { useCategories, Category } from '../hooks/useCategories';
import { getAuth, deleteUser } from 'firebase/auth';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';
import '../styles/Configuracao.css';

const Configuracao: React.FC = () => {
  const { 
    userCategories, 
    loading, 
    addCategory, 
    updateCategory, 
    deleteCategory 
  } = useCategories();

  const [showModal, setShowModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#ffffff');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToAction, setCategoryToAction] = useState<Category | null>(null);
  const [showDeleteCategoryAlert, setShowDeleteCategoryAlert] = useState(false);
  const [showDeleteAccountAlert, setShowDeleteAccountAlert] = useState(false);
  const [showCategoryActionSheet, setShowCategoryActionSheet] = useState(false);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('#ffffff');
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!categoryToAction) return;
    setEditingCategory(categoryToAction);
    setCategoryName(categoryToAction.name);
    setCategoryColor(categoryToAction.color);
    setShowModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName) {
      alert("O nome da categoria é obrigatório.");
      return;
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryName, categoryColor);
    } else {
      await addCategory(categoryName, categoryColor);
    }
    setShowModal(false);
  };

  const handleDeleteClick = () => {
    if (!categoryToAction) return;
    setShowDeleteCategoryAlert(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToAction) {
      await deleteCategory(categoryToAction.id);
      setCategoryToAction(null);
    }
    setShowDeleteCategoryAlert(false);
  };

  const confirmDeleteAccount = async () => {
    const authUser = getAuth().currentUser;
    if (authUser) {
      try {
        // AVISO: Isto apaga o utilizador, mas não os seus dados no Firestore.
        // A exclusão completa de dados deve ser feita por uma Cloud Function no Firebase.
        await deleteUser(authUser);
        window.location.href = '/login';
      } catch (error) {
        console.error("Erro ao excluir a conta:", error);
        alert("Erro ao excluir a conta. Pode ser necessário fazer logout e login novamente.");
      }
    }
    setShowDeleteAccountAlert(false);
  };

  const handleCategoryClick = (category: Category) => {
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
            <IonListHeader className="category-header">
              <IonLabel>Minhas Categorias</IonLabel>
              <IonNote slot="end">Toque para editar</IonNote>
            </IonListHeader>

            <div className="category-grid">
              {userCategories.length > 0 ? userCategories.map(cat => (
                <div key={cat.id} className="category-grid-item" onClick={() => handleCategoryClick(cat)}>
                  <div className="category-color-dot" style={{ backgroundColor: cat.color }}></div>
                  <IonLabel>{cat.name}</IonLabel>
                </div>
              )) : (
                <IonItem lines="none" style={{ gridColumn: '1 / -1' }}>
                  <IonLabel color="medium" className="ion-text-center">
                    <p>Ainda não criou nenhuma categoria. Use o botão '+' para adicionar.</p>
                  </IonLabel>
                </IonItem>
              )}
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
          <IonFabButton onClick={openAddModal}>
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
                onChange={e => setCategoryColor(e.target.value)}
              />
            </div>
          </IonItem>
          <ActionButton onClick={handleSaveCategory}>
            {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
          </ActionButton>
        </AppModal>

        <ActionAlert
          isOpen={showDeleteCategoryAlert}
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
          message="Tem a certeza ABSOLUTA? Esta ação não pode ser desfeita. Todos os seus dados de autenticação serão apagados."
          onConfirm={confirmDeleteAccount}
          confirmButtonText="Sim, Excluir Tudo"
        />

        <IonActionSheet
          isOpen={showCategoryActionSheet}
          onDidDismiss={() => setShowCategoryActionSheet(false)}
          header={categoryToAction?.name}
          buttons={[
            {
              text: 'Editar',
              icon: pencil,
              handler: openEditModal,
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

export default Configuracao;