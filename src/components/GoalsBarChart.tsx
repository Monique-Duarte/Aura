import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { CategorySummaryItem } from '../hooks/useCategorySummary';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GoalsBarChartProps {
  summary: CategorySummaryItem[];
}

const GoalsBarChart: React.FC<GoalsBarChartProps> = ({ summary }) => {
  const goalsData = summary.filter(item => item.goalAmount && item.goalAmount > 0);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#ffffff' }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const data = {
    labels: goalsData.map(item => item.name),
    datasets: [
      {
        label: 'Gasto',
        data: goalsData.map(item => item.total),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Meta',
        data: goalsData.map(item => item.goalAmount),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%', padding: '10px' }}>
      {data.labels.length > 0 ? (
        <Bar options={options} data={data} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--ion-color-medium-shade)' }}>
          <p>Nenhuma meta definida para o período.</p>
        </div>
      )}
    </div>
  );
};

export default GoalsBarChart;