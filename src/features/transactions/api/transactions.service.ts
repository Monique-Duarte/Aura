import {
  getFirestore, collection, addDoc, query, where, Timestamp, doc, deleteDoc,
  updateDoc, writeBatch, onSnapshot, getDocs
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../../../firebaseConfig';
import { Transaction, ExpenseFormData } from '../../../shared/types/types';

const db = getFirestore(app);

export const transactionsService = {
  listenToExpenses: (userId: string, callback: (expenses: Transaction[]) => void) => {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const q = query(transactionsRef, where('type', '==', 'expense'));

    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(),
      } as Transaction));
      callback(expenses);
    }, (error) => {
      console.error("Erro ao buscar despesas:", error);
      callback([]);
    });
  },

  saveExpense: async (userId: string, formData: ExpenseFormData, editingId: string | null = null) => {
    // A conversão da data acontece aqui dentro, onde deveria.
    const formDateAsTimestamp = Timestamp.fromDate(new Date(formData.date));

    if (formData.paymentMethod === 'credit' && formData.installments > 1 && !editingId) {
      const batch = writeBatch(db);
      const groupId = uuidv4();
      const installmentAmount = Math.abs(formData.amount) / formData.installments;

      for (let i = 0; i < formData.installments; i++) {
        const installmentDate = new Date(formData.date);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        const newDocRef = doc(collection(db, 'users', userId, 'transactions'));

        const data: Omit<Transaction, 'id'> = {
          type: 'expense',
          amount: installmentAmount,
          description: `${formData.description} (${i + 1}/${formData.installments})`,
          date: Timestamp.fromDate(installmentDate),
          isRecurring: false,
          paymentMethod: 'credit',
          isInstallment: true,
          installmentNumber: i + 1,
          totalInstallments: formData.installments,
          installmentGroupId: groupId,
          categories: formData.categories,
          isPaid: false,
          cardId: formData.cardId,
        };
        batch.set(newDocRef, data);
      }
      await batch.commit();
    } else {
      const dataToSave = {
        type: 'expense',
        amount: Math.abs(formData.amount),
        description: formData.description,
        date: formDateAsTimestamp, // <-- Usando a data convertida
        isRecurring: formData.isRecurring,
        paymentMethod: formData.paymentMethod,
        categories: formData.categories,
        isPaid: formData.paymentMethod === 'debit',
        cardId: formData.paymentMethod === 'credit' ? formData.cardId : undefined,
        recurringDay: formData.isRecurring ? new Date(formData.date).getDate() : undefined,
      };

      if (editingId) {
        const docRef = doc(db, 'users', userId, 'transactions', editingId);
        await updateDoc(docRef, dataToSave);
      } else {
        await addDoc(collection(db, 'users', userId, 'transactions'), dataToSave);
      }
    }
  },

  deleteExpense: (userId: string, expenseId: string) => {
    const docRef = doc(db, 'users', userId, 'transactions', expenseId);
    return deleteDoc(docRef);
  },

  deleteFutureInstallments: async (userId: string, expense: Transaction) => {
    if (!expense.installmentGroupId || typeof expense.installmentNumber === 'undefined') return;
    const batch = writeBatch(db);
    const q = query(
      collection(db, 'users', userId, 'transactions'),
      where('installmentGroupId', '==', expense.installmentGroupId),
      where('installmentNumber', '>=', expense.installmentNumber)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(document => batch.delete(document.ref));
    await batch.commit();
  },
};