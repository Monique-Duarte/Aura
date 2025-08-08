import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonSpinner,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonInput
} from '@ionic/react';

// 1. Importa os seus componentes reutilizáveis
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import PeriodSelector, { Period } from '../components/PeriodSelector';

// Importa os hooks necessários
import { useSpendingGoals } from '../hooks/useSpendingGoals';
import { useCategories, Category } from '../hooks/useCategories';

// Função auxiliar para formatar os valores como moeda
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) {
    return 'R$ 0,00';
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const DefinirMetasPage: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const { goals, loading: goalsLoading, setGoal } = useSpendingGoals(activePeriod?.value ?? null);
  const { availableCategories: categories, loading: categoriesLoading } = useCategories();

  // 2. Estados para controlar o modal, o valor do input e o estado de "a salvar"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [displayValue, setDisplayValue] = useState('');
  const [isSaving, setIsSaving] = useState(false); // << NOVO ESTADO

  const isLoading = goalsLoading || categoriesLoading;

  // Função para formatar um número para o formato de texto "123,45"
  const formatForInput = (val?: number) => {
    if (val === undefined || val === null) return '';
    return val.toFixed(2).replace('.', ',');
  };

  // Função para abrir o modal e preparar o valor inicial do input
  const openGoalModal = (category: Category) => {
    const goal = goals.find(g => g.categoryId === category.id);
    setSelectedCategory(category);
    setDisplayValue(formatForInput(goal?.amount));
    setIsModalOpen(true);
  };

  // Função para validar a entrada do utilizador
  const handleInputChange = (e: CustomEvent) => {
    const input = e.detail.value || '';
    const regex = /^[0-9]*[,]?[0-9]{0,2}$/;
    if (regex.test(input)) {
      setDisplayValue(input);
    }
  };

  // 3. Função para salvar a meta foi melhorada para ser assíncrona e mais robusta
  const handleSaveGoal = async () => {
    if (!selectedCategory || isSaving) return;

    setIsSaving(true);
    try {
      const cleaned = displayValue.replace(/[^0-9,]/g, '').replace(',', '.');
      const amount = parseFloat(cleaned) || 0;
      await setGoal(selectedCategory.id, amount); // Espera a conclusão
    } catch (error) {
      console.error("Erro ao salvar a meta:", error);
      // Aqui você poderia usar o seu componente ActionAlert para notificar o utilizador
    } finally {
      setIsSaving(false); // Para o spinner
      setIsModalOpen(false); // Fecha o modal
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Definir Metas de Gastos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '0 16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <PeriodSelector onPeriodChange={setActivePeriod} />
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <IonSpinner />
          </div>
        ) : (
          <IonList inset={true} style={{ marginTop: '16px' }}>
            {categories.map((category: Category) => {
              const goal = goals.find(g => g.categoryId === category.id);
              return (
                <IonItem key={category.id} button={true} detail={true} onClick={() => openGoalModal(category)}>
                  <IonLabel>{category.name}</IonLabel>
                  <IonNote slot="end" color={goal?.amount ? 'primary' : 'medium'}>
                    {formatCurrency(goal?.amount)}
                  </IonNote>
                </IonItem>
              );
            })}
          </IonList>
        )}

        <AppModal
          title={`Meta para ${selectedCategory?.name || ''}`}
          isOpen={isModalOpen}
          onDidDismiss={() => setIsModalOpen(false)}
        >
          <IonItem>
            <IonLabel position="stacked">Valor da Meta (R$)</IonLabel>
            <IonInput
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              value={displayValue}
              onIonChange={handleInputChange}
              clearInput
            />
          </IonItem>
          {/* 4. O botão agora mostra um spinner e é desabilitado enquanto salva */}
          <ActionButton onClick={handleSaveGoal} fill="solid" disabled={isSaving}>
            {isSaving ? <IonSpinner name="crescent" /> : 'Confirmar'}
          </ActionButton>
        </AppModal>
      </IonContent>
    </IonPage>
  );
};

export default DefinirMetasPage;
