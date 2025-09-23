// --- Interface para um Cartão (simplificada para a lógica) ---
interface Card {
  closingDay: number;
}

// --- Interface para o Período da Fatura que a função retorna ---
interface InvoicePeriod {
  startDate: Date;
  endDate: Date;
}

/**
 * Calcula o período de uma fatura (data de início e fim) para uma determinada despesa.
 * @param expenseDate A data em que a despesa foi feita.
 * @param card O cartão de crédito com o dia de fecho.
 * @returns Um objeto com a data de início e fim da fatura a que a despesa pertence.
 */
export const getInvoicePeriodForExpense = (expenseDate: Date, card: Card): InvoicePeriod => {
  let invoiceYear = expenseDate.getFullYear();
  let invoiceMonth = expenseDate.getMonth(); // 0 = Janeiro, 11 = Dezembro

  // Se a data da despesa for posterior ao dia de fecho, ela pertence à fatura do mês seguinte
  if (expenseDate.getDate() > card.closingDay) {
    invoiceMonth += 1;
    if (invoiceMonth > 11) {
      invoiceMonth = 0;
      invoiceYear += 1;
    }
  }

  // O ciclo da fatura começa no dia seguinte ao fecho do mês anterior
  const startDate = new Date(invoiceYear, invoiceMonth - 1, card.closingDay + 1);
  
  // E termina no dia do fecho do mês da fatura
  const endDate = new Date(invoiceYear, invoiceMonth, card.closingDay);
  
  // Ajusta as horas para garantir que o período cobre os dias inteiros
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};
