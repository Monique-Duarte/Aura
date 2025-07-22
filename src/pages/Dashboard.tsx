import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent } from '@ionic/react';
import PeriodSelector from '../components/PeriodSelector'; // Importa o novo componente
import './Dashboard.css';

// --- Componentes de Gráfico (placeholders) ---
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
] as const;

// Define a estrutura de um objeto de período
interface Period {
  startDate: Date;
  endDate: Date;
}

// --- Componente Principal do Dashboard ---
const Dashboard: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'balance' | 'category' | 'family'>('balance');
  // Estado para armazenar o período selecionado, recebido do componente filho
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  // Efeito para buscar dados sempre que o período selecionado mudar
  useEffect(() => {
    if (selectedPeriod) {
      console.log('NOVO PERÍODO SELECIONADO! Buscar dados para:', selectedPeriod.startDate, 'até', selectedPeriod.endDate);
      //
      // AQUI VOCÊ COLOCARÁ A LÓGICA PARA BUSCAR OS DADOS DO FIREBASE
      // USANDO as datas de `selectedPeriod.startDate` e `selectedPeriod.endDate`.
      //
    }
  }, [selectedPeriod]);

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
          {activeChart === 'balance' && <DashboardBalanceChart />}
          {activeChart === 'category' && <DashboardCategoryChart />}
          {activeChart === 'family' && <DashboardFamilyChart />}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;