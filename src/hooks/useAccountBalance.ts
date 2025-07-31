import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import app from '../firebaseConfig';

export const useAccountBalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setBalance(0);
      return; // Sai se não houver utilizador
    }

    setLoading(true);
    const db = getFirestore(app);
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let total = 0;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const amount = typeof data.amount === 'number' ? data.amount : 0;

        if (data.type === 'income') {
          total += amount;
        } else if (data.type === 'expense') {
          if (data.paymentMethod === 'debit' || (data.paymentMethod === 'credit' && data.isPaid === true)) {
            total -= amount;
          }
        } else if (data.type === 'reserve_add') {
          total -= amount;
        } else if (data.type === 'reserve_withdraw') {
          total += amount;
        }
      });
      setBalance(total);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao calcular o saldo total:", error);
      setBalance(0);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return { balance, loading };
}