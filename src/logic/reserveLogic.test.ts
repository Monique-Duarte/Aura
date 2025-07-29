import { describe, it, expect } from 'vitest';
import { calculateReserveHistory, ReserveTransaction } from './reserveLogic';

describe('calculateReserveHistory', () => {

  it('deve calcular o histórico de saldo corretamente, aplicando o rendimento mensal', () => {
    // Cenário:
    // - Um depósito inicial de 1000€ antes do período de teste.
    // - Um novo depósito de 200€ no meio de janeiro.
    // - Um rendimento de 10% (0.10) a ser aplicado no dia 1 de fevereiro.
    const transactions: ReserveTransaction[] = [
      { id: '1', reserveId: 'a', date: new Date('2025-01-01T12:00:00'), amount: 1000, type: 'reserve_add' },
      { id: '2', reserveId: 'a', date: new Date('2025-01-15T12:00:00'), amount: 200, type: 'reserve_add' },
    ];
    
    const period = {
      startDate: new Date('2025-01-10T00:00:00'),
      endDate: new Date('2025-02-05T00:00:00'),
    };
    
    const yieldRate = 0.10; // 10%

    // Executa a função
    const history = calculateReserveHistory(transactions, period, yieldRate);

    // --- Verificações ---
    
    // 1. O saldo no dia 15 de janeiro deve ser 1200€ (1000€ iniciais + 200€ do depósito).
    const balanceOnJan15 = history.find(p => p.date === '15/01')?.balance;
    expect(balanceOnJan15).toBe(1200);

    // 2. O saldo no dia 1 de fevereiro deve ser 1320€ (1200€ + 10% de rendimento, que são 120€).
    const balanceOnFeb01 = history.find(p => p.date === '01/02')?.balance;
    expect(balanceOnFeb01).toBe(1320);

    // 3. O saldo final, no dia 5 de fevereiro, deve continuar a ser 1320€.
    const finalBalance = history[history.length - 1].balance;
    expect(finalBalance).toBe(1320);
  });

});