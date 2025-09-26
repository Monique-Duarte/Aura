import React, { useState, useEffect } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonButtons, IonDatetime, IonItem, IonLabel, IonInput,
  IonSegment, IonSegmentButton, IonSelect, IonSelectOption
} from '@ionic/react';
import { DatetimeChangeEventDetail } from '@ionic/core';

export interface Period {
  startDate: Date;
  endDate: Date;
}

interface DateSelectorProps {
  onPeriodChange: (period: Period | null) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ onPeriodChange }) => {
  // --- Estados do Componente ---
  const [selectionMode, setSelectionMode] = useState<'period' | 'year'>('period');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null);
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (selectionMode === 'period') {
      if (startDate && endDate) {
        const d1 = new Date(startDate);
        const d2 = new Date(endDate);
        onPeriodChange({
          startDate: d1 < d2 ? d1 : d2,
          endDate: d1 > d2 ? d1 : d2,
        });
      } else {
        onPeriodChange(null);
      }
    } else { 
      onPeriodChange({
        startDate: new Date(selectedYear, 0, 1),
        endDate: new Date(selectedYear, 11, 31),
      });
    }
  }, [startDate, endDate, selectedYear, selectionMode, onPeriodChange]);

  const openDatePicker = (target: 'start' | 'end') => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  const handleDateChange = (e: CustomEvent<DatetimeChangeEventDetail>) => {
    const value = e.detail.value as string | undefined;
    if (!value) return;

    if (datePickerTarget === 'start') {
      setStartDate(value);
    } else if (datePickerTarget === 'end') {
      setEndDate(value);
    }
    setShowDatePicker(false);
  };

  return (
    <div className="date-selector-container">
      <IonSegment
        value={selectionMode}
        onIonChange={e => setSelectionMode(e.detail.value as any)}
      >
        <IonSegmentButton value="period">
          <IonLabel>Período</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="year">
          <IonLabel>Anual</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      {selectionMode === 'period' ? (
        <>
          <IonItem button onClick={() => openDatePicker('start')} lines="none" className="date-item-selector">
            <IonLabel>Data de Início</IonLabel>
            <IonInput
              readonly
              className="ion-text-end"
              value={startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Selecione...'}
            />
          </IonItem>
          <IonItem button onClick={() => openDatePicker('end')} lines="none" className="date-item-selector">
            <IonLabel>Data de Fim</IonLabel>
            <IonInput
              readonly
              className="ion-text-end"
              value={endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Selecione...'}
            />
          </IonItem>
        </>
      ) : (
        <IonItem lines="none" className="date-item-selector">
          <IonLabel>Ano</IonLabel>
          <IonSelect
            className="year-selector"
            value={selectedYear}
            onIonChange={e => setSelectedYear(e.detail.value)}
            interface="popover"
          >
            {availableYears.map(year => (
              <IonSelectOption key={year} value={year}>{year}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      )}

      <IonModal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>
              {datePickerTarget === 'start' ? 'Selecione a Data de Início' : 'Selecione a Data de Fim'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowDatePicker(false)}>Cancelar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonDatetime
            className="date-selector-popover"
            presentation="date"
            onIonChange={handleDateChange}
            value={datePickerTarget === 'start' ? startDate ?? undefined : endDate ?? undefined}
          />
        </IonContent>
      </IonModal>
    </div>
  );
};

export default DateSelector;