import { getFirestore, collection, addDoc, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import app from '../firebaseConfig';

// Interface para os dados que a função de salvar espera receber
interface SaveExpenseData {
  description: string;
  amount: number;
  date: string;
  isRecurring: boolean;
  paymentMethod: 'credit' | 'debit';
  installments: number;
  categories: string[];
  editingExpenseId?: string | null;
}

/**
 * Salva uma despesa no Firestore, lidando com casos de
 * lançamento único, recorrente e parcelado.
 */
export const saveExpense = async (userId: string, data: SaveExpenseData) => {
  const {
    description,
    amount,
    date,
    isRecurring,
    paymentMethod,
    installments,
    categories,
    editingExpenseId,
  } = data;

  const db = getFirestore(app);

  // Lógica para compras parceladas (apenas para novas despesas de crédito)
  if (paymentMethod === 'credit' && installments > 1 && !editingExpenseId) {
    const batch = writeBatch(db);
    const groupId = uuidv4(); // ID único para agrupar todas as parcelas

    for (let i = 0; i < installments; i++) {
      const installmentDate = new Date(date);
      installmentDate.setMonth(installmentDate.getMonth() + i);

      const newDocRef = doc(collection(db, 'users', userId, 'transactions'));
      batch.set(newDocRef, {
        type: 'expense',
        amount: Math.abs(amount),
        description: `${description} (${i + 1}/${installments})`,
        date: Timestamp.fromDate(installmentDate),
        isRecurring: false, // Parcelamento não é recorrente
        paymentMethod,
        isInstallment: true,
        installmentNumber: i + 1,
        totalInstallments: installments,
        installmentGroupId: groupId,
        categories,
      });
    }
    await batch.commit();
  } else {
    // Lógica para lançamento único ou edição
    const dataToSave = {
      amount: Math.abs(amount),
      description,
      date: Timestamp.fromDate(new Date(date)),
      isRecurring,
      paymentMethod,
      categories,
      ...(isRecurring && { recurringDay: new Date(date).getDate() }),
    };

    if (editingExpenseId) {
      const docRef = doc(db, 'users', userId, 'transactions', editingExpenseId);
      await updateDoc(docRef, dataToSave);
    } else {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      await addDoc(transactionsRef, { ...dataToSave, type: 'expense' });
    }
  }
};