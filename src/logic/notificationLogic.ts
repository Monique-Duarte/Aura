import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

// --- Interfaces (copiadas de Faturas.tsx para manter a tipagem) ---
interface Invoice {
  id: string;
  cardName: string;
  totalAmount: number;
  endDate: Date; // Data de fecho
  dueDate: Date;   // Data de vencimento
  isPaid: boolean;
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
      console.log(`${notifications.length} notificações de fatura agendadas.`);
    }
  } catch (error) {
    console.error("Erro ao agendar notificações:", error);
  }
};