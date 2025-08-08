import React, { useState, useMemo } from 'react';
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
  IonListHeader,
  IonInput,
} from '@ionic/react';

// 1. Importa todos os componentes e hooks necessários
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import PeriodSelector, { Period } from '../components/PeriodSelector';
import CategorySummaryList from '../components/CategorySummaryList';
import GoalsBarChart from '../components/GoalsBarChart';

import { useSpendingGoals } from '../hooks/useSpendingGoals';
import { useCategories, Category } from '../hooks/useCategories';
import { useCategorySummary } from '../hooks/useCategorySummary';

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const DefinirMetasPage: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // 2. A chamada ao hook useSpendingGoals agora passa o período
  const { goals, loading: goalsLoading, setGoal } = useSpendingGoals(activePeriod?.value ?? null);
  
  // Os outros hooks continuam a funcionar da mesma forma
  const { summaryList, loading: summaryLoading } = useCategorySummary(activePeriod);
  const { availableCategories: categories, loading: categoriesLoading } = useCategories();

  const loading = summaryLoading || goalsLoading || categoriesLoading;

  // 3. A lógica para combinar os dados é a mesma
  const summaryWithGoals = useMemo(() => {
    if (loading) return [];
    
    return summaryList.map(summaryItem => {
      const category = categories.find(c => c.name === summaryItem.name);
      const goal = category ? goals.find(g => g.categoryId === category.id) : undefined;
      
      return {
        ...summaryItem,
        goalAmount: goal?.amount,
      };
    });
  }, [summaryList, goals, categories, loading]);

  // Funções de manipulação para o input do modal - CORRIGIDAS
  const formatForInput = (val?: number) => {
    if (val === undefined || val === null) return '';
    return val.toFixed(2).replace('.', ',');
  };

  const openGoalModal = (category: Category) => {
    const goal = goals.find(g => g.categoryId === category.id);
    setSelectedCategory(category);
    setDisplayValue(formatForInput(goal?.amount));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setDisplayValue('');
  };

  // FUNÇÃO CORRIGIDA - mais permissiva e robusta
  const handleInputChange = (e: CustomEvent) => {
    let input = e.detail.value || '';
    
    // Remove caracteres que não são números ou vírgula
    input = input.replace(/[^0-9,]/g, '');
    
    // Permite apenas uma vírgula
    const commaCount = (input.match(/,/g) || []).length;
    if (commaCount > 1) {
      // Remove vírgulas extras, mantendo apenas a primeira
      const firstCommaIndex = input.indexOf(',');
      input = input.slice(0, firstCommaIndex + 1) + input.slice(firstCommaIndex + 1).replace(/,/g, '');
    }
    
    // Limita a 2 casas decimais após a vírgula
    const parts = input.split(',');
    if (parts.length === 2 && parts[1].length > 2) {
      input = parts[0] + ',' + parts[1].slice(0, 2);
    }
    
    // Evita começar com vírgula
    if (input.startsWith(',')) {
      input = '0' + input;
    }
    
    setDisplayValue(input);
  };

  const handleSaveGoal = async () => {
    if (!selectedCategory || isSaving) return;
    setIsSaving(true);
    try {
      // Limpa e converte o valor
      const cleaned = displayValue.replace(/[^0-9,]/g, '').replace(',', '.');
      const amount = parseFloat(cleaned) || 0;
      
      // Valida se o valor é válido
      if (amount < 0) {
        console.error("Valor não pode ser negativo");
        return;
      }
      
      await setGoal(selectedCategory.id, amount);
    } catch (error) {
      console.error("Erro ao salvar a meta:", error);
    } finally {
      setIsSaving(false);
      closeModal();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Metas de Gastos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '0 16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <PeriodSelector onPeriodChange={setActivePeriod} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <IonSpinner />
          </div>
        ) : (
          <>
            <GoalsBarChart summary={summaryWithGoals} />
            <CategorySummaryList summary={summaryWithGoals.filter(item => item.goalAmount && item.goalAmount > 0)} />

            <IonListHeader>
              <IonLabel color="primary">
                <h2>Definir / Editar Metas</h2>
              </IonLabel>
            </IonListHeader>
            <IonList inset={true}>
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
          </>
        )}

        <AppModal
          title={`Meta para ${selectedCategory?.name || ''}`}
          isOpen={isModalOpen}
          onDidDismiss={closeModal}
        >
          <IonItem>
            <IonLabel position="stacked">Valor da Meta (R$)</IonLabel>
            <IonInput
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              value={displayValue}
              onIonInput={handleInputChange}  // MUDANÇA: usar onIonInput em vez de onIonChange
              clearInput
            />
          </IonItem>
          <ActionButton onClick={handleSaveGoal} fill="solid" disabled={isSaving}>
            {isSaving ? <IonSpinner name="crescent" /> : 'Confirmar'}
          </ActionButton>
        </AppModal>
      </IonContent>
    </IonPage>
  );
};

export default DefinirMetasPage;