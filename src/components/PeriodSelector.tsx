import React, { useState, useEffect, useMemo } from 'react';
import { IonSelect, IonSelectOption, IonSpinner } from '@ionic/react';
import { useDate } from '../hooks/DateContext';
import { generateFinancialPeriods } from '../logic/dateLogic';

export interface Period {
  value: string; // Ex: "2025-08"
  label: string; // Ex: "Agosto / 2025"
  startDate: Date;
  endDate: Date;
}

interface PeriodSelectorProps {
  onPeriodChange: (period: Period) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ onPeriodChange }) => {
  const { startDay, currentPeriod } = useDate();
  const periodOptions = useMemo(() => {
    return generateFinancialPeriods(startDay);
  }, [startDay]);
  
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  useEffect(() => {

    if (periodOptions.length > 0 && currentPeriod && selectedValue === null) {
      const currentOption = periodOptions.find(
        p => p.startDate.getTime() === currentPeriod.startDate.getTime()
      );

      if (currentOption) {
        setSelectedValue(currentOption.value);
        onPeriodChange(currentOption);
      }
    }
  }, [periodOptions, currentPeriod, selectedValue, onPeriodChange]);

  const handleChange = (newValue: string) => {
    const selectedOption = periodOptions.find(p => p.value === newValue);
    if (selectedOption) {
      setSelectedValue(selectedOption.value);
      onPeriodChange(selectedOption);
    }
  };

  if (!selectedValue) {
    return <IonSpinner name="dots" style={{'--color': 'var(--ion-color-medium)'}}/>;
  }

  return (
    <IonSelect
      value={selectedValue}
      onIonChange={e => handleChange(e.detail.value)}
      interface="popover"
      className="month-selector"
    >
      {periodOptions.map(opt => (
        <IonSelectOption key={opt.value} value={opt.value}>
          {opt.label}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
};

export default PeriodSelector;
