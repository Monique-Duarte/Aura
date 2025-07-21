import React, { useState } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import './Dashboard.css';

const DashboardBalanceChart: React.FC = () => (
  <div className="dashboard-chart-placeholder">Balanço</div>
);
const DashboardCategoryChart: React.FC = () => (
  <div className="dashboard-chart-placeholder">Categoria</div>
);
const DashboardFamilyChart: React.FC = () => (
  <div className="dashboard-chart-placeholder">Conjunto</div>
);

const chartOptions = [
  { key: 'balance', label: 'Gráfico Balanço' },
  { key: 'category', label: 'Gráfico Categoria' },
  { key: 'family', label: 'Gráfico Conjunto' },
];

const Dashboard: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'balance' | 'category' | 'family'>('balance');

  return (
    <ProtectedLayout title="Dashboard">
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">Gráficos</h2>
        <div className="dashboard-chart-legend">
          {chartOptions.map(opt => (
            <button
              key={opt.key}
              className={`dashboard-legend-btn${activeChart === opt.key ? ' active' : ''}`}
              onClick={() => setActiveChart(opt.key as any)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="dashboard-chart-area">
        {activeChart === 'balance' && <DashboardBalanceChart />}
        {activeChart === 'category' && <DashboardCategoryChart />}
        {activeChart === 'family' && <DashboardFamilyChart />}
      </div>
    </ProtectedLayout>
  );
};

export default Dashboard; 