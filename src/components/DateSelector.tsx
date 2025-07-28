import React, { useState, useEffect, useCallback } from 'react';
import { IonItem, IonLabel, IonDatetimeButton, IonModal, IonDatetime } from '@ionic/react';
import '../styles/DateSelector.css'; // Importa o CSS para estilização

// Define a estrutura de um objeto de período que o componente vai comunicar
interface Period {
  startDate: Date;
  endDate: Date;
}

// Define as propriedades que o componente espera receber
interface DateSelectorProps {
  onPeriodChange: (period: Period | null) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ onPeriodChange }) => {
  // Define o período inicial como o mês atual
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth.toISOString());
  const [endDate, setEndDate] = useState<string>(today.toISOString());

  const notifyParent = useCallback(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      onPeriodChange(null);
      return;
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    onPeriodChange({ startDate: start, endDate: end });
  }, [startDate, endDate, onPeriodChange]);

  useEffect(() => {
    notifyParent();
  }, [notifyParent]);

  return (
    <div className="date-selector-container">
      <IonItem lines="none" className="date-selector-item">
        <IonLabel position="stacked">De</IonLabel>
        <IonDatetimeButton datetime="start-date-picker"></IonDatetimeButton>
      </IonItem>
      <IonItem lines="none" className="date-selector-item">
        <IonLabel position="stacked">Até</IonLabel>
        <IonDatetimeButton datetime="end-date-picker"></IonDatetimeButton>
      </IonItem>

      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id="start-date-picker"
          presentation="date"
          value={startDate}
          onIonChange={e => setStartDate(e.detail.value! as string)}
        />
      </IonModal>

      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id="end-date-picker"
          presentation="date"
          value={endDate}
          onIonChange={e => setEndDate(e.detail.value! as string)}
        />
      </IonModal>
    </div>
  );
};

export default DateSelector;