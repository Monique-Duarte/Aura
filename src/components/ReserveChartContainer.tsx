import React, { useState, useRef } from 'react';
import { IonSpinner, IonText } from '@ionic/react';
import DateSelector from './DateSelector';
import ReserveLineChart from './ReserveLineChart';
import { useReserveHistory } from '../hooks/useReserveHistory';

interface Period {
  startDate: Date;
  endDate: Date;
}

interface ReserveChartContainerProps {
  goals: { id: string; name: string; yieldPercentage?: number }[];
}

const ReserveChartContainer: React.FC<ReserveChartContainerProps> = ({ goals }) => {
  const [period, setPeriod] = useState<Period | null>(null);
  const totalChartRef = useRef<HTMLDivElement>(null);
  const individualChartRef = useRef<HTMLDivElement>(null);

  const { totalChartData, individualChartData, loading } = useReserveHistory(period, goals);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: '16px', gap: '8px' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <DateSelector onPeriodChange={setPeriod} />
        </div>
      </div>
      
      {loading && <div style={{ textAlign: 'center' }}><IonSpinner /></div>}

      {!loading && totalChartData.labels.length > 0 && (
        <>
          <div className="chart-section" ref={totalChartRef}>
            <h3 className="chart-title">Evolução Total</h3>
            <ReserveLineChart chartData={totalChartData} />
          </div>

          <div className="chart-section" ref={individualChartRef} style={{ marginTop: '32px' }}>
            <h3 className="chart-title">Evolução por Objetivo</h3>
            <ReserveLineChart chartData={individualChartData} showLegend={true} />
          </div>
        </>
      )}

      {!loading && totalChartData.labels.length === 0 && period && (
        <IonText color="medium" className="ion-text-center"><p>Nenhuma transação encontrada no período.</p></IonText>
      )}
    </div>
  );
};

export default ReserveChartContainer;