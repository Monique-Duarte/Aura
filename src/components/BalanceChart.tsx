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
        backgroundColor: 'rgba(45, 211, 111, 0.7)',
        borderColor: 'rgba(45, 211, 111, 1)',
        borderWidth: 1,
        borderRadius: 5,
      },
      {
        label: 'Gastos',
        data: [totalExpense],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        borderRadius: 5,
      },
      {
        label: 'Reserva',
        data: [totalReserved],
        // Cor amarela para combinar com a cor primária do app
        backgroundColor: 'rgba(255, 204, 41, 0.7)', 
        borderColor: 'rgba(255, 204, 41, 1)',
        borderWidth: 1,
        borderRadius: 5,
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
          // --- ALTERAÇÕES PARA MELHORAR A LEGENDA ---
          font: {
            size: 14, // Aumenta o tamanho da fonte
            weight: 'bold' as const, // Deixa a fonte em negrito
          },
          usePointStyle: true, // Usa o estilo de ponto (círculo, etc.)
          pointStyle: 'rectRounded', // Define o estilo como um retângulo arredondado
          padding: 20, // Aumenta o espaçamento entre os itens
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