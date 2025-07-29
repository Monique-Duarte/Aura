// --- Interfaces ---
// --- CORREÇÃO: Adicionadas as propriedades 'id' e 'reserveId' ---
export interface ReserveTransaction {
  id: string;
  reserveId: string;
  amount: number;
  date: Date;
  type: 'reserve_add' | 'reserve_withdraw';
}

interface HistoryPoint {
  date: string; // Data formatada como 'DD/MM'
  balance: number;
}

/**
 * Calcula a evolução diária do saldo de uma reserva, aplicando um rendimento mensal.
 * @param transactions Uma lista de todas as transações da reserva.
 * @param period O período para o qual o histórico deve ser calculado.
 * @param yieldRate A taxa de rendimento mensal (ex: 0.01 para 1%).
 * @returns Um array de pontos de histórico com a data e o saldo de cada dia.
 */
export const calculateReserveHistory = (
  transactions: ReserveTransaction[],
  period: { startDate: Date; endDate: Date },
  yieldRate: number
): HistoryPoint[] => {
  
  let currentBalance = 0;
  const historyPoints: HistoryPoint[] = [];

  // 1. Calcula o saldo inicial (soma de tudo o que aconteceu ANTES do período começar)
  transactions
    .filter(t => t.date < period.startDate)
    .forEach(t => {
      currentBalance += t.type === 'reserve_add' ? t.amount : -t.amount;
    });

  // 2. Filtra e ordena as transações que ocorreram DENTRO do período
  const transactionsInPeriod = transactions
    .filter(t => t.date >= period.startDate && t.date <= period.endDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // 3. Itera dia a dia dentro do período selecionado
  for (let d = new Date(period.startDate); d <= period.endDate; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    
    // Soma as transações do dia ao saldo
    transactionsInPeriod
      .filter(t => t.date.toDateString() === currentDate.toDateString())
      .forEach(t => {
        currentBalance += t.type === 'reserve_add' ? t.amount : -t.amount;
      });
    
    // Aplica o rendimento no primeiro dia de cada mês
    if (currentDate.getDate() === 1 && currentBalance > 0) {
      const monthlyYield = currentBalance * yieldRate;
      currentBalance += monthlyYield;
    }

    historyPoints.push({
      date: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      balance: currentBalance,
    });
  }

  return historyPoints;
};