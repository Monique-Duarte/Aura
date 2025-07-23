import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { ChartData } from '../hooks/useCategorySummary';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FamilyCategoryChartProps {
  data: ChartData;
  user1Name: string;
  user2Name: string;
}

const FamilyCategoryChart: React.FC<FamilyCategoryChartProps> = ({ data, user1Name, user2Name }) => {
  if (data.datasets[0]) data.datasets[0].label = user1Name;
  if (data.datasets[1]) data.datasets[1].label = user2Name;

  const options = {
    indexAxis: 'y' as const, // Gráfico de barras horizontal
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#ffffff' } },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const label = context.dataset.label || '';
            const value = context.parsed.x;
            if (value !== null) {
              return `${label}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: { stacked: true, ticks: { color: '#ffffff' } }, // Empilha as barras no eixo X
      y: { stacked: true, ticks: { color: '#ffffff' } }, // Empilha as barras no eixo Y
    },
  };

  return <Bar options={options} data={data} />;
};

// A linha 'export default' garante que este componente seja a exportação padrão.
export default FamilyCategoryChart;
