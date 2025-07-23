import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from '../firebaseConfig';

interface Period {
  startDate: Date;
  endDate: Date;
}

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
}

export const useTransactionSummary = (period: Period | null) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<TransactionSummary>({ totalIncome: 0, totalExpense: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!user || !period) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(
        transactionsRef,
        where('date', '>=', period.startDate),
        where('date', '<=', period.endDate)
      );

      const querySnapshot = await getDocs(q);
      
      let income = 0;
      let expense = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'income') {
          income += data.amount;
        } else if (data.type === 'expense') {
          expense += data.amount;
        }
      });

      setSummary({ totalIncome: income, totalExpense: expense });

    } catch (error) {
      console.error("Erro ao buscar resumo de transações:", error);
      setSummary({ totalIncome: 0, totalExpense: 0 });
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading };
};