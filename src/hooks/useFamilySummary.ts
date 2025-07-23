import { useState, useEffect, useCallback } from 'react';
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

export const useFamilySummary = (period: Period | null, memberIds: string[]) => {
  const [summary, setSummary] = useState<TransactionSummary>({ totalIncome: 0, totalExpense: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!period || memberIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      let income = 0;
      let expense = 0;

      // Executa uma busca para cada membro da família
      for (const userId of memberIds) {
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const q = query(
          transactionsRef,
          where('date', '>=', period.startDate),
          where('date', '<=', period.endDate)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.type === 'income') {
            income += data.amount;
          } else if (data.type === 'expense') {
            expense += data.amount;
          }
        });
      }
      
      setSummary({ totalIncome: income, totalExpense: expense });

    } catch (error) {
      console.error("Erro ao buscar resumo familiar:", error);
      setSummary({ totalIncome: 0, totalExpense: 0 });
    } finally {
      setLoading(false);
    }
  }, [period, memberIds]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading };
};