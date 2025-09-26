// src/shared/types/types.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Representa um cartão de crédito do usuário.
 */
export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limit: number;
}

/**
 * Representa uma transação financeira, seja ela uma despesa ou uma receita.
 * Esta interface corresponde ao objeto como ele é salvo no Firestore.
 */
export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  description: string;
  amount: number;
  date: Timestamp;
  isRecurring: boolean;
  categories?: string[];
  paymentMethod?: 'credit' | 'debit';
  isInstallment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  cardId?: string;
  isPaid?: boolean;
  recurringDay?: number;
}

/**
 * Representa os dados do formulário de despesas,
 * antes de serem convertidos para o formato do Firestore.
 */
export interface ExpenseFormData {
  description: string;
  amount: number;
  date: string; // A data no formulário é uma string
  isRecurring: boolean;
  paymentMethod: 'credit' | 'debit';
  installments: number;
  categories: string[];
  cardId?: string;
}