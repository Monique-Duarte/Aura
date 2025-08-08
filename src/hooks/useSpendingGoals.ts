import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import app from '../firebaseConfig';
import { useAuth } from './AuthContext';

const firestore = getFirestore(app);

export interface SpendingGoal {
  id: string;
  userId?: string;
  categoryId: string;
  amount: number;
  period: string;
}

export const useSpendingGoals = (period: string | null) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SpendingGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !period) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const goalsCollectionRef = collection(firestore, 'users', user.uid, 'budgets');
    const goalsQuery = query(goalsCollectionRef, where('period', '==', period));

    const unsubscribe = onSnapshot(goalsQuery, (querySnapshot) => {
      const fetchedGoals: SpendingGoal[] = [];
      querySnapshot.forEach((doc) => {
        fetchedGoals.push({ id: doc.id, ...doc.data() } as SpendingGoal);
      });
      setGoals(fetchedGoals);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao buscar metas de gastos:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, period]);

  const setGoal = async (categoryId: string, amount: number) => {
    if (!user || !period) {
      throw new Error("Utilizador ou período não definido para salvar a meta.");
    }

    const existingGoal = goals.find(g => g.categoryId === categoryId);

    if (existingGoal) {

      setGoals(currentGoals =>
        currentGoals.map(g =>
          g.id === existingGoal.id ? { ...g, amount: amount } : g
        )
      );
    } else {

      const optimisticGoal: SpendingGoal = {
        id: `temp_${Date.now()}`,
        categoryId,
        amount,
        period,
      };
      setGoals(currentGoals => [...currentGoals, optimisticGoal]);
    }

    try {
      if (existingGoal) {
        const goalDocRef = doc(firestore, 'users', user.uid, 'budgets', existingGoal.id);
        await updateDoc(goalDocRef, { amount });
      } else {
        const goalsCollectionRef = collection(firestore, 'users', user.uid, 'budgets');
        await addDoc(goalsCollectionRef, {
          categoryId,
          amount,
          period,
        });
      }
    } catch (error) {
        console.error("Falha na operação com o Firebase, revertendo a UI:", error);
        // Se houver um erro, o onSnapshot (ou uma lógica de reversão manual)
        // garantirá que a UI volte ao estado correto.
    }
  };

  return { goals, loading, error, setGoal };
};
