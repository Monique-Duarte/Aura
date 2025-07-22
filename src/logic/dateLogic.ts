/**
 * Calcula o período financeiro (data de início e fim) com base no dia de hoje
 * e no dia de início do mês configurado pelo usuário.
 * @param startDay O dia do mês que o usuário considera como o início (ex: 5).
 * @returns Um objeto com as datas de início e fim do período atual.
 */
export const calculateFinancialPeriod = (startDay: number): { startDate: Date; endDate: Date } => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const currentDay = today.getDate();

  let startDate: Date;
  let endDate: Date;

  if (currentDay >= startDay) {
    // O período atual começou neste mês.
    startDate = new Date(currentYear, currentMonth, startDay);
    // E termina no próximo mês, um dia antes do startDay.
    endDate = new Date(currentYear, currentMonth + 1, startDay - 1);
  } else {
    // O período atual começou no mês passado.
    startDate = new Date(currentYear, currentMonth - 1, startDay);
    // E termina neste mês, um dia antes do startDay.
    endDate = new Date(currentYear, currentMonth, startDay - 1);
  }

  // Ajusta o fuso horário para o início e fim do dia para evitar problemas com queries.
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

// Helper para obter o nome do mês em português
const getMonthName = (monthIndex: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthIndex];
};

/**
 * Gera uma lista de períodos financeiros para usar em um seletor.
 * @param startDay O dia de início do mês financeiro.
 * @param range Quantos meses para o passado e futuro devem ser gerados.
 * @returns Um array de objetos, cada um representando um período selecionável.
 */
export const generateFinancialPeriods = (startDay: number, range: number = 6) => {
  const periods: { label: string; value: string; startDate: Date; endDate: Date }[] = [];
  const today = new Date();

  for (let i = range; i >= -range; i--) {
    // Calcula a data de referência para cada iteração (mês atual - i)
    const refDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    
    let periodStartDate: Date;
    let periodEndDate: Date;
    
    // Lógica ajustada para gerar o período corretamente para cada mês do loop
    if (refDate.getDate() >= startDay) {
        periodStartDate = new Date(refDate.getFullYear(), refDate.getMonth(), startDay);
        periodEndDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, startDay - 1);
    } else {
        periodStartDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, startDay);
        periodEndDate = new Date(refDate.getFullYear(), refDate.getMonth(), startDay - 1);
    }

    // Ajusta o fuso horário
    periodStartDate.setHours(0, 0, 0, 0);
    periodEndDate.setHours(23, 59, 59, 999);
    
    const label = `${getMonthName(periodStartDate.getMonth())} ${periodStartDate.getFullYear()}`;
    const value = periodStartDate.toISOString(); // Um valor único para a opção

    // Adiciona à lista se ainda não existir (evita duplicatas)
    if (!periods.some(p => p.value === value)) {
      periods.push({ startDate: periodStartDate, endDate: periodEndDate, label, value });
    }
  }
  // A ordenação pode ser necessária dependendo do loop
  return periods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
};
