import React, { useState, useMemo } from 'react';
import { 
  IonSpinner, 
  IonText 
} from '@ionic/react';

import BalanceChart from '../components/BalanceChart';
import CategoryChart from '../components/CategoryChart';
import CategorySummaryList from '../../../components/CategorySummaryList';
import { useTransactionSummary } from '../../transactions/hooks/useTransactionSummary';
import { useCategorySummary } from '../../transactions/hooks/useCategorySummary';
import { useAccountBalance } from '../../../shared/hooks/useAccountBalance';
import '../../../shared/styles/Dashboard.css';
import FamilyChartManager from '../../partnership/components/FamilyChartManager';
import PeriodSelector, { Period } from '../../../shared/components/PeriodSelector';
import PageLayout from '../../../shared/components/PageLayout';

const chartOptions = [
  { key: 'balance', label: 'Gráfico Balanço' },
  { key: 'category', label: 'Gráfico Categoria' },
  { key: 'family', label: 'Gráfico Conjunto' },
] as const;

const Dashboard: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'balance' | 'category' | 'family'>('balance');
  const [activePeriodObject, setActivePeriodObject] = useState<Period | null>(null);
  
  const memberIds = useMemo(() => [], []);
  const { summary: balanceSummary, loading: balanceLoading } = useTransactionSummary(activePeriodObject);
  const { chartData: categoryChartData, summaryList: categorySummaryList, loading: categoryLoading, totalExpense } = useCategorySummary(activePeriodObject, memberIds);
  const { balance: currentBalance, loading: accountBalanceLoading } = useAccountBalance();

  return (
    <PageLayout pageTitle="Dashboard">
      
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
    <PeriodSelector onPeriodChange={setActivePeriodObject} />
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
    {activeChart !== 'family' && (
          <div className="chart-wrapper">
            <div className={`chart-container ${activeChart === 'balance' ? 'active' : ''}`}>
              {balanceLoading ? <IonSpinner /> : (
                <BalanceChart 
                  totalIncome={balanceSummary.totalIncome} 
                  totalExpense={balanceSummary.totalExpense} 
                  totalReserved={balanceSummary.totalReserved} 
                />
              )}
            </div>
            <div className={`chart-container ${activeChart === 'category' ? 'active' : ''}`}>
              {categoryLoading || !categoryChartData ? <IonSpinner /> : (
                <CategoryChart data={categoryChartData} totalAmount={totalExpense} />
              )}
            </div>
          </div>
        )}
        {activeChart === 'family' && (
          <div className="family-chart-container">
            <FamilyChartManager period={activePeriodObject} />
          </div>
        )}
   </div>

   {activeChart === 'category' && !categoryLoading && categorySummaryList.length > 0 && (
    <CategorySummaryList summary={categorySummaryList} />
   )}

  </PageLayout>
    
 );
};

export default Dashboard;