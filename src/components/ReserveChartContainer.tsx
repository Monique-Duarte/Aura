import React, { useState, useRef } from 'react';
import { IonIcon, IonSpinner, IonText } from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import DateSelector from './DateSelector';
import ActionButton from './ActionButton';
import ReserveLineChart from './ReserveLineChart';
import { useReserveHistory } from '../hooks/useReserveHistory';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Tipagem para jspdf-autotable
interface AutoTableUserOptions {
  head: string[][];
  body: (string | number)[][];
  startY: number;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableUserOptions) => jsPDF;
  }
}

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

  const { totalChartData, individualChartData, transactions, loading } = useReserveHistory(period, goals);

  const handleGeneratePdf = async () => {
    const totalChartElement = totalChartRef.current;
    if (!totalChartElement) return;

    const canvas = await html2canvas(totalChartElement);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(16);
    pdf.text("Evolução Total da Reserva", pdfWidth / 2, 15, { align: 'center' });
    
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
    
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text("Detalhes das Transações", pdfWidth / 2, 15, { align: 'center' });

    const tableColumn = ["Data", "Descrição", "Tipo", "Valor"];
    const tableRows: (string | number)[][] = [];

    transactions.forEach(t => {
      const transactionData = [
        t.date.toLocaleDateString('pt-BR'),
        t.description,
        t.type === 'reserve_add' ? 'Depósito' : 'Resgate',
        t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
      tableRows.push(transactionData);
    });

    pdf.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });

    pdf.save("resumo_reserva.pdf");
  };

  return (
    <div>
      {/* --- ALTERAÇÃO: Layout do seletor de data e botão ajustado --- */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <DateSelector onPeriodChange={setPeriod} />
        </div>
        <div>
          <ActionButton onClick={handleGeneratePdf} fill="outline" disabled={loading || transactions.length === 0}>
            <IonIcon slot="start" icon={documentTextOutline} />
            PDF
          </ActionButton>
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