import React, { useState, useEffect, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent,
  IonIcon, IonItem, IonLabel, IonList, IonText, IonSpinner, IonListHeader, IonButton,
} from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, cardOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, query, where, onSnapshot, Timestamp, writeBatch, doc } from 'firebase/firestore';
import app from '../firebaseConfig';
import '../styles/Faturas.css';
import { scheduleInvoiceNotifications } from '../logic/notificationLogic';
import { getInvoicePeriodForExpense } from '../logic/fatureLogic';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';

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
  cardId: string;
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

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore(app);
    const unsubscribe = onSnapshot(query(collection(db, 'users', user.uid, 'cards')), (snapshot) => {
      setCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CreditCard[]);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const db = getFirestore(app);
    const q = query(collection(db, 'users', user.uid, 'transactions'), where('paymentMethod', '==', 'credit'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: (doc.data().date as Timestamp).toDate() })) as ExpenseTransaction[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const allInvoices = useMemo(() => {
    if (cards.length === 0 || expenses.length === 0) return [];
    const groupedInvoices = new Map<string, Invoice>();
    expenses.forEach(expense => {
      const card = cards.find(c => c.id === expense.cardId);
      if (!card) return;
      const { startDate, endDate } = getInvoicePeriodForExpense(expense.date, card);
      const invoiceYear = endDate.getFullYear();
      const invoiceMonth = endDate.getMonth();
      const invoiceId = `${card.id}-${invoiceYear}-${invoiceMonth}`;

      if (!groupedInvoices.has(invoiceId)) {
        const dueDate = new Date(invoiceYear, invoiceMonth, card.dueDay);
        if (card.dueDay < card.closingDay) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        groupedInvoices.set(invoiceId, { id: invoiceId, cardId: card.id, cardName: card.name, startDate, endDate, dueDate, totalAmount: 0, isPaid: true, transactions: [] });
      }
      const invoice = groupedInvoices.get(invoiceId)!;
      invoice.totalAmount += expense.amount;
      invoice.transactions.push(expense);
      if (!expense.isPaid) {
        invoice.isPaid = false;
      }
    });
    return Array.from(groupedInvoices.values());
  }, [cards, expenses]);

  const { openInvoices, closedInvoices } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentOpenInvoices: Invoice[] = [];

    cards.forEach(card => {
      const invoicesForCard = allInvoices.filter(inv => inv.cardId === card.id && !inv.isPaid);
      if (invoicesForCard.length > 0) {
        invoicesForCard.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
        const nextOpenInvoice = invoicesForCard.find(inv => inv.endDate >= today) || invoicesForCard[invoicesForCard.length - 1];
        if(nextOpenInvoice) currentOpenInvoices.push(nextOpenInvoice);
      }
    });
    
    const allClosedInvoices = allInvoices.filter(inv => inv.isPaid).sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

    return {
      openInvoices: currentOpenInvoices.sort((a, b) => a.endDate.getTime() - b.endDate.getTime()),
      closedInvoices: allClosedInvoices
    };
  }, [allInvoices, cards]);

  const invoicesByCard = useMemo(() => {
    const map = new Map<string, Invoice[]>();
    allInvoices.forEach(invoice => {
      const cardInvoices = map.get(invoice.cardId) || [];
      cardInvoices.push(invoice);
      map.set(invoice.cardId, cardInvoices);
    });
    map.forEach((invoices, cardId) => {
      map.set(cardId, invoices.sort((a, b) => a.endDate.getTime() - b.endDate.getTime()));
    });
    return map;
  }, [allInvoices]);

  const handleNavigate = (direction: 'previous' | 'next') => {
    if (!selectedInvoice) return;
    const cardInvoices = invoicesByCard.get(selectedInvoice.cardId);
    if (!cardInvoices || cardInvoices.length <= 1) return;

    const currentIndex = cardInvoices.findIndex(inv => inv.id === selectedInvoice.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'previous' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < cardInvoices.length) {
      setSelectedInvoice(cardInvoices[newIndex]);
    }
  };
  
  const { canGoToPrevious, canGoToNext } = useMemo(() => {
    if (!selectedInvoice) return { canGoToPrevious: false, canGoToNext: false };
    const cardInvoices = invoicesByCard.get(selectedInvoice.cardId) || [];
    const currentIndex = cardInvoices.findIndex(inv => inv.id === selectedInvoice.id);
    return {
      canGoToPrevious: currentIndex > 0,
      canGoToNext: currentIndex < cardInvoices.length - 1,
    };
  }, [selectedInvoice, invoicesByCard]);

  useEffect(() => { if (allInvoices.length > 0) scheduleInvoiceNotifications(allInvoices); }, [allInvoices]);

  const handlePaymentToggle = async (invoice: Invoice, newStatus: boolean) => {
    if (!user || invoice.transactions.length === 0) return;
    const db = getFirestore(app);
    const batch = writeBatch(db);
    invoice.transactions.forEach(trans => {
      batch.update(doc(db, 'users', user.uid, 'transactions', trans.id), { isPaid: newStatus });
    });
    try {
      await batch.commit();
      // Não fecha mais o modal para permitir continuar a navegar
      setSelectedInvoice(prev => prev ? {...prev, isPaid: newStatus} : null);
    } catch (error) {
      console.error("Erro ao atualizar o estado da fatura:", error);
    }
  };

  const openDetailsModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Faturas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div className="spinner-container"><IonSpinner /></div>
        ) : cards.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={cardOutline} className="empty-state-icon" />
            <IonText><p>Nenhum cartão registado.</p></IonText>
            <IonText color="medium"><p>Vá a "Meus Cartões" para adicionar um.</p></IonText>
          </div>
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
              {closedInvoices.length > 0 ? closedInvoices.map(invoice => (
                <IonItem key={invoice.id} button onClick={() => openDetailsModal(invoice)}>
                  <IonLabel>
                    <h2>{invoice.cardName} - {invoice.dueDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                    <p>Vencimento em {invoice.dueDate.toLocaleDateString('pt-BR')}</p>
                  </IonLabel>
                  <IonText slot="end" color="dark"><p>{invoice.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></IonText>
                </IonItem>
              )) : <IonItem lines="none"><IonLabel color="medium">Nenhum histórico encontrado.</IonLabel></IonItem>}
            </IonList>
          </>
        )}

        <AppModal
          title={`Fatura ${selectedInvoice?.cardName}`}
          isOpen={showDetailsModal}
          onDidDismiss={() => setShowDetailsModal(false)}
        >
          {selectedInvoice && (
            <>
              <div className="invoice-navigation">
                <IonButton fill="clear" disabled={!canGoToPrevious} onClick={() => handleNavigate('previous')}>
                  <IonIcon slot="icon-only" icon={chevronBackOutline} />
                </IonButton>

                <IonText color="medium">
                  <p>{selectedInvoice.dueDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                </IonText>

                <IonButton fill="clear" disabled={!canGoToNext} onClick={() => handleNavigate('next')}>
                  <IonIcon slot="icon-only" icon={chevronForwardOutline} />
                </IonButton>
              </div>

              <IonList>
                {selectedInvoice.transactions.map(trans => (
                  <IonItem key={trans.id}>
                    <IonLabel>
                      <h2>{trans.description}</h2>
                      <p>{trans.date.toLocaleDateString('pt-BR')}</p>
                    </IonLabel>
                    <IonText slot="end" color="danger"><p>{trans.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></IonText>
                  </IonItem>
                ))}
              </IonList>
              <div className="invoice-summary">
                <IonText><h3>Total: {selectedInvoice.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3></IonText>
                {!selectedInvoice.isPaid ? (
                  <ActionButton onClick={() => handlePaymentToggle(selectedInvoice, true)} icon={checkmarkCircleOutline}>Marcar como Paga</ActionButton>
                ) : (
                  <ActionButton onClick={() => handlePaymentToggle(selectedInvoice, false)} fill="outline" icon={closeCircleOutline}>Marcar como Não Paga</ActionButton>
                )}
              </div>
            </>
          )}
        </AppModal>
      </IonContent>
    </IonPage>
  );
};

export default Faturas;