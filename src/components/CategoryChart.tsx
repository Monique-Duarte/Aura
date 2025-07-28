import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem,
  Chart, // Importar o tipo Chart para o plugin
} from 'chart.js';
import { ChartData } from '../hooks/useCategorySummary';

// Registra os componentes necessários para o gráfico de rosca
ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryChartProps {
  data: ChartData;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw: (chart: Chart) => {
      if (chart.data.datasets[0].data.length === 0) return;

      const ctx = chart.ctx;
      const { top, left, width, height } = chart.chartArea;
      const x = left + width / 2;
      const y = top + height / 2;

      const total = chart.data.datasets[0].data.reduce((sum, value) => (sum as number) + (value as number), 0) as number;
      const totalFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(total);

      ctx.save();
      
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('Total Gasto', x, y - 5);

      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(totalFormatted, x, y + 15);

      ctx.restore();
    },
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          padding: 20,
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          usePointStyle: true,
          pointStyle: 'rectRounded',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
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
    cutout: '60%',
  };

  return (
    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
      {data.datasets[0].data.length > 0 ? (
        <Doughnut options={options} data={data} plugins={[centerTextPlugin]} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--ion-color-medium-shade)' }}>
          <p>Nenhum gasto com categoria no período.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryChart;