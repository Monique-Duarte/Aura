import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFamilySummary } from './useFamilySummary';
import { getDocs } from 'firebase/firestore';

// --- Mocking (Simulação) das Dependências ---

// 1. Simula o módulo do Firebase para que não faça chamadas reais à internet.
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    getDocs: vi.fn(), // A função que busca os dados será controlada por nós.
  };
});

// --- Início dos Testes ---

// Define um tipo para o nosso documento de transação simulado
type MockTransactionDoc = { 
  data: () => { 
    type: 'income' | 'expense';
    amount: number;
  } 
};

describe('useFamilySummary', () => {
  // Limpa as simulações antes de cada teste
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve somar corretamente as rendas e despesas de múltiplos utilizadores', async () => {
    // --- Preparação do Cenário ---
    
    // Dados de teste para o Utilizador 1
    const docsUser1: MockTransactionDoc[] = [
      { data: () => ({ type: 'income', amount: 2000 }) },
      { data: () => ({ type: 'expense', amount: 150 }) },
    ];

    // Dados de teste para o Utilizador 2
    const docsUser2: MockTransactionDoc[] = [
      { data: () => ({ type: 'income', amount: 500 }) },
      { data: () => ({ type: 'expense', amount: 75 }) },
    ];

    // Configura o getDocs para retornar os dados do Utilizador 1 na primeira chamada,
    // e os do Utilizador 2 na segunda.
    (getDocs as vi.Mock)
      .mockResolvedValueOnce({ 
        docs: docsUser1,
        forEach: (callback: (doc: MockTransactionDoc) => void) => docsUser1.forEach(callback)
      })
      .mockResolvedValueOnce({ 
        docs: docsUser2,
        forEach: (callback: (doc: MockTransactionDoc) => void) => docsUser2.forEach(callback)
      });

    const period = {
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-31'),
    };
    const memberIds = ['user1', 'user2'];

    // --- Execução do Teste ---

    // Renderiza o hook com os dados de teste.
    const { result } = renderHook(() => useFamilySummary(period, memberIds));

    // Espera que o hook termine de carregar os dados.
    await waitFor(() => expect(result.current.loading).toBe(false));

    // --- Verificações ---

    // O total de Renda deve ser 2500 (2000 do user1 + 500 do user2).
    expect(result.current.summary.totalIncome).toBe(2500);
    
    // O total de Despesa deve ser 225 (150 do user1 + 75 do user2).
    expect(result.current.summary.totalExpense).toBe(225);
  });
});
