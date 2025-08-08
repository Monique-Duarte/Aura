import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import app from '../firebaseConfig';

interface Period {
  startDate: Date;
  endDate: Date;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  totalReserved: number;
  user1Income?: number;
  user1Expense?: number;
  user1Reserved?: number;
  user2Income?: number;
  user2Expense?: number;
  user2Reserved?: number;
}

export const useTransactionSummary = (period: Period | null, memberIds: string[] = []) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<TransactionSummary>({ totalIncome: 0, totalExpense: 0, totalReserved: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    const idsToFetch = memberIds.length > 0 ? memberIds : (user ? [user.uid] : []);
    if (idsToFetch.length === 0 || !period) {
      setSummary({ totalIncome: 0, totalExpense: 0, totalReserved: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      let totalIncome = 0, totalExpense = 0, totalReserved = 0;
      let user1Income = 0, user1Expense = 0, user1Reserved = 0;
      let user2Income = 0, user2Expense = 0, user2Reserved = 0;

      for (const [index, userId] of idsToFetch.entries()) {
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const q = query(
          transactionsRef,
          where('date', '>=', Timestamp.fromDate(period.startDate)),
          where('date', '<=', Timestamp.fromDate(period.endDate))
        );
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
          const data = doc.data();
          const amount = data.amount || 0;

          if (data.type === 'income') {
            totalIncome += amount;
            if (index === 0) user1Income += amount;
            else user2Income += amount;
          } else if (data.type === 'expense') {
            totalExpense += amount;
            if (index === 0) user1Expense += amount;
            else user2Expense += amount;
          } else if (data.type === 'reserve_add') {
            totalReserved += amount;
            if (index === 0) user1Reserved += amount;
            else user2Reserved += amount;
          } else if (data.type === 'reserve_withdraw') {
            totalReserved -= amount;
            if (index === 0) user1Reserved -= amount;
            else user2Reserved -= amount;
          }
        });
      }

      setSummary({ 
        totalIncome, 
        totalExpense, 
        totalReserved, 
        user1Income, 
        user1Expense, 
        user1Reserved, 
        user2Income, 
        user2Expense,
        user2Reserved
      });

    } catch (error) {
      console.error("Erro ao buscar resumo de transações:", error);
      setSummary({ totalIncome: 0, totalExpense: 0, totalReserved: 0 });
    } finally {
      setLoading(false);
    }
  }, [user, period, JSON.stringify(memberIds)]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading };
};