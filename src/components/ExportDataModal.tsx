import { useState, useEffect } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonDatetime,
  IonSpinner, IonInput, useIonToast, IonText
} from '@ionic/react';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/AuthContext';
import { exportToCsv } from '../logic/exportLogic';
import app from '../firebaseConfig';
import Papa from 'papaparse';
import { Capacitor } from '@capacitor/core';
import '../styles/ExportDataModal.css';

interface ExportDataModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({ isOpen, onDidDismiss }) => {
  const { user } = useAuth();
  const [exportType, setExportType] = useState<'year' | 'period'>('year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null);
  const [downloadLink, setDownloadLink] = useState<{ url: string; filename: string } | null>(null);
  
  const [presentToast] = useIonToast();
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    // Limpa o link de download sempre que as opções mudam ou o modal é reaberto
    if (isOpen) {
      setDownloadLink(null);
    }
  }, [isOpen, exportType, selectedYear, startDate, endDate]);

  const openDatePicker = (target: 'start' | 'end') => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  const handleDateChange = (e: CustomEvent) => {
    const value = e.detail.value as string | undefined;
    if (!value) return;

    const newDate = new Date(value);

    if (datePickerTarget === 'start') {
      setStartDate(newDate.toISOString());
      if (endDate && newDate > new Date(endDate)) {
        setEndDate(null);
      }
      setDatePickerTarget('end');
      presentToast({
        message: 'Data de início selecionada. Agora, selecione a data de fim.',
        duration: 2000,
        position: 'top',
      });
    } else if (datePickerTarget === 'end') {
      if (startDate && newDate < new Date(startDate)) {
        presentToast({
          message: 'A data de fim não pode ser anterior à data de início.',
          duration: 3000,
          color: 'danger',
          position: 'top',
        });
        return;
      }
      setEndDate(newDate.toISOString());
      setShowDatePicker(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    setLoading(true);
    setDownloadLink(null); 

    let start: Date, end: Date;

    if (exportType === 'year') {
      start = new Date(selectedYear, 0, 1);
      end = new Date(selectedYear, 11, 31, 23, 59, 59);
    } else {
      if (!startDate || !endDate) {
        alert('Por favor, selecione as datas de início e fim.');
        setLoading(false);
        return;
      }
      start = new Date(startDate);
      end = new Date(endDate);
    }

    try {
      const db = getFirestore(app);
      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        where('type', '==', 'income'),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end))
      );
      const snapshot = await getDocs(q);
      const incomes = snapshot.docs.map(doc => ({
        Data: (doc.data().date as Timestamp).toDate().toLocaleDateString('pt-BR'),
        Descrição: doc.data().description,
        Valor: doc.data().amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      }));

      if (incomes.length === 0) {
        alert('Nenhum recebimento encontrado para o período selecionado.');
        setLoading(false);
        return;
      }

      const csv = Papa.unparse(incomes);
      const filename = `relatorio_renda_${start.getFullYear()}.csv`;
      
      if (Capacitor.isNativePlatform()) {
        await exportToCsv(csv, filename);
      } else {
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setDownloadLink({ url, filename }); 
      }
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert('Ocorreu um erro ao exportar os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Exportar Rendimentos</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>Fechar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem className="export-modal-item">
            <IonLabel>Tipo de Relatório</IonLabel>
            <IonSelect value={exportType} onIonChange={e => setExportType(e.detail.value)}>
              <IonSelectOption value="year">Anual (para IR)</IonSelectOption>
              <IonSelectOption value="period">Período Específico</IonSelectOption>
            </IonSelect>
          </IonItem>

          {exportType === 'year' && (
            <IonItem className="export-modal-item">
              <IonLabel>Ano</IonLabel>
              <IonSelect value={selectedYear} onIonChange={e => setSelectedYear(e.detail.value)}>
                {availableYears.map(year => <IonSelectOption key={year} value={year}>{year}</IonSelectOption>)}
              </IonSelect>
            </IonItem>
          )}

          {exportType === 'period' && (
            <>
              <IonItem button onClick={() => openDatePicker('start')} className="export-modal-item">
                <IonLabel>Data de Início</IonLabel>
                <IonInput readonly value={startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Selecione...'} />
              </IonItem>
              <IonItem button onClick={() => openDatePicker('end')} className="export-modal-item">
                <IonLabel>Data de Fim</IonLabel>
                <IonInput readonly value={endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Selecione...'} />
              </IonItem>
            </>
          )}
        </IonList>

        {!downloadLink && (
          <IonButton expand="block" onClick={handleExport} disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? <IonSpinner name="crescent" /> : 'Gerar Relatório'}
          </IonButton>
        )}

        {downloadLink && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <IonText color="medium"><p>O seu relatório está pronto.</p></IonText>
            <a href={downloadLink.url} download={downloadLink.filename} className="button-download">
              Clique aqui para baixar
            </a>
          </div>
        )}
      </IonContent>

      <IonModal isOpen={showDatePicker} onDidDismiss={() => setShowDatePicker(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {datePickerTarget === 'start' ? 'Selecione a Data de Início' : 'Selecione a Data de Fim'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowDatePicker(false)}>Cancelar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonDatetime
            presentation="date"
            onIonChange={handleDateChange}
            value={datePickerTarget === 'start' ? startDate ?? undefined : endDate ?? undefined}
          />
        </IonContent>
      </IonModal>
    </IonModal>
  );
};

export default ExportDataModal;