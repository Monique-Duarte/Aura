import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Interface para os dados do gráfico, garantindo que tudo seja bem tipado
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
  }[];
  // Estrutura extra para carregar os dados detalhados para o tooltip
  detailedData: {
    name: string;
    userAmount: number;
    partnerAmount: number;
  }[];
}

interface FamilyCategoryChartProps {
  data: ChartData;
  user1Name: string;
  user2Name: string;
}

const FamilyCategoryChart: React.FC<FamilyCategoryChartProps> = ({ data, user1Name, user2Name }) => {
  const options = {
    indexAxis: 'y' as const, // Gráfico de barras horizontal
    responsive: true,
    plugins: {
      legend: { display: false }, // Legenda não é mais necessária, a barra já tem cor
      title: { display: false },
      tooltip: {
        callbacks: {
          // Callback para o título do tooltip (mostra o nome da categoria)
          title: (context: TooltipItem<'bar'>[]) => {
            return context[0]?.label || '';
          },
          // Callback para o corpo do tooltip (mostra o valor total)
          label: (context: TooltipItem<'bar'>) => {
            const value = context.parsed.x; // Usar 'x' para gráficos horizontais
            if (value !== null) {
              return `Total: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            }
            return '';
          },
          // Callback para o rodapé do tooltip (mostra o detalhamento por usuário)
          footer: (context: TooltipItem<'bar'>[]) => {
            const index = context[0]?.dataIndex;
            if (index === undefined || !data.detailedData[index]) {
              return '';
            }
            const detail = data.detailedData[index];
            const user1Text = `${user1Name}: ${detail.userAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            const user2Text = `${user2Name}: ${detail.partnerAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            return [user1Text, user2Text];
          },
        }
      }
    },
    scales: {
      x: { 
        ticks: { color: '#ffffff' }, 
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: { display: false }
      },
      y: { 
        ticks: { color: '#ffffff' }, 
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
    },
  };

  return <Bar options={options} data={data} />;
};

export default FamilyCategoryChart;