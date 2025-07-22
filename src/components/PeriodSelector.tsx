import React, { useState, useEffect, useCallback } from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import { useDate } from '../hooks/DateContext';
import { generateFinancialPeriods } from '../logic/dateLogic';

// Define a estrutura de um objeto de período que o componente vai comunicar
interface Period {
  startDate: Date;
  endDate: Date;
}

// Define as propriedades que o componente espera receber
interface PeriodSelectorProps {
  onPeriodChange: (period: Period) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ onPeriodChange }) => {
  const { startDay, currentPeriod } = useDate();

  // Estado interno para controlar as opções e o valor selecionado
  const [periodOptions, setPeriodOptions] = useState<ReturnType<typeof generateFinancialPeriods>>([]);
  const [selectedPeriodValue, setSelectedPeriodValue] = useState<string>('');

  // Gera as opções do seletor e define o valor inicial
  useEffect(() => {
    const options = generateFinancialPeriods(startDay);
    setPeriodOptions(options);

    if (currentPeriod) {
      const currentOption = options.find(
        p => p.startDate.getTime() === currentPeriod.startDate.getTime()
      );
      if (currentOption) {
        setSelectedPeriodValue(currentOption.value);
      }
    }
  }, [startDay, currentPeriod]);

  const notifyParentOfChange = useCallback(() => {
    const selected = periodOptions.find(p => p.value === selectedPeriodValue);
    if (selected) {
      onPeriodChange({ startDate: selected.startDate, endDate: selected.endDate });
    }
  }, [selectedPeriodValue, periodOptions, onPeriodChange]);

  useEffect(() => {
    notifyParentOfChange();
  }, [notifyParentOfChange]);

  return (
    <IonSelect
      value={selectedPeriodValue}
      placeholder="Selecione o Mês"
      onIonChange={e => setSelectedPeriodValue(e.detail.value)}
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
