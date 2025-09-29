import { useState, useCallback } from 'react';
import { Transaction } from '../../../shared/types/types';

// 1. A interface que define o estado completo do nosso formulário
export interface ExpenseFormState {
  description: string;
  amount: number | undefined;
  date: string;
  isRecurring: boolean;
  paymentMethod: 'credit' | 'debit';
  installments: number;
  selectedCategories: string[];
  selectedCardId: string | undefined;
}

const initialState: ExpenseFormState = {
  description: '',
  amount: undefined,
  date: new Date().toISOString(),
  isRecurring: false,
  paymentMethod: 'debit',
  installments: 1,
  selectedCategories: [],
  selectedCardId: undefined,
};

export const useExpenseForm = () => {
  const [formState, setFormState] = useState<ExpenseFormState>(initialState);

  /**
   * Atualiza um campo específico do formulário.
   * Substitui a necessidade de ter múltiplos `set...` na página.
   */
  const handleInputChange = useCallback((field: keyof ExpenseFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Preenche o formulário com os dados de uma despesa existente para edição.
   */
  const setFormForEditing = useCallback((expense: Transaction) => {
    setFormState({
      description: expense.description,
      amount: expense.amount,
      date: expense.date.toDate().toISOString(),
      isRecurring: expense.isRecurring,
      paymentMethod: expense.paymentMethod || 'debit',
      installments: 1,
      selectedCategories: expense.categories || [],
      selectedCardId: expense.cardId,
    });
  }, []);

  /**
   * Reseta o formulário para o seu estado inicial.
   */
  const resetForm = useCallback(() => {
    setFormState(initialState);
  }, []);

  // 3. O hook retorna o estado e as funções para a página utilizar
  return {
    formState,
    handleInputChange,
    setFormForEditing,
    resetForm,
  };
};