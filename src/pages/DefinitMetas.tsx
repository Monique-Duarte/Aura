import React, { useState } from 'react';
import { IonSpinner, IonContent, IonPage, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { useAuth } from '../hooks/AuthContext';
import { useCategories, Category } from '../hooks/useCategories';
import { useSpendingGoals } from '../hooks/useSpendingGoals';
import PeriodSelector from '../components/PeriodSelector';


interface Period {
  year: number;
  month: number;
  label: string;
  value: string;
}

const DefinirMetasPage: React.FC = () => {
  const { user } = useAuth();

  const { availableCategories: categories } = useCategories();
  const [currentPeriod, setCurrentPeriod] = useState<string>('2025-08');
  const { goals, loading, setGoal } = useSpendingGoals(user?.uid ?? null, currentPeriod);

  const handleSetGoal = (categoryId: string, amount: string) => {
    const numericAmount = parseFloat(amount) || 0;
    setGoal(categoryId, numericAmount);
  };

  const handlePeriodChange = (periodObject: Period) => {
    setCurrentPeriod(periodObject.value);
  };

  if (loading) {
    return <IonSpinner />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Definir Metas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PeriodSelector
          selectedPeriod={currentPeriod}
          onPeriodChange={handlePeriodChange}
        />

        {categories && categories.map((category: Category) => {
          const goal = goals.find(g => g.categoryId === category.id);

          return (
            <div key={category.id} style={{ padding: '10px 16px', borderBottom: '1px solid #eee' }}>
              <span>{category.name}</span>
              <input
                type="number"
                placeholder="R$ 0,00"
                defaultValue={goal?.amount || ''}
                onBlur={(e) => handleSetGoal(category.id, e.target.value)}
                style={{ width: '100px', float: 'right', textAlign: 'right', border: '1px solid #ccc', borderRadius: '5px' }}
              />
            </div>
          );
        })}
      </IonContent>
    </IonPage>
  );
};

export default DefinirMetasPage;