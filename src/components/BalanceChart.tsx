import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- ALTERAÇÃO 1: Adicionada a propriedade 'totalReserved' ---
interface BalanceChartProps {
  totalIncome: number;
  totalExpense: number;
  totalReserved: number;
}

const BalanceChart: React.FC<BalanceChartProps> = ({ totalIncome, totalExpense, totalReserved }) => {
  const data = {
    labels: ['Balanço Mensal'],
    datasets: [
      {
        label: 'Renda',
        data: [totalIncome],
        backgroundColor: 'rgba(45, 211, 111, 0.6)',
        borderColor: 'rgba(45, 211, 111, 1)',
        borderWidth: 1,
      },
      {
        label: 'Gastos',
        data: [totalExpense],
        backgroundColor: 'rgba(235, 68, 90, 0.6)',
        borderColor: 'rgba(235, 68, 90, 1)',
        borderWidth: 1,
      },
      // --- ALTERAÇÃO 2: Novo "dataset" para a barra de Reserva ---
      {
        label: 'Reserva',
        data: [totalReserved],
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Cor azul
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#ffffff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#ffffff',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      <Bar options={options} data={data} />
    </div>
  );
};

export default BalanceChart;