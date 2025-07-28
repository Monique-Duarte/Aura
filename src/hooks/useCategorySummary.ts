import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useCategories } from './useCategories';
import app from '../firebaseConfig';

// A interface para a lista de resumo é exportada a partir daqui
export interface CategorySummaryItem {
  name: string;
  total: number;
  percentage: number;
  color: string;
}

// A interface para os dados do gráfico, com a correção
export interface ChartData {
  labels: string[];
  datasets: {
    label?: string; // CORREÇÃO: Adicionado para o gráfico de barras de família
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export const useCategorySummary = (period: { startDate: Date; endDate: Date } | null, memberIds: string[] = []) => {
  const { user } = useAuth();
  const { availableCategories, fetchCategories } = useCategories();
  
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [summaryList, setSummaryList] = useState<CategorySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchSummary = useCallback(async () => {
    const idsToFetch = memberIds.length > 0 ? memberIds : (user ? [user.uid] : []);
    if (idsToFetch.length === 0 || !period || availableCategories.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore(app);
      const categoryTotals = new Map<string, number[]>(); // Armazena [totalUser1, totalUser2]

      for (const [index, userId] of idsToFetch.entries()) {
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const q = query(
          transactionsRef,
          where('type', '==', 'expense'),
          where('date', '>=', period.startDate),
          where('date', '<=', period.endDate)
        );
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
          const transaction = doc.data();
          if (transaction.categories && Array.isArray(transaction.categories)) {
            transaction.categories.forEach((categoryName: string) => {
              const totals = categoryTotals.get(categoryName) || [0, 0];
              totals[index] += transaction.amount;
              categoryTotals.set(categoryName, totals);
            });
          }
        });
      }

      const grandTotal = Array.from(categoryTotals.values()).reduce((sum, totals) => sum + totals[0] + totals[1], 0);

      const labels: string[] = [];
      const dataUser1: number[] = [];
      const dataUser2: number[] = [];
      const backgroundColor: string[] = [];
      const list: CategorySummaryItem[] = [];

      categoryTotals.forEach((totals, categoryName) => {
        labels.push(categoryName);
        dataUser1.push(totals[0]);
        dataUser2.push(totals[1]);
        
        const categoryInfo = availableCategories.find(c => c.name === categoryName);
        const color = categoryInfo?.color || '#cccccc';
        backgroundColor.push(color);

        list.push({
          name: categoryName,
          total: totals[0] + totals[1],
          percentage: grandTotal > 0 ? ((totals[0] + totals[1]) / grandTotal) * 100 : 0,
          color: color,
        });
      });

      if (idsToFetch.length > 1) {
        setChartData({
          labels,
          datasets: [
            { label: 'Utilizador 1', data: dataUser1, backgroundColor: backgroundColor.map(c => `${c}B3`) },
            { label: 'Utilizador 2', data: dataUser2, backgroundColor: backgroundColor.map(c => `${c}80`) },
          ],
        });
      } else {
        setChartData({
          labels,
          datasets: [{ data: dataUser1, backgroundColor, borderColor: [], borderWidth: 0 }],
        });
      }
      
      setSummaryList(list.sort((a, b) => b.total - a.total));

    } catch (error) {
      console.error("Erro ao buscar resumo de categorias:", error);
    } finally {
      setLoading(false);
    }
  }, [user, period, availableCategories, JSON.stringify(memberIds)]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { chartData, summaryList, loading };
};