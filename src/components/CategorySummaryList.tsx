import React from 'react';
import { IonList, IonItem, IonLabel, IonText } from '@ionic/react';
import '../styles/CategorySummaryList.css';

// 1. A interface agora inclui a meta (opcional)
export interface CategorySummaryItem {
  name: string;
  total: number;
  percentage: number;
  color: string;
  goalAmount?: number;
}

interface CategorySummaryListProps {
  summary: CategorySummaryItem[];
}

// Componente auxiliar para a barra de progresso
const ProgressBar: React.FC<{ spent: number; goal: number }> = ({ spent, goal }) => {
  const percentage = goal > 0 ? (spent / goal) * 100 : 0;
  
  let progressColor = 'var(--ion-color-success)';
  if (percentage >= 100) {
    progressColor = 'var(--ion-color-danger)';
  } else if (percentage >= 80) {
    progressColor = 'var(--ion-color-warning)';
  }

  return (
    <div className="progress-bar-background">
      <div 
        className="progress-bar-fill"
        style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: progressColor }} 
      />
    </div>
  );
};

const CategorySummaryList: React.FC<CategorySummaryListProps> = ({ summary }) => {
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="category-summary-container">
      <h3 className="summary-list-title">Gastos por Categoria</h3>
      <IonList className="summary-list" lines="none">
        {summary.map((item) => (
          <IonItem key={item.name} className="summary-list-item">
            <div className="category-color-dot" style={{ backgroundColor: item.color }}></div>
            <IonLabel>
              <h2>{item.name}</h2>
              {/* 2. Verifica se existe uma meta para mostrar o progresso */}
              {item.goalAmount !== undefined && item.goalAmount > 0 ? (
                <>
                  <p className="goal-text">
                    {formatCurrency(item.total)} de {formatCurrency(item.goalAmount)}
                  </p>
                  <ProgressBar spent={item.total} goal={item.goalAmount} />
                </>
              ) : (
                // Se não houver meta, mostra a percentagem como antes
                <p>{item.percentage.toFixed(1)}% do total</p>
              )}
            </IonLabel>
            <IonText slot="end" color="danger" className="summary-item-total">
              {formatCurrency(item.total)}
            </IonText>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
};

export default CategorySummaryList;