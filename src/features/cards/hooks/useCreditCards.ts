import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { useAuth } from '../../../app/providers/AuthContext';
import { app } from '../../../firebaseConfig';
import { CreditCard } from '../../../shared/types/types';

export const useCreditCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const cardsQuery = query(collection(db, `users/${user.uid}/cards`));

    const unsubscribe = onSnapshot(cardsQuery, (snapshot) => {
      const fetchedCards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CreditCard));
      setCards(fetchedCards);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar cartões de crédito:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { cards, loading };
};