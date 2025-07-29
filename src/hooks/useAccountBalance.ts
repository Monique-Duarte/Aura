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

    // CORREÇÃO: Usamos onSnapshot para "ouvir" as alterações em tempo real.
    // Agora, o saldo será recalculado sempre que uma nova transação for adicionada,
    // atualizada ou removida, em qualquer página.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let total = 0;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const amount = typeof data.amount === 'number' ? data.amount : 0;
        let operation = '';

        if (data.type === 'income') {
          total += amount;
          operation = `+${amount} (Renda)`;
        } else if (data.type === 'expense') {
          if (data.paymentMethod === 'debit' || (data.paymentMethod === 'credit' && data.isPaid === true)) {
            total -= amount;
            operation = `-${amount} (Gasto Pago/Débito)`;
          } else {
            operation = `±0 (Gasto Crédito não pago)`;
          }
        } else if (data.type === 'reserve_add') {
          total -= amount;
          operation = `-${amount} (Guardado na Reserva)`;
        } else if (data.type === 'reserve_withdraw') {
          total += amount;
          operation = `+${amount} (Resgatado da Reserva)`;
        }
        
        console.log(`Transação: ${data.description || 'Sem descrição'} | Operação: ${operation} | Saldo Parcial: ${total}`);
      });
      setBalance(total);
      setLoading(false);
    }, (error) => {
        console.error("Erro ao calcular o saldo total:", error);
        setBalance(0);
        setLoading(false);
    });

    // Limpa o "ouvinte" quando o componente é desmontado para evitar fugas de memória
    return () => unsubscribe();
  }, [user]);

  return { balance, loading };
};
