import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useCategories } from './useCategories';
import app from '../firebaseConfig';
import { CategorySummaryItem } from '../components/CategorySummaryList'; // Importa a nova interface

// Estrutura dos dados que o gráfico de pizza/rosca espera
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export const useCategorySummary = (period: { startDate: Date; endDate: Date } | null) => {
  const { user } = useAuth();
  const { availableCategories, fetchCategories } = useCategories();
  
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [summaryList, setSummaryList] = useState<CategorySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchSummary = useCallback(async () => {
    if (!user || !period || availableCategories.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const q = query(
        transactionsRef,
        where('type', '==', 'expense'),
        where('date', '>=', period.startDate),
        where('date', '<=', period.endDate)
      );

      const querySnapshot = await getDocs(q);
      
      const categoryTotals = new Map<string, number>();

      querySnapshot.forEach(doc => {
        const transaction = doc.data();
        if (transaction.categories && Array.isArray(transaction.categories)) {
          transaction.categories.forEach((categoryName: string) => {
            const currentTotal = categoryTotals.get(categoryName) || 0;
            categoryTotals.set(categoryName, currentTotal + transaction.amount);
          });
        }
      });

      const grandTotal = Array.from(categoryTotals.values()).reduce((sum, total) => sum + total, 0);

      const labels: string[] = [];
      const data: number[] = [];
      const backgroundColor: string[] = [];
      const list: CategorySummaryItem[] = [];

      categoryTotals.forEach((total, categoryName) => {
        labels.push(categoryName);
        data.push(total);
        
        const categoryInfo = availableCategories.find(c => c.name === categoryName);
        const color = categoryInfo?.color || '#cccccc';
        backgroundColor.push(color);

        list.push({
          name: categoryName,
          total: total,
          percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
          color: color,
        });
      });

      setChartData({
        labels,
        datasets: [{ data, backgroundColor, borderColor: [], borderWidth: 0 }],
      });
      
      // Ordena a lista do maior gasto para o menor
      setSummaryList(list.sort((a, b) => b.total - a.total));

    } catch (error) {
      console.error("Erro ao buscar resumo de categorias:", error);
      setChartData(null);
      setSummaryList([]);
    } finally {
      setLoading(false);
    }
  }, [user, period, availableCategories]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { chartData, summaryList, loading };
};