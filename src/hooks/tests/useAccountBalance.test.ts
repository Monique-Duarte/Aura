import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccountBalance } from '../useAccountBalance';
import { useAuth } from '../AuthContext';
import { onSnapshot, QuerySnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

// Mocks
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Tipo para os dados de teste
interface MockTransaction {
  type: 'income' | 'expense';
  amount: number;
  paymentMethod?: 'debit' | 'credit';
  isPaid?: boolean;
}

const mockedUseAuth = useAuth as Mock;
const mockedOnSnapshot = onSnapshot as Mock;

describe('useAccountBalance Hook', () => {

  // Variável para "capturar" a função de callback do onSnapshot
  let capturedOnSnapshotCallback: ((snapshot: QuerySnapshot<DocumentData>) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: { uid: 'test-user' }, loading: false });

    // Preparamos o mock do onSnapshot para capturar o callback quando for chamado
    mockedOnSnapshot.mockImplementation((query, callback) => {
      capturedOnSnapshotCallback = callback;
      // Retorna a função de unsubscribe
      return () => { capturedOnSnapshotCallback = null; };
    });
  });

  // Nova função auxiliar para "empurrar" dados para o hook
  const triggerFirestoreUpdate = (transactions: MockTransaction[]) => {
    const mockSnapshot = {
      forEach: (iteratorCallback: (doc: QueryDocumentSnapshot<DocumentData>) => void) => {
        transactions.forEach(t => {
          const mockDoc = { data: () => t } as unknown as QueryDocumentSnapshot<DocumentData>;
          iteratorCallback(mockDoc);
        });
      }
    };
    
    // Verificamos se o callback foi capturado antes de o chamar
    if (capturedOnSnapshotCallback) {
      act(() => {
        capturedOnSnapshotCallback(mockSnapshot as unknown as QuerySnapshot<DocumentData>);
      });
    }
  };

  it('deve debitar do saldo imediatamente após um gasto em débito', () => {
    // 1. Renderiza o hook. O useEffect é executado e o callback é capturado.
    const { result } = renderHook(() => useAccountBalance());

    // 2. Simula a primeira carga de dados do Firestore
    triggerFirestoreUpdate([{ type: 'income', amount: 1000 }]);
    expect(result.current.balance).toBe(1000);

    // 3. Simula uma atualização (um novo gasto é adicionado)
    triggerFirestoreUpdate([
      { type: 'income', amount: 1000 },
      { type: 'expense', paymentMethod: 'debit', amount: 150 },
    ]);
    expect(result.current.balance).toBe(850);
  });

  it('deve debitar do saldo apenas quando uma despesa de crédito for marcada como paga', () => {
    const { result } = renderHook(() => useAccountBalance());

    // Estado inicial: despesa de crédito não paga
    triggerFirestoreUpdate([
      { type: 'income', amount: 1000 },
      { type: 'expense', paymentMethod: 'credit', amount: 200, isPaid: false },
    ]);
    expect(result.current.balance).toBe(1000);

    // Estado atualizado: a mesma despesa agora está paga
    triggerFirestoreUpdate([
      { type: 'income', amount: 1000 },
      { type: 'expense', paymentMethod: 'credit', amount: 200, isPaid: true },
    ]);
    expect(result.current.balance).toBe(800);
  });

  it('ao pagar uma fatura, deve debitar apenas o valor das despesas que ainda não foram pagas', () => {
    const { result } = renderHook(() => useAccountBalance());

    // Estado inicial: uma despesa da fatura já está paga
    triggerFirestoreUpdate([
      { type: 'income', amount: 1000 },
      { type: 'expense', paymentMethod: 'credit', amount: 200, isPaid: false },
      { type: 'expense', paymentMethod: 'credit', amount: 100, isPaid: true },
    ]);
    expect(result.current.balance).toBe(900); // Saldo correto, 1000 - 100

    // Estado atualizado: a fatura inteira é paga, incluindo a despesa de 200
    triggerFirestoreUpdate([
      { type: 'income', amount: 1000 },
      { type: 'expense', paymentMethod: 'credit', amount: 200, isPaid: true }, // Agora está paga
      { type: 'expense', paymentMethod: 'credit', amount: 100, isPaid: true },
    ]);
    expect(result.current.balance).toBe(700); // Saldo correto, 900 - 200
  });

  // Teste de exclusão/reembolso
  it('deve restaurar o saldo corretamente ao excluir uma despesa que já foi debitada', () => {
    const { result } = renderHook(() => useAccountBalance());

    // 1. Estado inicial: Saldo já com uma despesa de débito
    const transactionsWithExpense: MockTransaction[] = [
      { type: 'income', amount: 1000 },
      { type: 'expense', paymentMethod: 'debit', amount: 50 },
    ];
    triggerFirestoreUpdate(transactionsWithExpense);

    // 2. Verificamos se o saldo inicial está correto (debitado)
    expect(result.current.balance).toBe(950);

    // 3. Simula a exclusão da despesa, removendo-a da lista
    const transactionsAfterDelete = transactionsWithExpense.filter(
      t => !(t.type === 'expense' && t.amount === 50)
    ); // Agora a lista só tem a renda de 1000

    // 4. Dispara a atualização para o hook com a lista sem a despesa
    triggerFirestoreUpdate(transactionsAfterDelete);

    // 5. O saldo deve retornar ao valor original, como se a despesa nunca tivesse existido
    expect(result.current.balance).toBe(1000);
  });
});