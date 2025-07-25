import React, { useState, useEffect, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  IonListHeader,
} from '@ionic/react';
// --- ALTERAÇÃO: Importando o ícone 'closeCircleOutline' ---
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, query, where, onSnapshot, Timestamp, writeBatch, doc } from 'firebase/firestore';
import app from '../firebaseConfig';
import '../styles/Faturas.css';
import { scheduleInvoiceNotifications } from '../logic/notificationLogic';

import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';

// --- Interfaces ---
interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
}

interface ExpenseTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  cardId?: string;
  isPaid?: boolean;
}

interface Invoice {
  id: string;
  cardName: string;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  isPaid: boolean;
  transactions: ExpenseTransaction[];
}

const Faturas: React.FC = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // --- NOVO: Estado para o alerta de confirmação de pagamento ---
  const [showPayConfirmationAlert, setShowPayConfirmationAlert] = useState(false);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore(app);
    const cardsRef = collection(db, 'users', user.uid, 'cards');
    const unsubscribe = onSnapshot(query(cardsRef), (snapshot) => {
      const fetchedCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CreditCard[];
      setCards(fetchedCards);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const db = getFirestore(app);
    const transRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transRef, where('paymentMethod', '==', 'credit'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedExpenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as ExpenseTransaction[];
      setExpenses(fetchedExpenses);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const allInvoices = useMemo(() => {
    if (cards.length === 0) return [];

    const groupedInvoices = new Map<string, Invoice>();

    expenses.forEach(expense => {
      const card = cards.find(c => c.id === expense.cardId);
      if (!card) return;

      const expenseDate = expense.date;
      let invoiceYear = expenseDate.getFullYear();
      let invoiceMonth = expenseDate.getMonth();

      if (expenseDate.getDate() > card.closingDay) {
        invoiceMonth += 1;
        if (invoiceMonth > 11) {
          invoiceMonth = 0;
          invoiceYear += 1;
        }
      }

      const invoiceId = `${card.id}-${invoiceYear}-${invoiceMonth}`;
      
      if (!groupedInvoices.has(invoiceId)) {
        const startDate = new Date(invoiceYear, invoiceMonth - 1, card.closingDay + 1);
        const endDate = new Date(invoiceYear, invoiceMonth, card.closingDay);
        const dueDate = new Date(invoiceYear, invoiceMonth, card.dueDay);
        
        groupedInvoices.set(invoiceId, {
          id: invoiceId,
          cardName: card.name,
          startDate,
          endDate,
          dueDate,
          totalAmount: 0,
          isPaid: true,
          transactions: [],
        });
      }

      const invoice = groupedInvoices.get(invoiceId)!;
      invoice.totalAmount += expense.amount;
      invoice.transactions.push(expense);
      if (!expense.isPaid) {
        invoice.isPaid = false;
      }
    });

    return Array.from(groupedInvoices.values()).sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  }, [cards, expenses]);

  useEffect(() => {
    if (allInvoices.length > 0) {
      scheduleInvoiceNotifications(allInvoices);
    }
  }, [allInvoices]);

  // --- ALTERAÇÃO: Funções separadas para pagar e "despagar" a fatura ---
  const executePaymentToggle = async (invoice: Invoice, newStatus: boolean) => {
    if (!user || invoice.transactions.length === 0) return;
    
    const db = getFirestore(app);
    const batch = writeBatch(db);

    invoice.transactions.forEach(trans => {
      const docRef = doc(db, 'users', user.uid, 'transactions', trans.id);
      batch.update(docRef, { isPaid: newStatus });
    });

    try {
      await batch.commit();
      setShowDetailsModal(false); // Fecha o modal após a ação
    } catch (error) {
      console.error("Erro ao atualizar o estado da fatura:", error);
    }
  };

  const confirmPayInvoice = () => {
    if (selectedInvoice) {
      executePaymentToggle(selectedInvoice, true);
    }
    setShowPayConfirmationAlert(false);
  };

  const handleUnpayInvoice = () => {
    if (selectedInvoice) {
      executePaymentToggle(selectedInvoice, false);
    }
  };

  const openDetailsModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const openInvoices = allInvoices.filter(inv => !inv.isPaid);
  const closedInvoices = allInvoices.filter(inv => inv.isPaid);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Faturas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem lines="none" className="invoice-filter-item">
          <IonLabel position="stacked">Filtrar Histórico por Cartão</IonLabel>
          <IonSelect 
            value={selectedCardId} 
            placeholder="Ver todos" 
            onIonChange={e => setSelectedCardId(e.detail.value as string | null)}
            interface="popover"
          >
            <IonSelectOption value={null}>Ver todos</IonSelectOption>
            {cards.map(card => (
              <IonSelectOption key={card.id} value={card.id}>{card.name}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner /></div>
        ) : (
          <>
            <IonListHeader>Faturas Abertas</IonListHeader>
            {openInvoices.length > 0 ? openInvoices.map(invoice => (
              <div className="invoice-card open" key={invoice.id}>
                <IonText><p className="card-name">{invoice.cardName}</p></IonText>
                <IonText color="danger">
                  <h2>{invoice.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h2>
                </IonText>
                <IonText color="medium"><p>Fecha em: {invoice.endDate.toLocaleDateString('pt-BR')}</p></IonText>
                <ActionButton onClick={() => openDetailsModal(invoice)} fill="clear">Ver Detalhes</ActionButton>
              </div>
            )) : <IonItem lines="none"><IonLabel color="medium">Nenhuma fatura aberta.</IonLabel></IonItem>}

            <IonList>
              <IonListHeader>Histórico de Faturas Fechadas</IonListHeader>
              {closedInvoices.length > 0 ? closedInvoices
                .filter(invoice => !selectedCardId || invoice.cardName === cards.find(c => c.id === selectedCardId)?.name)
                .map(invoice => (
                  <IonItem key={invoice.id} button onClick={() => openDetailsModal(invoice)}>
                    <IonLabel>
                      <h2>{invoice.cardName} - {invoice.dueDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                      <p>Vencimento em {invoice.dueDate.toLocaleDateString('pt-BR')}</p>
                    </IonLabel>
                    <IonText slot="end" color="dark">
                      <p>{invoice.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </IonText>
                  </IonItem>
                )) : <IonItem lines="none"><IonLabel color="medium">Nenhuma fatura fechada encontrada.</IonLabel></IonItem>}
            </IonList>
          </>
        )}

        <AppModal
          title={`Fatura de ${selectedInvoice?.dueDate.toLocaleString('pt-BR', { month: 'long' })}`}
          isOpen={showDetailsModal}
          onDidDismiss={() => setShowDetailsModal(false)}
        >
          {selectedInvoice && (
            <>
              <IonList>
                {selectedInvoice.transactions.map(trans => (
                  <IonItem key={trans.id}>
                    <IonLabel>
                      <h2>{trans.description}</h2>
                      <p>{trans.date.toLocaleDateString('pt-BR')}</p>
                    </IonLabel>
                    <IonText slot="end" color="danger">
                      <p>{trans.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </IonText>
                  </IonItem>
                ))}
              </IonList>
              <div className="invoice-summary">
                <IonText><h3>Total: {selectedInvoice.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></IonText>
                
                {/* --- ALTERAÇÃO: Botão condicional para Pagar ou "Despagar" --- */}
                {!selectedInvoice.isPaid ? (
                  <ActionButton onClick={() => setShowPayConfirmationAlert(true)}>
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    Marcar Fatura como Paga
                  </ActionButton>
                ) : (
                  <ActionButton onClick={handleUnpayInvoice} fill="outline">
                    <IonIcon slot="start" icon={closeCircleOutline} />
                    Marcar como Não Paga
                  </ActionButton>
                )}
              </div>
            </>
          )}
        </AppModal>

        {/* --- NOVO: Alerta de confirmação para o pagamento --- */}
        <ActionAlert
          isOpen={showPayConfirmationAlert}
          onDidDismiss={() => setShowPayConfirmationAlert(false)}
          header="Confirmar Pagamento"
          message={`Tem a certeza que deseja marcar a fatura do cartão "${selectedInvoice?.cardName}" como paga?`}
          onConfirm={confirmPayInvoice}
          confirmButtonText="Confirmar"
        />
      </IonContent>
    </IonPage>
  );
};

export default Faturas;
