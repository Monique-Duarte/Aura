import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonSpinner } from '@ionic/react';
import PeriodSelector from '../components/PeriodSelector';
import BalanceChart from '../components/BalanceChart';
import CategoryChart from '../components/CategoryChart';
import CategorySummaryList from '../components/CategorySummaryList'; // Importa a nova lista
import { useTransactionSummary } from '../hooks/useTransactionSummary';
import { useCategorySummary } from '../hooks/useCategorySummary';
import './Dashboard.css';

// --- Componente de Gráfico (placeholder para o último) ---
const DashboardFamilyChart: React.FC = () => (
  <div className="dashboard-chart-placeholder">Conjunto</div>
);

const chartOptions = [
  { key: 'balance', label: 'Gráfico Balanço' },
  { key: 'category', label: 'Gráfico Categoria' },
  { key: 'family', label: 'Gráfico Conjunto' },
] as const;

// Define a estrutura de um objeto de período
interface Period {
  startDate: Date;
  endDate: Date;
}

// --- Componente Principal do Dashboard ---
const Dashboard: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'balance' | 'category' | 'family'>('balance');
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  // Usa os hooks para buscar os dados de resumo
  const { summary: balanceSummary, loading: balanceLoading } = useTransactionSummary(selectedPeriod);
  const { chartData: categoryChartData, summaryList: categorySummaryList, loading: categoryLoading } = useCategorySummary(selectedPeriod);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="dashboard-header-row">
          <h2 className="dashboard-title">Resumo Mensal</h2>
          <PeriodSelector onPeriodChange={setSelectedPeriod} />
        </div>

        <div className="dashboard-chart-legend">
          {chartOptions.map(opt => (
            <button
              key={opt.key}
              className={`dashboard-legend-btn${activeChart === opt.key ? ' active' : ''}`}
              onClick={() => setActiveChart(opt.key)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="dashboard-chart-area">
          {activeChart === 'balance' && (
            balanceLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <IonSpinner />
              </div>
            ) : (
              <BalanceChart 
                totalIncome={balanceSummary.totalIncome} 
                totalExpense={balanceSummary.totalExpense} 
              />
            )
          )}
          {activeChart === 'category' && (
            categoryLoading || !categoryChartData ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <IonSpinner />
              </div>
            ) : (
              // O gráfico continua na sua área designada
              <CategoryChart data={categoryChartData} />
            )
          )}
          {activeChart === 'family' && <DashboardFamilyChart />}
        </div>

        {/* CORREÇÃO: A lista de resumo agora é renderizada FORA e ABAIXO da área do gráfico */}
        {/* Ela só aparece quando o gráfico de categoria está ativo e não está carregando */}
        {activeChart === 'category' && !categoryLoading && categorySummaryList.length > 0 && (
          <CategorySummaryList summary={categorySummaryList} />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;