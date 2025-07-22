import React, { useState, useEffect } from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import ProtectedLayout from '../components/ProtectedLayout';
import { useDate } from '../hooks/DateContext';
import { generateFinancialPeriods } from '../logic/dateLogic';
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

const Dashboard: React.FC = () => {
  const { startDay, currentPeriod } = useDate();
  const [activeChart, setActiveChart] = useState<'balance' | 'category' | 'family'>('balance');

  // Estado para as opções do seletor
  const [periodOptions, setPeriodOptions] = useState<ReturnType<typeof generateFinancialPeriods>>([]);
  // Estado para o valor do período selecionado (usamos a string ISO da data de início)
  const [selectedPeriodValue, setSelectedPeriodValue] = useState<string>('');

  // Gera as opções do seletor e define o valor inicial quando o componente carrega
  useEffect(() => {
    const options = generateFinancialPeriods(startDay);
    setPeriodOptions(options);
    // Encontra o período atual na lista de opções para definir como padrão
    const currentOption = options.find(
      p => p.startDate.getTime() === currentPeriod.startDate.getTime()
    );
    if (currentOption) {
      setSelectedPeriodValue(currentOption.value);
    }
  }, [startDay, currentPeriod]);

  // Encontra o objeto do período completo com base no valor selecionado
  const selectedPeriod = periodOptions.find(p => p.value === selectedPeriodValue);
  
  // Efeito para buscar dados quando o período selecionado mudar
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
    <ProtectedLayout title="Dashboard">
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">Resumo Mensal</h2>
        
        {/* Seletor de Período */}
        <IonSelect
          value={selectedPeriodValue}
          placeholder="Selecione o Mês"
          onIonChange={e => setSelectedPeriodValue(e.detail.value)}
          interface="popover"
          className="month-selector"
        >
          {periodOptions.map(opt => (
            <IonSelectOption key={opt.value} value={opt.value}>
              {opt.label}
            </IonSelectOption>
          ))}
        </IonSelect>
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
    </ProtectedLayout>
  );
};

export default Dashboard;