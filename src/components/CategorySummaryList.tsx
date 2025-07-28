import React from 'react';
import { IonList, IonItem, IonLabel, IonText } from '@ionic/react';
import '../styles/CategorySummaryList.css';

// Interface para definir a estrutura de cada item na lista de resumo
export interface CategorySummaryItem {
  name: string;
  total: number;
  percentage: number;
  color: string;
}

interface CategorySummaryListProps {
  summary: CategorySummaryItem[];
}

const CategorySummaryList: React.FC<CategorySummaryListProps> = ({ summary }) => {
  return (
    <div className="category-summary-container">
      <h3 className="summary-list-title">Gastos por Categoria</h3>
      <IonList className="summary-list" lines="none">
        {summary.map((item) => (
          <IonItem key={item.name} className="summary-list-item">
            <div className="category-color-dot" style={{ backgroundColor: item.color }}></div>
            <IonLabel>
              <h2>{item.name}</h2>
              <p>{item.percentage.toFixed(1)}% do total</p>
            </IonLabel>
            <IonText slot="end" color="danger" className="summary-item-total">
              {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </IonText>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
};

export default CategorySummaryList;