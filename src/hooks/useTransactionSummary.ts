import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from '../firebaseConfig';

interface Period {
  startDate: Date;
  endDate: Date;
}

// A interface agora pode retornar dados de um ou dois utilizadores
export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  // Dados individuais para o gráfico de família
  user1Income?: number;
  user1Expense?: number;
  user2Income?: number;
  user2Expense?: number;
}

// O hook agora aceita uma lista de IDs de utilizadores
export const useTransactionSummary = (period: Period | null, memberIds: string[] = []) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<TransactionSummary>({ totalIncome: 0, totalExpense: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    // Se memberIds for fornecido, usa-o. Senão, usa o ID do utilizador logado.
    const idsToFetch = memberIds.length > 0 ? memberIds : (user ? [user.uid] : []);
    if (idsToFetch.length === 0 || !period) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      let totalIncome = 0, totalExpense = 0;
      let user1Income = 0, user1Expense = 0;
      let user2Income = 0, user2Expense = 0;

      // Itera sobre os IDs (seja 1 ou 2) e busca as transações de cada um
      for (const [index, userId] of idsToFetch.entries()) {
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
            totalIncome += data.amount;
            // CORREÇÃO: Substituído o operador ternário por um if/else
            if (index === 0) {
              user1Income += data.amount;
            } else {
              user2Income += data.amount;
            }
          } else if (data.type === 'expense') {
            totalExpense += data.amount;
            // CORREÇÃO: Substituído o operador ternário por um if/else
            if (index === 0) {
              user1Expense += data.amount;
            } else {
              user2Expense += data.amount;
            }
          }
        });
      }

      setSummary({ totalIncome, totalExpense, user1Income, user1Expense, user2Income, user2Expense });

    } catch (error) {
      console.error("Erro ao buscar resumo de transações:", error);
      setSummary({ totalIncome: 0, totalExpense: 0 });
    } finally {
      setLoading(false);
    }
    // Usamos JSON.stringify para que o array de dependências do useCallback seja estável
  }, [user, period, JSON.stringify(memberIds)]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading };
};