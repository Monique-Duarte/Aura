import React, { useState, useEffect } from 'react';
import { IonInput, IonItem, IonLabel } from '@ionic/react';

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || isNaN(value)) return '';
  const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return value.toLocaleString('pt-BR', options);
};

const parseCurrency = (value: string): number | undefined => {
  if (!value) return undefined;
  const onlyNumbers = value.replace(/[^\d]/g, '');
  if (onlyNumbers === '') return undefined;
  const number = parseFloat(onlyNumbers) / 100;
  return isNaN(number) ? undefined : number;
};

interface CurrencyInputProps {
  label: string;
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ label, value, onValueChange }) => {
  const [formattedValue, setFormattedValue] = useState('');

  useEffect(() => {
    setFormattedValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e: CustomEvent) => {
    const inputValue: string = e.detail.value || '';
    const parsedValue = parseCurrency(inputValue);
    onValueChange(parsedValue);
    setFormattedValue(inputValue);
  };

  const handleBlur = () => {
    setFormattedValue(formatCurrency(value));
  };

  return (
    <IonItem>
      <IonLabel position="floating">{label}</IonLabel>
      <IonInput
        value={formattedValue}
        onIonChange={handleChange}
        onIonBlur={handleBlur}
        placeholder="0,00"
        inputmode="numeric"
        pattern="[0-9]*"
      />
    </IonItem>
  );
};

export default CurrencyInput;