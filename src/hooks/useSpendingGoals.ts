import { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, query, onSnapshot, addDoc, updateDoc, doc, where, getDocs } from 'firebase/firestore';
import app from '../firebaseConfig';
import { useAuth } from './AuthContext';

const firestore = getFirestore(app);

// 1. A interface volta a ter o campo 'period' para guardar o histórico
export interface SpendingGoal {
  id: string;
  categoryId: string;
  amount: number;
  period: string;
}

// O hook agora recebe o período para saber qual histórico buscar
export const useSpendingGoals = (period: string | null) => {
  const { user } = useAuth();
  const [allGoals, setAllGoals] = useState<SpendingGoal[]>([]); // Guarda todo o histórico
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Efeito para buscar TODAS as metas do utilizador
  useEffect(() => {
    if (!user) {
      setAllGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const goalsCollectionRef = collection(firestore, 'users', user.uid, 'budgets');
    const q = query(goalsCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedGoals: SpendingGoal[] = [];
      querySnapshot.forEach((doc) => {
        fetchedGoals.push({ id: doc.id, ...doc.data() } as SpendingGoal);
      });
      setAllGoals(fetchedGoals);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao buscar metas de gastos:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Lógica para determinar as metas ATIVAS para o período selecionado
  const activeGoals = useMemo(() => {
    if (!period) return [];

    const latestGoals = new Map<string, SpendingGoal>();

    // Filtra as metas até o período atual e as ordena
    const relevantGoals = allGoals
      .filter(g => g.period <= period)
      .sort((a, b) => b.period.localeCompare(a.period));

    // Para cada categoria, encontra a meta mais recente
    for (const goal of relevantGoals) {
      if (!latestGoals.has(goal.categoryId)) {
        latestGoals.set(goal.categoryId, goal);
      }
    }
    return Array.from(latestGoals.values());
  }, [allGoals, period]);


  // 3. Função de salvar atualizada para criar um novo registo histórico
  const setGoal = async (categoryId: string, amount: number) => {
    if (!user || !period) {
      throw new Error("Utilizador ou período não definido para salvar a meta.");
    }

    const goalsCollectionRef = collection(firestore, 'users', user.uid, 'budgets');
    
    // Verifica se já existe uma meta EXATAMENTE para este período
    const q = query(goalsCollectionRef, where('categoryId', '==', categoryId), where('period', '==', period));
    const existingDocs = await getDocs(q);

    if (!existingDocs.empty) {
      // Se já existe, atualiza a meta deste mês
      const goalDocRef = doc(firestore, 'users', user.uid, 'budgets', existingDocs.docs[0].id);
      await updateDoc(goalDocRef, { amount });
    } else {
      // Se não existe, cria um novo registo para este mês, preservando o histórico
      await addDoc(goalsCollectionRef, {
        categoryId,
        amount,
        period,
      });
    }
  };

  return { goals: activeGoals, loading, error, setGoal };
};