import React, { useState, useEffect } from 'react';
import { IonInput, IonItem, IonLabel } from '@ionic/react';

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || isNaN(value)) return '';
  const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return value.toLocaleString('pt-BR', options);
};

const parseCurrency = (value: string): number | undefined => {
  if (!value) return undefined;
  
  // Remove tudo exceto dígitos, vírgula e ponto
  const cleanValue = value.replace(/[^\d,.]/g, '');
  if (cleanValue === '') return undefined;
  
  // Se tem vírgula, trata como decimal brasileiro (ex: 1.000,50)
  if (cleanValue.includes(',')) {
    const normalized = cleanValue.replace(/\./g, '').replace(',', '.');
    const number = parseFloat(normalized);
    return isNaN(number) ? undefined : number;
  }
  
  // Se não tem vírgula, trata como número inteiro (ex: 1000 = 1000.00)
  const onlyNumbers = cleanValue.replace(/\./g, ''); // Remove pontos de milhar se houver
  const number = parseFloat(onlyNumbers);
  return isNaN(number) ? undefined : number;
};

const formatWhileTyping = (value: string): string => {
  if (!value) return '';
  
  // Se já tem vírgula, mantém o formato
  if (value.includes(',')) {
    return value;
  }
  
  // Remove tudo exceto dígitos
  const onlyNumbers = value.replace(/[^\d]/g, '');
  if (onlyNumbers === '') return '';
  
  // Formata apenas com pontos de milhar, sem vírgula
  const number = parseInt(onlyNumbers, 10);
  return number.toLocaleString('pt-BR', { useGrouping: true });
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
    
    // Formata durante a digitação
    const formatted = formatWhileTyping(inputValue);
    setFormattedValue(formatted);
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