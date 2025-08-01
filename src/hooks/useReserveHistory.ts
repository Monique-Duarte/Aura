import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import app from '../firebaseConfig';
import { calculateReserveHistory, ReserveTransaction } from '../logic/reserveLogic';

// --- Interfaces ---
interface Period {
  startDate: Date;
  endDate: Date;
}

interface ReserveGoal {
  id: string;
  name: string;
  yieldPercentage?: number;
}

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
  tension: number;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Interface do hook atualizada para incluir a nova informação
interface ReserveHistory {
  totalChartData: ChartData;
  individualChartData: ChartData;
  transactions: ReserveTransaction[];
  lastDailyYield: number; // NOVA PROPRIEDADE
  loading: boolean;
}

const CHART_COLORS = [
  'rgba(255, 204, 41, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 99, 132, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
];

export const useReserveHistory = (period: Period | null, goals: ReserveGoal[]): ReserveHistory => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Omit<ReserveHistory, 'loading'>>({
    totalChartData: { labels: [], datasets: [] },
    individualChartData: { labels: [], datasets: [] },
    transactions: [],
    lastDailyYield: 0, // Adicionado ao estado inicial
  });
  const [loading, setLoading] = useState(true);

  const calculateAndSetHistory = useCallback(async () => {
    if (!user || !period || goals.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const db = getFirestore(app);
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      
      const q = query(
        transactionsRef,
        where('type', 'in', ['reserve_add', 'reserve_withdraw']),
        where('date', '<=', Timestamp.fromDate(period.endDate))
      );
      
      const querySnapshot = await getDocs(q);
      const allTransactions = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        date: (doc.data().date as Timestamp).toDate(),
      })) as ReserveTransaction[];

      const transactionsInPeriod = allTransactions
        .filter(t => t.date >= period.startDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // 1. Calcula o histórico para o total da reserva
      const totalYieldRate = goals.reduce((sum, goal) => sum + (goal.yieldPercentage || 0), 0) / (goals.length || 1) / 100;
      
      // Captura o histórico E o rendimento diário da função de lógica
      const { historyPoints: totalHistoryPoints, lastDailyYield } = calculateReserveHistory(allTransactions, period, totalYieldRate);

      // 2. Calcula o histórico para cada objetivo individualmente
      const individualDatasets: ChartDataset[] = goals.map((goal, index) => {
        const goalTransactions = allTransactions.filter(t => t.reserveId === goal.id);
        const yieldRate = (goal.yieldPercentage || 0) / 100;
        // Aqui só precisamos dos pontos do histórico, então podemos ignorar o rendimento individual
        const { historyPoints } = calculateReserveHistory(goalTransactions, period, yieldRate);
        
        return {
          label: goal.name,
          data: historyPoints.map(p => p.balance),
          borderColor: CHART_COLORS[index % CHART_COLORS.length],
          backgroundColor: CHART_COLORS[index % CHART_COLORS.length].replace('1)', '0.2)'),
          fill: false,
          tension: 0.4,
        };
      });

      // 3. Define o estado com os dados calculados
      setHistory({
        totalChartData: {
          labels: totalHistoryPoints.map(p => p.date),
          datasets: [{
            label: 'Total na Reserva',
            data: totalHistoryPoints.map(p => p.balance),
            borderColor: 'rgba(255, 204, 41, 1)',
            backgroundColor: 'rgba(255, 204, 41, 0.2)',
            fill: true,
            tension: 0.4,
          }],
        },
        individualChartData: {
          labels: totalHistoryPoints.map(p => p.date),
          datasets: individualDatasets,
        },
        transactions: transactionsInPeriod,
        lastDailyYield: lastDailyYield, // Guarda o novo valor no estado
      });

    } catch (error) {
      console.error("Erro ao calcular histórico da reserva:", error);
    } finally {
      setLoading(false);
    }
  }, [user, period, goals]);

  useEffect(() => {
    calculateAndSetHistory();
  }, [calculateAndSetHistory]);

  return { ...history, loading };
};