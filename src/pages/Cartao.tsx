import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonSpinner,
  IonActionSheet,
} from '@ionic/react';
import { add, close, pencil, trash, cardOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/AuthContext';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import app from '../firebaseConfig';
import '../styles/Lancamentos.css';
import AppModal from '../components/AppModal';
import ActionButton from '../components/ActionButton';
import ActionAlert from '../components/ActionAlert';

// --- Interface para o Cartão de Crédito ---
interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
}

const Cartao: React.FC = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do modal e formulário
  const [showModal, setShowModal] = useState(false);
  const [cardName, setCardName] = useState('');
  const [closingDay, setClosingDay] = useState<number | undefined>();
  const [dueDay, setDueDay] = useState<number | undefined>();

  // Estados de controlo
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [cardToAction, setCardToAction] = useState<CreditCard | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Efeito para buscar os cartões em tempo real
  useEffect(() => {
    if (!user) return;
    const db = getFirestore(app);
    const cardsRef = collection(db, 'users', user.uid, 'cards');
    const q = query(cardsRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedCards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }) as CreditCard).sort((a, b) => a.name.localeCompare(b.name));
      setCards(fetchedCards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Função para salvar (criar ou editar) um cartão
  const handleSaveCard = async () => {
    if (!user || !cardName || !closingDay || !dueDay) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
      alert("Os dias de fechamento e vencimento devem ser entre 1 e 31.");
      return;
    }
    const db = getFirestore(app);

    const dataToSave = {
      name: cardName,
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
    };

    try {
      if (editingCard) {
        const docRef = doc(db, 'users', user.uid, 'cards', editingCard.id);
        await updateDoc(docRef, dataToSave);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'cards'), dataToSave);
      }
      closeModalAndReset();
    } catch (error) {
      console.error("Erro ao salvar o cartão:", error);
    }
  };

  // Função para confirmar a exclusão
  const confirmDelete = async () => {
    if (!user || !cardToAction) return;
    const db = getFirestore(app);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'cards', cardToAction.id));
    } catch (error) {
      console.error("Erro ao excluir o cartão:", error);
    }
    setShowDeleteAlert(false);
  };

  // Funções de UI
  const handleItemClick = (card: CreditCard) => {
    setCardToAction(card);
    setShowActionSheet(true);
  };

  const handleEditClick = () => {
    if (!cardToAction) return;
    setEditingCard(cardToAction);
    setCardName(cardToAction.name);
    setClosingDay(cardToAction.closingDay);
    setDueDay(cardToAction.dueDay);
    setShowModal(true);
  };

  const handleDeleteClick = () => {
    if (!cardToAction) return;
    setShowDeleteAlert(true);
  };

  const closeModalAndReset = () => {
    setShowModal(false);
    setEditingCard(null);
    setCardName('');
    setClosingDay(undefined);
    setDueDay(undefined);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Meus Cartões</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner /></div>
        ) : cards.length === 0 ? (
            <div className="empty-state">
                <IonIcon icon={cardOutline} className="empty-state-icon" />
                <IonText>
                    <p>Ainda não há cartões registados.</p>
                </IonText>
                <IonText color="medium">
                    <p>Adicione os seus cartões de crédito para um melhor controle das suas despesas.</p>
                </IonText>
            </div>
        ) : (
          <IonList>
            {cards.map(card => (
              <IonItem key={card.id} lines="inset" button onClick={() => handleItemClick(card)}>
                <IonIcon icon={cardOutline} slot="start" color="primary" />
                <IonLabel>
                  <h2>{card.name}</h2>
                  <p>Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <AppModal
          title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}
          isOpen={showModal}
          onDidDismiss={closeModalAndReset}
        >
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Nome do Cartão</IonLabel>
              <IonInput value={cardName} onIonChange={e => setCardName(e.detail.value!)} placeholder="Ex: Nubank, Inter, Visa" />
            </IonItem>
          </div>
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Dia do Fechamento da Fatura</IonLabel>
              <IonInput 
                type="number" 
                value={closingDay} 
                placeholder="Ex: 28"
                onIonChange={e => setClosingDay(parseInt(e.detail.value!, 10))}
              />
            </IonItem>
          </div>
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Dia do Vencimento da Fatura</IonLabel>
              <IonInput 
                type="number" 
                value={dueDay} 
                placeholder="Ex: 07"
                onIonChange={e => setDueDay(parseInt(e.detail.value!, 10))}
              />
            </IonItem>
          </div>
          <ActionButton onClick={handleSaveCard}>
            {editingCard ? 'Salvar Alterações' : 'Adicionar Cartão'}
          </ActionButton>
        </AppModal>

        <ActionAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={'Confirmar Exclusão'}
          message={`Tem a certeza que deseja excluir o cartão "${cardToAction?.name}"?`}
          onConfirm={confirmDelete}
          confirmButtonText="Excluir"
        />
        
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={cardToAction?.name}
          buttons={[
            {
              text: 'Editar',
              icon: pencil,
              handler: handleEditClick,
              cssClass: 'action-sheet-edit',
            },
            {
              text: 'Excluir',
              role: 'destructive',
              icon: trash,
              handler: handleDeleteClick
            },
            {
              text: 'Cancelar',
              icon: close,
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Cartao;