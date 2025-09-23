import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

// --- Interfaces (copiadas de Faturas.tsx para manter a tipagem) ---
interface Invoice {
  id: string;
  cardName: string;
  totalAmount: number;
  endDate: Date; 
  dueDate: Date;   
  isPaid: boolean;
}

// Descreve os dados que a nova função de notificação precisa
export interface SpendingSummary {
  name: string;      // Nome da categoria (ex: "Alimentação")
  total: number;     // Total gasto na categoria
  goalAmount?: number; // Valor da meta para a categoria
  categoryId: string;  
}

// Função de utilidade para gerar um ID numérico a partir de uma string
const hashCode = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Converte para um inteiro de 32bit
  }
  return Math.abs(hash);
};

// --- Função Principal de Agendamento de Notificações ---
export const scheduleInvoiceNotifications = async (invoicesToSchedule: Invoice[]) => {
  try {
    // Pede permissão ao utilizador (é seguro chamar várias vezes)
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      if (request.display !== 'granted') {
        console.log("Permissão para notificações negada.");
        return;
      }
    }

    // Limpa notificações pendentes para evitar duplicados
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const notifications: ScheduleOptions['notifications'] = [];
    for (const invoice of invoicesToSchedule) {
      if (!invoice.isPaid) {
        // Notificação para o dia do FECHO
        const closingDate = new Date(invoice.endDate);
        closingDate.setHours(10, 0, 0, 0); // Agenda para as 10h da manhã

        if (closingDate > new Date()) {
          notifications.push({
            id: hashCode(invoice.id) * 2, // ID único para o fecho
            title: 'Fecho da Fatura',
            body: `A sua fatura do ${invoice.cardName} fecha hoje! Total: ${invoice.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
            schedule: { at: closingDate },
          });
        }

        // Notificação para o dia do VENCIMENTO
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(10, 0, 0, 0);

        if (dueDate > new Date()) {
          notifications.push({
            id: hashCode(invoice.id) * 2 + 1, // ID único para o vencimento
            title: 'Lembrete de Vencimento',
            body: `A sua fatura do ${invoice.cardName} vence hoje! Não se esqueça de pagar.`,
            schedule: { at: dueDate },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  } catch (error) {
    console.error("Erro ao agendar notificações:", error);
  }
};

export const scheduleSpendingGoalNotifications = async (summaries: SpendingSummary[], period: { month: number, year: number }) => {
  try {
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      if (request.display !== 'granted') return;
    }
    
    const notificationsToSchedule: ScheduleOptions['notifications'] = [];
    const periodKey = `${period.year}-${period.month}`;

    for (const summary of summaries) {
      if (!summary.goalAmount || summary.goalAmount <= 0) continue;

      const percentage = (summary.total / summary.goalAmount) * 100;
      
      // Chaves únicas para controlar se a notificação já foi enviada neste período
      const notificationKey50 = `notif_sent_${summary.categoryId}_${periodKey}_50`;
      const notificationKey80 = `notif_sent_${summary.categoryId}_${periodKey}_80`;
      
      const hasSent50 = localStorage.getItem(notificationKey50) === 'true';
      const hasSent80 = localStorage.getItem(notificationKey80) === 'true';
      
      const notificationTime = new Date();
      notificationTime.setSeconds(notificationTime.getSeconds() + 5); // Agenda para 5 segundos no futuro

      // Lógica para notificação de 80%
      if (percentage >= 80 && !hasSent80) {
        notificationsToSchedule.push({
          id: hashCode(`${summary.categoryId}_${periodKey}_80`), // ID único para esta notificação
          title: '⚠️ Atenção aos Gastos',
          body: `Você já utilizou mais de 80% da sua meta para ${summary.name} este mês!`,
          schedule: { at: notificationTime },
        });
        localStorage.setItem(notificationKey80, 'true');
      }
      // Lógica para notificação de 50% (só se a de 80% ainda não foi enviada)
      else if (percentage >= 50 && !hasSent50 && !hasSent80) {
        notificationsToSchedule.push({
          id: hashCode(`${summary.categoryId}_${periodKey}_50`), // ID único
          title: 'Alerta de Meta de Gastos',
          body: `Você atingiu 50% da sua meta para ${summary.name}. Fique de olho!`,
          schedule: { at: notificationTime },
        });
        localStorage.setItem(notificationKey50, 'true');
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log('Notificações de metas de gastos agendadas:', notificationsToSchedule);
    }

  } catch (error) {
    console.error("Erro ao agendar notificações de metas:", error);
  }
};