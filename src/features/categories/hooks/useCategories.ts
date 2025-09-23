import { useState, useEffect, useMemo, useCallback } from 'react';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../../../app/providers/AuthContext';
import { app } from '../../../firebaseConfig';


export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "default-casa", name: "Casa", color: "#3880ff", isDefault: true },
  { id: "default-mercado", name: "Mercado", color: "#72f2f7ff", isDefault: true },
  { id: "default-restaurantes", name: "Restaurantes", color: "#2dd36f", isDefault: true },
  { id: "default-saude", name: "Saúde", color: "#ffc409", isDefault: true },
  { id: "default-transporte", name: "Transporte", color: "#eb445a", isDefault: true },
  { id: "default-assinaturas", name: "Assinaturas", color: "#9254de", isDefault: true },
  { id: "default-outros", name: "Outros", color: "#a0a0a0", isDefault: true },
];

export const useCategories = () => {
  const { user } = useAuth();
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [hiddenDefaultIds, setHiddenDefaultIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const db = getFirestore(app);
    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      setUserCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
      setLoading(false);
    });
    const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
      setHiddenDefaultIds(docSnap.data()?.hiddenDefaultCategoryIds || []);
    });

    return () => {
      unsubscribeCategories();
      unsubscribeUserDoc();
    };
  }, [user]);

  const { visibleCategories, hiddenCategories } = useMemo(() => {
    const userCategoryNames = new Set(userCategories.map(cat => cat.name.toLowerCase()));
    
    const visibleDefaults = DEFAULT_CATEGORIES.filter(
      defaultCat => 
        !userCategoryNames.has(defaultCat.name.toLowerCase()) && 
        !hiddenDefaultIds.includes(defaultCat.id)
    );
    const visible = [...visibleDefaults, ...userCategories].sort((a, b) => a.name.localeCompare(b.name));

    const hidden = DEFAULT_CATEGORIES.filter(
        defaultCat => hiddenDefaultIds.includes(defaultCat.id)
    ).sort((a, b) => a.name.localeCompare(b.name));

    return { visibleCategories: visible, hiddenCategories: hidden };
  }, [userCategories, hiddenDefaultIds]);


  const addCategory = useCallback(async (name: string, color: string) => {
    if (!user) return;
    const db = getFirestore(app);
    await addDoc(collection(db, 'users', user.uid, 'categories'), { name, color, isDefault: false });
  }, [user]);

  const updateCategory = useCallback(async (id: string, name: string, color: string) => {
    if (!user) return;
    const db = getFirestore(app);
    await updateDoc(doc(db, 'users', user.uid, 'categories', id), { name, color });
  }, [user]);
  
  const hideOrDeleteCategory = useCallback(async (category: Category) => {
    if (!user) return;
    const db = getFirestore(app);

    if (category.isDefault) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { hiddenDefaultCategoryIds: arrayUnion(category.id) });
    } else {
      await deleteDoc(doc(db, 'users', user.uid, 'categories', category.id));
    }
  }, [user]);

  const reEnableCategory = useCallback(async (category: Category) => {
    if (!user || !category.isDefault) return;
    const db = getFirestore(app);
    
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { hiddenDefaultCategoryIds: arrayRemove(category.id) });
  }, [user]);

  return { 
    visibleCategories,
    hiddenCategories,
    loading, 
    addCategory, 
    updateCategory, 
    hideOrDeleteCategory,
    reEnableCategory
  };
};