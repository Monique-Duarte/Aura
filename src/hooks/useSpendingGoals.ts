import { useState, useEffect } from 'react';
import { firestore } from '../firebase/config'; 
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';


export interface SpendingGoal {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: string;
}

export const useSpendingGoals = (userId: string | null, period: string) => {
  const [goals, setGoals] = useState<SpendingGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Efeito para buscar as metas do período
  useEffect(() => {
    if (!userId || !period) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const goalsQuery = query(
      collection(firestore, 'budgets'), // Lembre-se, a coleção continua "budgets"
      where('userId', '==', userId),
      where('period', '==', period)
    );

    // Usamos onSnapshot para que as metas se atualizem em tempo real
    // se alteradas em outro dispositivo, por exemplo.
    const unsubscribe = onSnapshot(goalsQuery, (querySnapshot) => {
      const fetchedGoals: SpendingGoal[] = [];
      querySnapshot.forEach((doc) => {
        fetchedGoals.push({ id: doc.id, ...doc.data() } as SpendingGoal);
      });
      setGoals(fetchedGoals);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao buscar metas:", err);
      setError(err);
      setLoading(false);
    });

    // Limpa o listener quando o componente desmontar ou as dependências mudarem
    return () => unsubscribe();
  }, [userId, period]); // Roda de novo se o user ou o período mudar

  // Função para criar ou atualizar uma meta
  const setGoal = async (categoryId: string, amount: number) => {
    if (!userId || !period) {
      throw new Error("Utilizador ou período não definido.");
    }

    // Procura se já existe uma meta para essa categoria e período
    const existingGoal = goals.find(g => g.categoryId === categoryId);

    if (existingGoal) {
      // --- ATUALIZAR META EXISTENTE ---
      const goalDocRef = doc(firestore, 'budgets', existingGoal.id);
      await updateDoc(goalDocRef, { amount });
    } else {
      // --- CRIAR NOVA META ---
      await addDoc(collection(firestore, 'budgets'), {
        userId,
        categoryId,
        amount,
        period,
      });
    }
  };

  return { goals, loading, error, setGoal };
};