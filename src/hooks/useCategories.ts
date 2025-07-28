import { useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import app from '../firebaseConfig';

// --- Interfaces e Constantes ---
export interface Category {
  id: string;
  name: string;
  color?: string;
}

// Adicionamos cores padrão para as categorias fixas
const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: "Casa", color: "#3880ff" },
  { name: "Mercado", color: "#72f2f7ff" },
  { name: "Restaurantes", color: "#2dd36f" },
  { name: "Saúde", color: "#ffc409" },
  { name: "Transporte", color: "#eb445a" },
  { name: "Assinaturas/Streaming", color: "#9254de" },
  { name: "Outros", color: "#a0a0a0" },
];

export const useCategories = () => {
  const { user } = useAuth();
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const defaultCats: Category[] = DEFAULT_CATEGORIES.map(cat => ({
      id: cat.name.toLowerCase(),
      name: cat.name,
      color: cat.color,
    }));

    if (!user) {
        setAvailableCategories(defaultCats.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
        return;
    }
    
    setLoading(true);
    try {
        const db = getFirestore(app);
        
        const customCatsRef = collection(db, 'users', user.uid, 'categories');
        const querySnapshot = await getDocs(customCatsRef);
        // Agora buscamos o nome e a cor das categorias do usuário
        const customCats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          color: doc.data().color, // Pega a cor salva
        })) as Category[];

        const allCats = [...defaultCats, ...customCats];
        // O Map garante que se um usuário criar uma categoria com o mesmo nome de uma padrão, a dele (customizada) prevalecerá
        const uniqueCats = Array.from(new Map(allCats.map(cat => [cat.name, cat])).values());
        
        setAvailableCategories(uniqueCats.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        setAvailableCategories(defaultCats.sort((a, b) => a.name.localeCompare(b.name)));
    } finally {
        setLoading(false);
    }
  }, [user]);

  // A função de criar agora aceita o nome e a cor
  const createCategory = async (categoryName: string, categoryColor: string) => {
    if (!user || !categoryName.trim()) return;
    const db = getFirestore(app);
    const customCatsRef = collection(db, 'users', user.uid, 'categories');
    try {
        // Salva o nome e a cor no Firestore
        await addDoc(customCatsRef, { 
            name: categoryName.trim(),
            color: categoryColor || '#cccccc' // Salva a cor ou um cinza padrão
        });
        fetchCategories(); // Re-busca as categorias para incluir a nova
    } catch (error) {
        console.error("Erro ao criar categoria:", error);
    }
  };

  return { availableCategories, loading, fetchCategories, createCategory };
};
