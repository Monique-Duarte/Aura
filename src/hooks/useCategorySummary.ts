import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, Timestamp, onSnapshot } from 'firebase/firestore';
import { useCategories } from './useCategories';
import { useSpendingGoals } from './useSpendingGoals'; // 1. Importa o hook de metas
import app from '../firebaseConfig';

// 2. A interface agora inclui a meta (opcional)
export interface CategorySummaryItem {
  name: string;
  total: number;
  percentage: number;
  color: string;
  goalAmount?: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export const useCategorySummary = (period: { startDate: Date; endDate: Date } | null, memberIds: string[] = []) => {
  const { user } = useAuth();
  const { availableCategories } = useCategories();
  
  // 3. Busca as metas para o período atual
  const periodString = period ? `${period.startDate.getFullYear()}-${String(period.startDate.getMonth() + 1).padStart(2, '0')}` : null;
  const { goals, loading: goalsLoading } = useSpendingGoals(periodString);
  
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [summaryList, setSummaryList] = useState<CategorySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    const idsToFetch = memberIds.length > 0 ? memberIds : (user ? [user.uid] : []);
    if (idsToFetch.length === 0 || !period || availableCategories.length === 0) {
      setLoading(false);
      return;
    }

    // O estado de loading agora considera o carregamento das metas
    if (goalsLoading) {
      setLoading(true);
      return;
    }

    const db = getFirestore(app);
    const unsubscribes = idsToFetch.map(userId => {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const q = query(
        transactionsRef,
        where('type', '==', 'expense'),
        where('date', '>=', Timestamp.fromDate(period.startDate)),
        where('date', '<=', Timestamp.fromDate(period.endDate))
      );

      return onSnapshot(q, (querySnapshot) => {
        const categoryTotals = new Map<string, number[]>();

        querySnapshot.forEach(doc => {
          const transaction = doc.data();
          const categories = (transaction.categories && transaction.categories.length > 0) 
            ? transaction.categories 
            : ['Outros'];

          categories.forEach((categoryName: string) => {
            const totals = categoryTotals.get(categoryName) || Array(idsToFetch.length).fill(0);
            const userIndex = idsToFetch.indexOf(userId);
            if (userIndex !== -1) {
                totals[userIndex] += transaction.amount;
            }
            categoryTotals.set(categoryName, totals);
          });
        });

        const grandTotal = Array.from(categoryTotals.values()).reduce((sum, totals) => sum + totals.reduce((a, b) => a + b, 0), 0);
        setTotalExpense(grandTotal);

        const list: CategorySummaryItem[] = [];
        const labels: string[] = [];
        const backgroundColor: string[] = [];
        const dataSetsData = idsToFetch.map(() => [] as number[]);

        categoryTotals.forEach((totals, categoryName) => {
          const categoryInfo = availableCategories.find(c => c.name === categoryName);
          const color = categoryInfo?.color || '#cccccc';
          const goal = goals.find(g => g.categoryId === categoryInfo?.id);

          list.push({
            name: categoryName,
            total: totals.reduce((a, b) => a + b, 0),
            percentage: grandTotal > 0 ? (totals.reduce((a, b) => a + b, 0) / grandTotal) * 100 : 0,
            color: color,
            goalAmount: goal?.amount,
          });

          labels.push(categoryName);
          backgroundColor.push(color);
          totals.forEach((total, index) => {
            dataSetsData[index].push(total);
          });
        });

        setChartData({
          labels,
          datasets: idsToFetch.map((id, index) => ({
            label: `Utilizador ${index + 1}`,
            data: dataSetsData[index],
            backgroundColor: backgroundColor,
          })),
        });
        
        setSummaryList(list.sort((a, b) => b.total - a.total));
        setLoading(false);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());

  }, [user, period, availableCategories, memberIds, goals, goalsLoading]);

  return { chartData, summaryList, loading, totalExpense };
};