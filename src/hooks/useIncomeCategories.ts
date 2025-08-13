import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import app from '../firebaseConfig';

const firestore = getFirestore(app);

// A interface para uma categoria de renda (sem cor)
export interface IncomeCategory {
  id: string;
  name: string;
}

export const useIncomeCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const categoriesRef = collection(firestore, 'users', user.uid, 'income_categories');
    const q = query(categoriesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as IncomeCategory[];
      setCategories(fetchedCategories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Adiciona uma nova categoria de renda
  const addCategory = async (name: string) => {
    if (!user || !name.trim()) {
      throw new Error("Nome da categoria ou utilizador inválido.");
    }
    const categoriesRef = collection(firestore, 'users', user.uid, 'income_categories');
    await addDoc(categoriesRef, { name });
  };

  // ATUALIZA uma categoria de renda existente
  const updateCategory = async (id: string, name: string) => {
    if (!user || !name.trim()) return;
    const docRef = doc(firestore, 'users', user.uid, 'income_categories', id);
    await updateDoc(docRef, { name });
  };

  // EXCLUI uma categoria de renda
  const deleteCategory = async (id: string) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'income_categories', id);
    await deleteDoc(docRef);
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory };
};