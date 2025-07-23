import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FamilyBalanceChartProps {
  summary: {
    user1Income?: number;
    user1Expense?: number;
    user2Income?: number;
    user2Expense?: number;
  };
  user1Name: string;
  user2Name: string;
}

const FamilyBalanceChart: React.FC<FamilyBalanceChartProps> = ({ summary, user1Name, user2Name }) => {
  const data = {
    labels: ['Renda', 'Gastos'],
    datasets: [
      {
        label: user1Name,
        data: [summary.user1Income, summary.user1Expense],
        backgroundColor: ['rgba(45, 211, 111, 0.8)', 'rgba(235, 68, 90, 0.8)'], // Cores sólidas
      },
      {
        label: user2Name,
        data: [summary.user2Income, summary.user2Expense],
        backgroundColor: ['rgba(45, 211, 111, 0.5)', 'rgba(235, 68, 90, 0.5)'], // Cores mais claras
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#ffffff' } },
      tooltip: {
        callbacks: {
          // CORREÇÃO: Usa o tipo 'TooltipItem' em vez de 'any'
          label: (context: TooltipItem<'bar'>) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value !== null && value !== undefined) {
              return `${label}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}`;
            }
            return label;
          }
        }
      }
    },
    scales: { y: { ticks: { color: '#ffffff' } }, x: { ticks: { color: '#ffffff' } } },
  };

  return <Bar options={options} data={data} />;
};

export default FamilyBalanceChart;