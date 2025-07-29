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
  IonList,
  IonSpinner,
  IonListHeader,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/react';
import { add, pencil, trash } from 'ionicons/icons';
import { useCategories, Category } from '../hooks/useCategories';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';
import '../styles/Configuracao.css';
import '../theme/variables.css';

const Configuracao: React.FC = () => {
  const { 
    defaultCategories, 
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
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('#ffffff');
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color);
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

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
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
            <IonList>
              <IonListHeader>Categorias Padrão</IonListHeader>
              {defaultCategories.map(cat => (
                <IonItem key={cat.id} lines="inset">
                  <div className="category-color-dot" style={{ backgroundColor: cat.color }}></div>
                  <IonLabel>{cat.name}</IonLabel>
                </IonItem>
              ))}
            </IonList>

            <IonList style={{ marginTop: '24px' }}>
              <IonListHeader>Minhas Categorias</IonListHeader>
              {userCategories.map(cat => (
                <IonItemSliding key={cat.id}>
                  <IonItem lines="inset">
                    <div className="category-color-dot" style={{ backgroundColor: cat.color }}></div>
                    <IonLabel>{cat.name}</IonLabel>
                  </IonItem>
                  <IonItemOptions side="end">
                    <IonItemOption onClick={() => openEditModal(cat)}>
                      <IonIcon slot="icon-only" icon={pencil} />
                    </IonItemOption>
                    <IonItemOption color="danger" onClick={() => handleDeleteClick(cat)}>
                      <IonIcon slot="icon-only" icon={trash} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))}
            </IonList>
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
                value={categoryColor} 
                onChange={e => setCategoryColor(e.target.value)}
              />
            </div>
          </IonItem>
          <ActionButton onClick={handleSaveCategory}>
            {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
          </ActionButton>
        </AppModal>

        <ActionAlert
          isOpen={!!categoryToDelete}
          onDidDismiss={() => setCategoryToDelete(null)}
          header="Confirmar Exclusão"
          message={`Tem a certeza que deseja excluir a categoria "${categoryToDelete?.name}"?`}
          onConfirm={confirmDelete}
          confirmButtonText="Excluir"
        />
      </IonContent>
    </IonPage>
  );
};

export default Configuracao;