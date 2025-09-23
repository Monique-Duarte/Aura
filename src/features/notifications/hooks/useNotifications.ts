import { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { useAuth } from '../../../app/providers/AuthContext';
import { app } from '../../../firebaseConfig';

// Define a estrutura de um objeto de Notificação
export interface Notification {
  id: string;
  title: string;
  body: string;
  link: string; // Rota para onde o usuário será levado
  isRead: boolean;
  createdAt: Date;
  type: 'partnership_invite' | 'goal_warning' | 'invoice_due';
}

/**
 * Hook para buscar e gerenciar notificações de um usuário em tempo real.
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
      })) as Notification[];
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Função para marcar uma notificação específica como lida
  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const db = getFirestore(app);
    const notificationRef = doc(db, 'users', user.uid, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
  };

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const db = getFirestore(app);
    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, where('isRead', '==', false));
    
    const unreadSnapshot = await getDocs(q);
    if (unreadSnapshot.empty) return;

    const batch = writeBatch(db);
    unreadSnapshot.docs.forEach(document => {
      batch.update(document.ref, { isRead: true });
    });

    await batch.commit();
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
};