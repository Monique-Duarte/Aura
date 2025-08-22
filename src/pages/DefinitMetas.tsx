import React, { useState, useMemo, useEffect } from 'react';
import {
  IonSpinner,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonListHeader,
  IonInput,
} from '@ionic/react';

import PageLayout from '../components/PageLayout';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import PeriodSelector, { Period } from '../components/PeriodSelector';
import CategorySummaryList from '../components/CategorySummaryList';
import GoalsBarChart from '../components/GoalsBarChart';
import { scheduleSpendingGoalNotifications } from '../logic/notificationLogic';
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

  const { goals, loading: goalsLoading, setGoal } = useSpendingGoals(activePeriod?.value ?? null);
  const { summaryList, loading: summaryLoading } = useCategorySummary(activePeriod);
  const { availableCategories: categories, loading: categoriesLoading } = useCategories();

  const loading = summaryLoading || goalsLoading || categoriesLoading;

  const summaryWithGoals = useMemo(() => {
    if (loading) return [];
    
    return summaryList.map(summaryItem => {
      const category = categories.find(c => c.name === summaryItem.name);
      const goal = category ? goals.find(g => g.categoryId === category.id) : undefined;
      
      return {
        ...summaryItem,
        goalAmount: goal?.amount,
        categoryId: category?.id || '',
      };
    });
  }, [summaryList, goals, categories, loading]);

  useEffect(() => {
    if (!loading && activePeriod && summaryWithGoals.length > 0) {
      const periodInfo = {
        month: new Date(activePeriod.value).getMonth(),
        year: new Date(activePeriod.value).getFullYear(),
      };
      const summariesWithDefinedGoals = summaryWithGoals.filter(s => s.goalAmount && s.goalAmount > 0);
      
      scheduleSpendingGoalNotifications(summariesWithDefinedGoals, periodInfo);
    }
  }, [summaryWithGoals, loading, activePeriod]);

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

  const handleInputChange = (e: CustomEvent) => {
    let input = e.detail.value || '';
    input = input.replace(/[^0-9,]/g, '');
    
    const commaCount = (input.match(/,/g) || []).length;
    if (commaCount > 1) {
      const firstCommaIndex = input.indexOf(',');
      input = input.slice(0, firstCommaIndex + 1) + input.slice(firstCommaIndex + 1).replace(/,/g, '');
    }
    
    const parts = input.split(',');
    if (parts.length === 2 && parts[1].length > 2) {
      input = parts[0] + ',' + parts[1].slice(0, 2);
    }
    
    if (input.startsWith(',')) {
      input = '0' + input;
    }
    
    setDisplayValue(input);
  };

  const handleSaveGoal = async () => {
    if (!selectedCategory || isSaving) return;
    setIsSaving(true);
    try {
      const cleaned = displayValue.replace(/[^0-9,]/g, '').replace(',', '.');
      const amount = parseFloat(cleaned) || 0;
      
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
    <PageLayout pageTitle="Metas de Gastos">
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
            onIonInput={handleInputChange}
            clearInput
          />
        </IonItem>
        <ActionButton onClick={handleSaveGoal} fill="solid" disabled={isSaving} expand="block" color="primary">
          {isSaving ? <IonSpinner name="crescent" /> : 'Confirmar'}
        </ActionButton>
      </AppModal>
    </PageLayout>
  );
};

export default DefinirMetasPage;