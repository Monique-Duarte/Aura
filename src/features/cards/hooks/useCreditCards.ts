// src/features/cards/hooks/useCreditCards.ts

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, getFirestore } from 'firebase/firestore';
import { useAuth } from '../../../app/providers/AuthContext';
import { app } from '../../../firebaseConfig';

export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limit: number;
}

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
    const cardsRef = collection(db, 'users', user.uid, 'cards');
    const cardsQuery = query(cardsRef);

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