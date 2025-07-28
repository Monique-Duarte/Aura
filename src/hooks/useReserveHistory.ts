import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import app from '../firebaseConfig';

// --- Interfaces ---
interface Period {
  startDate: Date;
  endDate: Date;
}

export interface ReserveTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: 'reserve_add' | 'reserve_withdraw';
  reserveId: string;
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

interface ReserveHistory {
  totalChartData: ChartData;
  individualChartData: ChartData;
  transactions: ReserveTransaction[];
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
  });
  const [loading, setLoading] = useState(true);

  const calculateHistory = useCallback(async () => {
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

      const goalsMap = new Map(goals.map(g => [g.id, { name: g.name, yieldRate: (g.yieldPercentage || 0) / 100 }]));
      const goalBalances = new Map<string, number>(Array.from(goalsMap.keys()).map(id => [id, 0]));

      const historyPoints: { date: Date; totalBalance: number; balances: Map<string, number> }[] = [];
      
      allTransactions
        .filter(t => t.date < period.startDate)
        .forEach(t => {
          const current = goalBalances.get(t.reserveId) || 0;
          goalBalances.set(t.reserveId, current + (t.type === 'reserve_add' ? t.amount : -t.amount));
        });

      const transactionsInPeriod = allTransactions
        .filter(t => t.date >= period.startDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      for (let d = new Date(period.startDate); d <= period.endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);

        transactionsInPeriod
          .filter(t => t.date.toDateString() === currentDate.toDateString())
          .forEach(t => {
            const current = goalBalances.get(t.reserveId) || 0;
            goalBalances.set(t.reserveId, current + (t.type === 'reserve_add' ? t.amount : -t.amount));
          });
        
        if (currentDate.getDate() === 1) {
          for (const [goalId, balance] of goalBalances.entries()) {
            if (balance > 0) {
              const goalInfo = goalsMap.get(goalId);
              if (goalInfo && goalInfo.yieldRate > 0) {
                const monthlyYield = balance * goalInfo.yieldRate;
                goalBalances.set(goalId, balance + monthlyYield);
              }
            }
          }
        }
        
        const totalBalance = Array.from(goalBalances.values()).reduce((sum, b) => sum + b, 0);
        historyPoints.push({ date: new Date(currentDate), totalBalance, balances: new Map(goalBalances) });
      }

      const labels = historyPoints.map(p => p.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

      setHistory({
        totalChartData: {
          labels,
          datasets: [{
            label: 'Total na Reserva',
            data: historyPoints.map(p => p.totalBalance),
            borderColor: 'rgba(255, 204, 41, 1)',
            backgroundColor: 'rgba(255, 204, 41, 0.2)',
            fill: true,
            tension: 0.4,
          }],
        },
        individualChartData: {
          labels,
          datasets: Array.from(goalsMap.entries()).map(([goalId, goalInfo], index) => ({
            label: goalInfo.name,
            data: historyPoints.map(p => p.balances.get(goalId) || 0),
            borderColor: CHART_COLORS[index % CHART_COLORS.length],
            backgroundColor: CHART_COLORS[index % CHART_COLORS.length].replace('1)', '0.2)'),
            fill: false,
            tension: 0.4,
          })),
        },
        transactions: transactionsInPeriod,
      });

    } catch (error) {
      console.error("Erro ao calcular histórico da reserva:", error);
    } finally {
      setLoading(false);
    }
  }, [user, period, goals]);

  useEffect(() => {
    calculateHistory();
  }, [calculateHistory]);

  return { ...history, loading };
};