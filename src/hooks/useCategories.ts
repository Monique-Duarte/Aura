import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import app from '../firebaseConfig';

// --- Interface para uma categoria ---
export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

// --- Utilizando a sua lista de categorias padrão ---
const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: "Casa", color: "#3880ff", isDefault: true },
  { name: "Mercado", color: "#72f2f7ff", isDefault: true },
  { name: "Restaurantes", color: "#2dd36f", isDefault: true },
  { name: "Saúde", color: "#ffc409", isDefault: true },
  { name: "Transporte", color: "#eb445a", isDefault: true },
  { name: "Assinaturas/Streaming", color: "#9254de", isDefault: true },
  { name: "Outros", color: "#a0a0a0", isDefault: true },
];

export const useCategories = () => {
  const { user } = useAuth();
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Efeito para buscar as categorias personalizadas do utilizador em tempo real
  useEffect(() => {
    if (!user) {
      setUserCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const db = getFirestore(app);
    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setUserCategories(fetchedCategories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- CORREÇÃO 1: Memoizar a lista de categorias padrão ---
  // Isso garante que a lista de categorias padrão tenha uma referência estável.
  const defaultCategoriesWithIds = useMemo(() => {
    return DEFAULT_CATEGORIES.map(cat => ({ ...cat, id: `default-${cat.name}` }));
  }, []); // Array vazio porque DEFAULT_CATEGORIES nunca muda.

  // Combina as categorias padrão com as do utilizador para uso geral
  const availableCategories = useMemo(() => {
    // A ordenação é feita aqui para que o array final seja consistente
    return [...defaultCategoriesWithIds, ...userCategories].sort((a, b) => a.name.localeCompare(b.name));
  }, [defaultCategoriesWithIds, userCategories]); // Depende das duas listas estáveis

  const addCategory = useCallback(async (name: string, color: string) => {
    if (!user) return;
    const db = getFirestore(app);
    await addDoc(collection(db, 'users', user.uid, 'categories'), { name, color });
  }, [user]);

  const updateCategory = useCallback(async (id: string, name: string, color: string) => {
    if (!user) return;
    const db = getFirestore(app);
    await updateDoc(doc(db, 'users', user.uid, 'categories', id), { name, color });
  }, [user]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;
    const db = getFirestore(app);
    await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
  }, [user]);

  // --- CORREÇÃO 2: Retornar a versão memoizada das categorias padrão ---
  return { 
    defaultCategories: defaultCategoriesWithIds,
    userCategories,
    availableCategories,
    loading, 
    addCategory, 
    updateCategory, 
    deleteCategory 
  };
};