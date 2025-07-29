import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCategorySummary } from './useCategorySummary';
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

// 2. Simula o hook useAuth para que ele retorne um utilizador de teste.
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user1' } }),
}));

// 3. Simula o hook useCategories para que ele retorne categorias de teste.
vi.mock('./useCategories', () => ({
  useCategories: () => ({
    availableCategories: [
      { name: 'Lazer', color: '#ff0000' },
      { name: 'Casa', color: '#00ff00' },
    ],
    fetchCategories: vi.fn(),
  }),
}));

// --- Início dos Testes ---

type MockDoc = { data: () => { categories: string[]; amount: number } };

describe('useCategorySummary', () => {
  // Limpa as simulações antes de cada teste para garantir que um não interfira no outro.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve agregar corretamente os gastos de dois utilizadores', async () => {
    // --- Preparação do Cenário ---
    
    // Dados de teste para o Utilizador 1
    const docsUser1: MockDoc[] = [
      { data: () => ({ categories: ['Lazer'], amount: 100 }) },
      { data: () => ({ categories: ['Casa'], amount: 50 }) },
    ];

    // Dados de teste para o Utilizador 2
    const docsUser2: MockDoc[] = [
      { data: () => ({ categories: ['Lazer'], amount: 25 }) },
    ];

    // Configura o getDocs para retornar os dados do Utilizador 1 na primeira chamada,
    // e os do Utilizador 2 na segunda.
    (getDocs as vi.Mock)
      .mockResolvedValueOnce({ 
        docs: docsUser1,
        forEach: (callback: (doc: MockDoc) => void) => docsUser1.forEach(callback)
      })
      .mockResolvedValueOnce({ 
        docs: docsUser2,
        forEach: (callback: (doc: MockDoc) => void) => docsUser2.forEach(callback)
      });

    const period = {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
    };
    const memberIds = ['user1', 'user2'];

    // --- Execução do Teste ---

    // Renderiza o hook com os dados de teste.
    const { result } = renderHook(() => useCategorySummary(period, memberIds));

    // Espera que o hook termine de carregar os dados.
    await waitFor(() => expect(result.current.loading).toBe(false));

    // --- Verificações ---

    // 1. Verifica se a lista de resumo foi agregada corretamente.
    const summaryLazer = result.current.summaryList.find(item => item.name === 'Lazer');
    const summaryCasa = result.current.summaryList.find(item => item.name === 'Casa');

    // O total de Lazer deve ser 125 (100 do user1 + 25 do user2).
    expect(summaryLazer?.total).toBe(125);
    // O total de Casa deve ser 50 (apenas do user1).
    expect(summaryCasa?.total).toBe(50);

    // 2. Verifica se os dados do gráfico para múltiplos utilizadores estão corretos.
    const chartData = result.current.chartData;
    expect(chartData?.datasets.length).toBe(2); // Deve ter um dataset para cada utilizador.
    
    // Encontra o índice da categoria 'Lazer' para verificar os dados do gráfico.
    const lazerIndex = chartData?.labels.indexOf('Lazer');
    
    // Verifica se os valores para 'Lazer' em cada dataset estão corretos.
    expect(chartData?.datasets[0].data[lazerIndex!]).toBe(100); // Valor do Utilizador 1
    expect(chartData?.datasets[1].data[lazerIndex!]).toBe(25);  // Valor do Utilizador 2
  });
});
