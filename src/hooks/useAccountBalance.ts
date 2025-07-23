import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import app from '../firebaseConfig';

export const useAccountBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(transactionsRef); // Sem filtro de data para obter todas as transações

      const querySnapshot = await getDocs(q);
      
      let total = 0;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'income') {
          total += data.amount;
        } else if (data.type === 'expense') {
          // Apenas subtrai se for débito ou se for crédito E estiver pago
          if (data.paymentMethod === 'debit' || (data.paymentMethod === 'credit' && data.isPaid === true)) {
            total -= data.amount;
          }
        }
      });

      setBalance(total);

    } catch (error) {
      console.error("Erro ao calcular o saldo total:", error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading };
};