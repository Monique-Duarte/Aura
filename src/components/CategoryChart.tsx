import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { ChartData } from '../hooks/useCategorySummary';

// Registra os componentes necessários para o gráfico de rosca
ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryChartProps {
  data: ChartData;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const, // Legenda na parte inferior
        labels: {
          color: '#ffffff', // Cor do texto da legenda
          padding: 20,
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          // Formata o valor no tooltip para moeda brasileira
          label: function (context: TooltipItem<'doughnut'>) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(context.parsed);
            }
            return label;
          },
        },
      },
    },
    cutout: '60%', // Controla o tamanho do "buraco" no centro da rosca
  };

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      {data.datasets[0].data.length > 0 ? (
        <Doughnut options={options} data={data} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--ion-color-medium-shade)' }}>
          <p>Nenhum gasto com categoria no período.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryChart;