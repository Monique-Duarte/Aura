import React from 'react';
import { IonList, IonItem, IonLabel, IonText } from '@ionic/react';

interface SummaryItem {
  name: string;
  userAmount: number;
  partnerAmount: number;
  total: number;
  color: string;
}

interface FamilyCategorySummaryListProps {
  summary: SummaryItem[];
  user1Name: string;
  user2Name: string;
}

const FamilyCategorySummaryList: React.FC<FamilyCategorySummaryListProps> = ({ summary, user1Name, user2Name }) => {
  return (
    <IonList>
      {summary.map((item) => (
        <IonItem key={item.name} lines="full" className="category-summary-item">
          <div className="category-color-dot" style={{ backgroundColor: item.color }} slot="start"></div>
          <IonLabel>
            <h2>{item.name}</h2>
            {/* Detalhamento por usuário */}
            <p className="user-contribution">
              {user1Name}: {item.userAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="user-contribution">
              {user2Name}: {item.partnerAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </IonLabel>
          <IonText color="danger" slot="end">
            <p>{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </IonText>
        </IonItem>
      ))}
    </IonList>
  );
};

export default FamilyCategorySummaryList;