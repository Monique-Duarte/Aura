import { useState, useCallback } from 'react';
import { Transaction } from '../../../shared/types/types';

export interface IncomeFormState {
  description: string;
  amount: number | undefined;
  date: string;
  isRecurring: boolean;
  selectedCategoryId: string | undefined;
}

const initialState: IncomeFormState = {
  description: '',
  amount: undefined,
  date: new Date().toISOString(),
  isRecurring: false,
  selectedCategoryId: undefined,
};

type EditableTransaction = Omit<Transaction, 'date'> & {
  date: Date;
};

export const useIncomeForm = () => {
  const [formState, setFormState] = useState<IncomeFormState>(initialState);

  /**    * Atualiza um campo específico do formulário.    */
  const handleInputChange = useCallback((field: keyof IncomeFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  /**    * Preenche o formulário com dados de uma transação para edição.    */
  const setFormForEditing = useCallback((income: EditableTransaction) => {
    setFormState({
      description: income.description,
      amount: income.amount,
      date: income.date.toISOString(),
      isRecurring: income.isRecurring,
      selectedCategoryId: income.categories && income.categories.length > 0 ? income.categories[0] : undefined,
    });
  }, []);

  /**    * Reseta o formulário para o estado inicial.    */
  const resetForm = useCallback(() => {
    setFormState(initialState);
  }, []);

  return {
    formState,
    handleInputChange,
    setFormForEditing,
    resetForm,
  };
};