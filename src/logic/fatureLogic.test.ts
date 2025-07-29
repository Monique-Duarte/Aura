import { describe, it, expect } from 'vitest';
import { getInvoicePeriodForExpense } from './fatureLogic';

// O 'describe' agrupa testes relacionados. Estamos a testar a nossa função de lógica de fatura.
describe('getInvoicePeriodForExpense', () => {

  // Um cartão de exemplo que fecha a fatura no dia 20 de cada mês.
  const card = { closingDay: 20 };

  // 'it' descreve um cenário de teste específico.
  it('deve atribuir uma despesa feita APÓS o dia de fecho à fatura do mês seguinte', () => {
    // Cenário 1: Uma compra feita a 25 de julho.
    const expenseDate = new Date('2025-07-25T12:00:00');
    
    // A fatura correta para esta compra é a de AGOSTO, que vai de 21 de julho a 20 de agosto.
    const expectedStartDate = new Date('2025-07-21T00:00:00');
    const expectedEndDate = new Date('2025-08-20T23:59:59.999');

    // Executa a função que queremos testar.
    const result = getInvoicePeriodForExpense(expenseDate, card);

    // 'expect' verifica se o resultado é o que esperávamos.
    expect(result.startDate).toEqual(expectedStartDate);
    expect(result.endDate).toEqual(expectedEndDate);
  });

  it('deve atribuir uma despesa feita ANTES ou NO dia de fecho à fatura do mês atual', () => {
    // Cenário 2: Uma compra feita a 15 de julho.
    const expenseDate = new Date('2025-07-15T12:00:00');

    // A fatura correta para esta compra é a de JULHO, que vai de 21 de junho a 20 de julho.
    const expectedStartDate = new Date('2025-06-21T00:00:00');
    const expectedEndDate = new Date('2025-07-20T23:59:59.999');

    const result = getInvoicePeriodForExpense(expenseDate, card);

    expect(result.startDate).toEqual(expectedStartDate);
    expect(result.endDate).toEqual(expectedEndDate);
  });

});
