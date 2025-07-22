import { useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import app from '../firebaseConfig';

export interface Category {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES = [
  "Casa", "Mercado", "Restaurantes", "Saúde", "Transporte", "Assinaturas/Streaming", "Outros"
];

export const useCategories = () => {
  const { user } = useAuth();
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) {
        const defaultCats: Category[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
        setAvailableCategories(defaultCats.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
        return;
    }
    
    setLoading(true);
    try {
        const db = getFirestore(app);
        const defaultCats: Category[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
        
        const customCatsRef = collection(db, 'users', user.uid, 'categories');
        const querySnapshot = await getDocs(customCatsRef);
        const customCats = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })) as Category[];

        const allCats = [...defaultCats, ...customCats];
        const uniqueCats = Array.from(new Map(allCats.map(cat => [cat.name, cat])).values());
        
        setAvailableCategories(uniqueCats.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        const defaultCats: Category[] = DEFAULT_CATEGORIES.map(name => ({ id: name.toLowerCase(), name }));
        setAvailableCategories(defaultCats.sort((a, b) => a.name.localeCompare(b.name)));
    } finally {
        setLoading(false);
    }
  }, [user]);

  const createCategory = async (categoryName: string) => {
    if (!user || !categoryName.trim()) return;
    const db = getFirestore(app);
    const customCatsRef = collection(db, 'users', user.uid, 'categories');
    try {
        await addDoc(customCatsRef, { name: categoryName.trim() });
        fetchCategories();
    } catch (error) {
        console.error("Erro ao criar categoria:", error);
    }
  };

  return { availableCategories, loading, fetchCategories, createCategory };
};