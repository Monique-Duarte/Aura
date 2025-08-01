import React, { useState, useMemo } from 'react';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, IonSpinner, IonText } from '@ionic/react';
import PeriodSelector from '../components/PeriodSelector';
import BalanceChart from '../components/BalanceChart';
import CategoryChart from '../components/CategoryChart';
import CategorySummaryList from '../components/CategorySummaryList';
import FamilyChartManager from '../components/FamilyChartManager';
import { useTransactionSummary } from '../hooks/useTransactionSummary';
import { useCategorySummary } from '../hooks/useCategorySummary';
import { useAccountBalance } from '../hooks/useAccountBalance';
import '../styles/Dashboard.css';
import '../theme/variables.css';

const chartOptions = [
  { key: 'balance', label: 'Gráfico Balanço' },
  { key: 'category', label: 'Gráfico Categoria' },
  { key: 'family', label: 'Gráfico Conjunto' },
] as const;

interface Period {
  startDate: Date;
  endDate: Date;
}

const Dashboard: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'balance' | 'category' | 'family'>('balance');
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const memberIds = useMemo(() => [], []);
  const { summary: balanceSummary, loading: balanceLoading } = useTransactionSummary(selectedPeriod);
  const { chartData: categoryChartData, summaryList: categorySummaryList, loading: categoryLoading, totalExpense } = useCategorySummary(selectedPeriod, memberIds);
  const { balance: currentBalance, loading: accountBalanceLoading } = useAccountBalance();

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
        
        <div className="summary-card">
          {accountBalanceLoading ? (
            <IonSpinner name="crescent" />
          ) : (
            <>
              <IonText><p>Saldo Atual</p></IonText>
              <IonText color="success">
                <h2>{currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
              </IonText>
            </>
          )}
        </div>

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

        <div className="dashboard-chart-area chart-wrapper">
          <div className={`chart-container ${activeChart === 'balance' ? 'active' : ''}`}>
            {balanceLoading ? (
              <div className="spinner-container"><IonSpinner /></div>
            ) : (
              <BalanceChart 
                totalIncome={balanceSummary.totalIncome} 
                totalExpense={balanceSummary.totalExpense} 
                totalReserved={balanceSummary.totalReserved} 
              />
            )}
          </div>
          <div className={`chart-container ${activeChart === 'category' ? 'active' : ''}`}>
            {categoryLoading || !categoryChartData ? (
              <div className="spinner-container"><IonSpinner /></div>
            ) : (
              <CategoryChart data={categoryChartData} totalAmount={totalExpense} />
            )}
          </div>
          <div className={`chart-container ${activeChart === 'family' ? 'active' : ''}`}>
            <FamilyChartManager period={selectedPeriod} />
          </div>
        </div>

        {activeChart === 'category' && !categoryLoading && categorySummaryList.length > 0 && (
          <CategorySummaryList summary={categorySummaryList} />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;