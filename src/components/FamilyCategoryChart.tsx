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
  // Gera cores dinâmicas para cada categoria
  const generateCategoryColors = (categories: string[]) => {
    const baseColors = [
      { base: 'rgba(255, 99, 132, 0.8)', light: 'rgba(255, 99, 132, 0.5)' }, // Vermelho
      { base: 'rgba(54, 162, 235, 0.8)', light: 'rgba(54, 162, 235, 0.5)' }, // Azul
      { base: 'rgba(255, 206, 86, 0.8)', light: 'rgba(255, 206, 86, 0.5)' }, // Amarelo
      { base: 'rgba(75, 192, 192, 0.8)', light: 'rgba(75, 192, 192, 0.5)' }, // Verde água
      { base: 'rgba(153, 102, 255, 0.8)', light: 'rgba(153, 102, 255, 0.5)' }, // Roxo
      { base: 'rgba(255, 159, 64, 0.8)', light: 'rgba(255, 159, 64, 0.5)' }, // Laranja
      { base: 'rgba(199, 199, 199, 0.8)', light: 'rgba(199, 199, 199, 0.5)' }, // Cinza
      { base: 'rgba(83, 102, 255, 0.8)', light: 'rgba(83, 102, 255, 0.5)' }, // Azul escuro
    ];
    
    return categories.map((_, index) => baseColors[index % baseColors.length]);
  };

  // Processa os dados para o formato empilhado
  const processDataForStackedChart = () => {
    if (!data.labels || !data.datasets || data.datasets.length < 2) {
      return { labels: [], datasets: [] };
    }

    const categories = data.labels;
    const user1Data = data.datasets[0]?.data || [];
    const user2Data = data.datasets[1]?.data || [];
    const colors = generateCategoryColors(categories);

    // Dados para o primeiro usuário (base das barras)
    const user1Dataset = {
      label: user1Name,
      data: user1Data,
      backgroundColor: colors.map(color => color.base),
      borderColor: colors.map(color => color.base),
      borderWidth: 1,
      stack: 'combined', // Mesmo stack para empilhar
    };

    // Dados para o segundo usuário (empilhados em cima)
    const user2Dataset = {
      label: user2Name,
      data: user2Data,
      backgroundColor: colors.map(color => color.light),
      borderColor: colors.map(color => color.base),
      borderWidth: 1,
      stack: 'combined', // Mesmo stack para empilhar
    };

    return {
      labels: categories,
      datasets: [user1Dataset, user2Dataset],
    };
  };

  const chartData = processDataForStackedChart();

  const options = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top' as const, 
        labels: { color: '#ffffff' }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: TooltipItem<'bar'>[]) => {
            return `Categoria: ${context[0].label}`;
          },
          label: (context: TooltipItem<'bar'>) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value !== null && value !== undefined) {
              return `${label}: ${new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(value)}`;
            }
            return label;
          },
          afterBody: (context: TooltipItem<'bar'>[]) => {
            // Calcula o total da categoria
            const total = context.reduce((sum, item) => sum + (item.parsed.y || 0), 0);
            return `Total da categoria: ${new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(total)}`;
          }
        }
      }
    },
    scales: {
      x: { 
        ticks: { 
          color: '#ffffff',
          maxRotation: 45, // Rotaciona labels se necessário
          minRotation: 0
        },
        stacked: true // Habilita empilhamento no eixo X
      },
      y: { 
        ticks: { 
          color: '#ffffff',
          callback: function(value: any) {
            return new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
          }
        },
        stacked: true // Habilita empilhamento no eixo Y
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  // Se não há dados, mostra mensagem
  if (!chartData.labels.length || !chartData.datasets.length) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: '#ffffff' 
      }}>
        <p>Nenhum dado de categoria encontrado para o período selecionado.</p>
      </div>
    );
  }

  return <Bar options={options} data={chartData} />;
};

export default FamilyCategoryChart;