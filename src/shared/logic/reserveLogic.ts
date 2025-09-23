// --- Interfaces ---
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

// Nova interface para o retorno da função
interface ReserveHistoryResult {
  historyPoints: HistoryPoint[];
  lastDailyYield: number;
}

/**
 * Calcula a evolução diária do saldo de uma reserva, aplicando um rendimento mensal pro-rata.
 * @param transactions Uma lista de todas as transações da reserva.
 * @param period O período para o qual o histórico deve ser calculado.
 * @param monthlyYieldRate A taxa de rendimento mensal (ex: 0.01 para 1%).
 * @returns Um objeto com os pontos de histórico e o valor do último rendimento diário.
 */
export const calculateReserveHistory = (
  transactions: ReserveTransaction[],
  period: { startDate: Date; endDate: Date },
  monthlyYieldRate: number
): ReserveHistoryResult => {
  
  let currentBalance = 0;
  const historyPoints: HistoryPoint[] = [];
  let lastDailyYield = 0; // Nova variável para guardar o último rendimento

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
    
    // Calcula a taxa diária proporcional ao mês atual
    const daysInCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const dailyRate = monthlyYieldRate / daysInCurrentMonth;

    // Aplica o rendimento DIÁRIO sobre o saldo do início do dia
    if (currentBalance > 0 && dailyRate > 0) {
      const dailyYield = currentBalance * dailyRate;
      currentBalance += dailyYield;
      lastDailyYield = dailyYield; // Atualiza o rendimento do dia
    } else {
      lastDailyYield = 0; // Reseta se não houver rendimento
    }

    // Soma as transações que ocorreram no dia de hoje ao saldo
    transactionsInPeriod
      .filter(t => t.date.toDateString() === currentDate.toDateString())
      .forEach(t => {
        currentBalance += t.type === 'reserve_add' ? t.amount : -t.amount;
      });
    
    historyPoints.push({
      date: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      balance: currentBalance,
    });
  }

  // Retorna o objeto com ambas as informações
  return { historyPoints, lastDailyYield };
};