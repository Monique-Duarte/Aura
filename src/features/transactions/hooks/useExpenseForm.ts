import { useState, useCallback } from 'react';
import { Transaction } from '../../../shared/types/types';

// 1. A interface que define o estado do nosso formulário
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

// 2. O estado inicial, idêntico ao que estava na sua página original
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
   * Preenche o formulário com os dados de uma despesa existente para edição.
   * Encapsula a lógica que estava dentro de `handleEditClick`.
   */
  const setFormForEditing = useCallback((expense: Transaction) => {
    setFormState({
      description: expense.description,
      amount: expense.amount,
      date: expense.date.toDate().toISOString(),
      isRecurring: expense.isRecurring,
      paymentMethod: expense.paymentMethod || 'debit',
      installments: 1, // Resetamos para 1 ao editar, como na sua lógica original
      selectedCategories: expense.categories || [],
      selectedCardId: expense.cardId,
    });
  }, []);

  /**
   * Reseta o formulário para o seu estado inicial.
   * Encapsula a lógica que estava dentro de `closeModalAndReset`.
   */
  const resetForm = useCallback(() => {
    setFormState(initialState);
  }, []);

  // 3. O hook expõe o estado e as funções para a página utilizar
  return {
    formState,
    setFormState, // Expondo o setFormState para flexibilidade
    setFormForEditing,
    resetForm,
  };
};