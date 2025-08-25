import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app } from '../firebaseConfig';

export interface IncomeCategory {
  id: string;
  name: string;
  isDefault?: boolean;
}

const DEFAULT_INCOME_CATEGORIES: IncomeCategory[] = [
  { id: 'default_salary', name: 'Salário', isDefault: true },
  { id: 'default_freelance', name: 'Freelance', isDefault: true },
  { id: 'default_investment', name: 'Investimentos', isDefault: true },
];

export const useIncomeCategories = () => {
  const { user } = useAuth();
  const [userCategories, setUserCategories] = useState<IncomeCategory[]>([]);
  const [hiddenDefaultIds, setHiddenDefaultIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const db = getFirestore(app);
    const categoriesRef = collection(db, 'users', user.uid, 'income_categories');
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      setUserCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IncomeCategory[]);
      setLoading(false);
    });
    const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
      setHiddenDefaultIds(docSnap.data()?.hiddenDefaultIncomeCategoryIds || []);
    });

    return () => {
      unsubscribeCategories();
      unsubscribeUserDoc();
    };
  }, [user]);

  const { visibleCategories, hiddenCategories } = useMemo(() => {
    const userCategoryNames = new Set(userCategories.map(cat => cat.name.toLowerCase()));
    
    const visibleDefaults = DEFAULT_INCOME_CATEGORIES.filter(
      defaultCat => 
        !userCategoryNames.has(defaultCat.name.toLowerCase()) && 
        !hiddenDefaultIds.includes(defaultCat.id)
    );
    const visible = [...visibleDefaults, ...userCategories].sort((a, b) => a.name.localeCompare(b.name));

    const hidden = DEFAULT_INCOME_CATEGORIES.filter(
        defaultCat => hiddenDefaultIds.includes(defaultCat.id)
    ).sort((a, b) => a.name.localeCompare(b.name));

    return { visibleCategories: visible, hiddenCategories: hidden };
  }, [userCategories, hiddenDefaultIds]);


  const addCategory = useCallback(async (name: string) => {
    if (!user) return;
    const db = getFirestore(app);
    await addDoc(collection(db, 'users', user.uid, 'income_categories'), { name, isDefault: false });
  }, [user]);

  const updateCategory = useCallback(async (id: string, name: string) => {
    if (!user) return;
    const db = getFirestore(app);
    await updateDoc(doc(db, 'users', user.uid, 'income_categories', id), { name });
  }, [user]);
  
  const hideOrDeleteCategory = useCallback(async (category: IncomeCategory) => {
    if (!user) return;
    const db = getFirestore(app);

    if (category.isDefault) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { hiddenDefaultIncomeCategoryIds: arrayUnion(category.id) });
    } else {
      await deleteDoc(doc(db, 'users', user.uid, 'income_categories', category.id));
    }
  }, [user]);

  const reEnableCategory = useCallback(async (category: IncomeCategory) => {
    if (!user || !category.isDefault) return;
    const db = getFirestore(app);
    
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, { hiddenDefaultIncomeCategoryIds: arrayRemove(category.id) });
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