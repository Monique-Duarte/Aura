import React, { useState } from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonAlert } from '@ionic/react';
import { useCategories, Category } from '../hooks/useCategories';

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selectedCategories, onCategoryChange }) => {
  const { availableCategories, addCategory } = useCategories();
  const [showNewCategoryAlert, setShowNewCategoryAlert] = useState(false);

  const handleSelectionChange = (e: CustomEvent) => {
    const selected: string[] = e.detail.value;
    if (selected.includes('__CREATE_NEW__')) {
      setShowNewCategoryAlert(true);
      onCategoryChange(selected.filter(cat => cat !== '__CREATE_NEW__'));
    } else {
      onCategoryChange(selected);
    }
  };

  const handleCreateCategory = async (categoryName: string) => {
    if (categoryName && categoryName.trim()) {
      await addCategory(categoryName.trim(), '#cccccc');
      if (!selectedCategories.includes(categoryName.trim())) {
        onCategoryChange([...selectedCategories, categoryName.trim()]);
      }
    }
  };

  return (
    <>
      <IonItem>
        <IonLabel className='label' position="floating">Categorias</IonLabel>
        <IonSelect
          value={selectedCategories}
          multiple={true}
          cancelText="Cancelar"
          okText="Ok"
          onIonChange={handleSelectionChange}
          placeholder="Selecione uma ou mais"
        >
          {availableCategories.map((cat: Category) => (
            <IonSelectOption key={cat.id} value={cat.name}>{cat.name}</IonSelectOption>
          ))}
          <IonSelectOption value="__CREATE_NEW__">➕ Criar nova categoria...</IonSelectOption>
        </IonSelect>
      </IonItem>

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
    </>
  );
};

export default CategorySelector;