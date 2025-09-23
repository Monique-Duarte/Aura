import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { app } from '../../../firebaseConfig';
import { Notification } from '../hooks/useNotifications';

type NewNotificationData = Omit<Notification, 'id' | 'createdAt'>;

/**
 * Cria um novo documento de notificação no Firestore para um utilizador específico.
 * @param userId - O ID do utilizador que receberá a notificação.
 * @param notificationData - O objeto contendo os detalhes da notificação.
 */
export const createNotification = async (userId: string, notificationData: NewNotificationData) => {
  if (!userId) {
    console.error("É necessário um ID de utilizador para criar a notificação.");
    return;
  }
  
  try {
    const db = getFirestore(app);
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    
    await addDoc(notificationsRef, {
      ...notificationData,
      createdAt: Timestamp.now(),
    });

    console.log(`Notificação do tipo '${notificationData.type}' criada para o utilizador ${userId}`);
  } catch (error) {
    console.error("Erro ao criar o documento da notificação:", error);
  }
};


// --- NOVA LÓGICA PARA NOTIFICAÇÕES DE METAS ---

interface SpendingSummaryForNotification {
  name: string;
  total: number;
  goalAmount?: number;
  categoryId: string;
}

/**
 * Verifica os resumos de gastos e cria notificações se as metas forem atingidas.
 * @param userId - O ID do utilizador para quem as notificações serão criadas.
 * @param summaries - O resumo de gastos por categoria.
 * @param period - O período (mês/ano) a ser verificado.
 */

export const scheduleSpendingGoalNotifications = async (
  userId: string, 
  summaries: SpendingSummaryForNotification[], 
  period: { month: number, year: number }
) => {
  if (!userId) return;

  const periodKey = `${period.year}-${period.month}`;

  for (const summary of summaries) {
    if (!summary.goalAmount || summary.goalAmount <= 0) continue;

    const percentage = (summary.total / summary.goalAmount) * 100;

    const key100 = `notif_sent_${summary.categoryId}_${periodKey}_100`;
    const key80 = `notif_sent_${summary.categoryId}_${periodKey}_80`;
    const key50 = `notif_sent_${summary.categoryId}_${periodKey}_50`;

    const hasSent100 = localStorage.getItem(key100) === 'true';
    const hasSent80 = localStorage.getItem(key80) === 'true';
    const hasSent50 = localStorage.getItem(key50) === 'true';
    
    let notificationData: NewNotificationData | null = null;

    if (percentage >= 100 && !hasSent100) {
      notificationData = {
        title: 'Meta de Gastos Atingida!',
        body: `Você atingiu 100% da sua meta para ${summary.name}.`,
        link: '/app/metas',
        isRead: false,
        type: 'goal_warning',
      };
      localStorage.setItem(key100, 'true');
    } else if (percentage >= 80 && !hasSent80) {
      notificationData = {
        title: '⚠️ Atenção aos Gastos',
        body: `Você já utilizou 80% da sua meta para ${summary.name} este mês!`,
        link: '/app/metas',
        isRead: false,
        type: 'goal_warning',
      };
      localStorage.setItem(key80, 'true');
    } else if (percentage >= 50 && !hasSent50) {
      notificationData = {
        title: 'Alerta de Meta de Gastos',
        body: `Você atingiu 50% da sua meta para ${summary.name}. Fique de olho!`,
        link: '/app/metas',
        isRead: false,
        type: 'goal_warning',
      };
      localStorage.setItem(key50, 'true');
    }
    
    if (notificationData) {
      await createNotification(userId, notificationData);
    }
  }
};