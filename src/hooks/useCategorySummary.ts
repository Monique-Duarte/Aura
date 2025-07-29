import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useCategories } from './useCategories';
import app from '../firebaseConfig';

export interface CategorySummaryItem {
  name: string;
  total: number;
  percentage: number;
  color: string;
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
  
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [summaryList, setSummaryList] = useState<CategorySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpense, setTotalExpense] = useState(0);

  const fetchSummary = useCallback(async () => {
    const idsToFetch = memberIds.length > 0 ? memberIds : (user ? [user.uid] : []);
    if (idsToFetch.length === 0 || !period || availableCategories.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      const categoryTotals = new Map<string, number[]>();

      for (const [index, userId] of idsToFetch.entries()) {
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const q = query(
          transactionsRef,
          where('type', '==', 'expense'),
          where('date', '>=', Timestamp.fromDate(period.startDate)),
          where('date', '<=', Timestamp.fromDate(period.endDate))
        );
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
          const transaction = doc.data();
          const categories = (transaction.categories && transaction.categories.length > 0) 
            ? transaction.categories 
            : ['Outros'];

          categories.forEach((categoryName: string) => {
            const totals = categoryTotals.get(categoryName) || Array(idsToFetch.length).fill(0);
            totals[index] += transaction.amount;
            categoryTotals.set(categoryName, totals);
          });
        });
      }

      const grandTotal = Array.from(categoryTotals.values()).reduce((sum, totals) => sum + totals.reduce((a, b) => a + b, 0), 0);
      setTotalExpense(grandTotal);

      const labels: string[] = [];
      const dataSetsData = idsToFetch.map(() => [] as number[]);
      const backgroundColor: string[] = [];
      const list: CategorySummaryItem[] = [];

      categoryTotals.forEach((totals, categoryName) => {
        labels.push(categoryName);
        totals.forEach((total, index) => {
          dataSetsData[index].push(total);
        });
        
        const categoryInfo = availableCategories.find(c => c.name === categoryName);
        const color = categoryInfo?.color || '#cccccc';
        backgroundColor.push(color);

        list.push({
          name: categoryName,
          total: totals.reduce((a, b) => a + b, 0),
          percentage: grandTotal > 0 ? (totals.reduce((a, b) => a + b, 0) / grandTotal) * 100 : 0,
          color: color,
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

    } catch (error) {
      console.error("Erro ao buscar resumo de categorias:", error);
    } finally {
      setLoading(false);
    }
  }, [user, period, availableCategories, memberIds]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { chartData, summaryList, loading, totalExpense };
};