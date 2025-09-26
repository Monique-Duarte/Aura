import React, { useState, useEffect, useMemo } from "react";
import {
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonDatetime,
  IonToggle,
  IonText,
  IonSpinner,
  IonDatetimeButton,
  IonSegment,
  IonSegmentButton,
  IonActionSheet,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonAlert,
} from "@ionic/react";
import { add, close, pencil, trash } from "ionicons/icons";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../../../app/providers/AuthContext";
import { useNotifier } from "../../../app/providers/NotificationContext";

// --- ARQUITETURA APLICADA ---
import { transactionsService } from "../api/transactions.service";
import { Transaction, ExpenseFormData } from "../../../shared/types/types";
import { useCreditCards, CreditCard } from "../../cards/hooks/useCreditCards";

// --- COMPONENTES COMPARTILHADOS ---
import CategorySelector from "../../categories/components/CategorySelector";
import PeriodSelector, {
  Period,
} from "../../../shared/components/PeriodSelector";
import ActionButton from "../../../shared/components/ActionButton";
import ActionAlert from "../../../shared/components/ActionAlert";
import CurrencyInput from "../../../shared/components/CurrencyInput";
import PageLayout from "../../../shared/components/PageLayout";
import AppModal from "../../../shared/components/AppModal";
import "../../../shared/styles/Lancamentos.css";

const filterOptions = [
  { key: "all", label: "Despesas Totais" },
  { key: "credit", label: "Gastos Crédito" },
  { key: "debit", label: "Gastos Débito" },
] as const;
type FilterMode = (typeof filterOptions)[number]["key"];

const Despesas: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifier();

  // Estados de Dados (agora vindos de hooks e serviços)
  const [allFetchedExpenses, setAllFetchedExpenses] = useState<Transaction[]>(
    []
  );
  const { cards } = useCreditCards();

  // Estados de UI (permanecem no componente)
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(
    null
  );
  const [expenseToAction, setExpenseToAction] = useState<Transaction | null>(
    null
  );
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showInstallmentDeleteAlert, setShowInstallmentDeleteAlert] =
    useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Estados do Formulário (permanecem no componente por enquanto)
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | undefined>();
  const [date, setDate] = useState(new Date().toISOString());
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "debit">(
    "debit"
  );
  const [installments, setInstallments] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>();

  // Efeito para buscar dados usando o serviço
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = transactionsService.listenToExpenses(
      user.uid,
      (expenses) => {
        setAllFetchedExpenses(expenses);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Lógica de apresentação (useMemo) - SEM ALTERAÇÕES VISUAIS
  const expensesForPeriod = useMemo(() => {
    if (!selectedPeriod) return [];
    return allFetchedExpenses.filter((expense) => {
      const expenseDate = expense.date.toDate();
      return (
        expenseDate >= selectedPeriod.startDate &&
        expenseDate <= selectedPeriod.endDate
      );
    });
  }, [allFetchedExpenses, selectedPeriod]);

  // Funções de Ação que agora chamam o serviço
  const handleSaveExpense = async () => {
    if (!user || !amount || !description) {
      showNotification({
        message: "Descrição e valor são obrigatórios.",
        color: "warning",
      });
      return;
    }
    try {
      const formData: ExpenseFormData = {
        amount,
        description,
        date,
        isRecurring,
        paymentMethod,
        installments,
        categories: selectedCategories,
        cardId: selectedCardId,
      };
      await transactionsService.saveExpense(
        user.uid,
        formData,
        editingExpense?.id ?? null
      );
      showNotification({
        message: "Despesa salva com sucesso!",
        color: "success",
      });
      closeModalAndReset();
    } catch (error) {
      showNotification({ message: "Erro ao salvar despesa.", color: "danger" });
    }
  };

  const confirmDelete = async () => {
    if (!user || !expenseToAction) return;
    try {
      await transactionsService.deleteExpense(user.uid, expenseToAction.id);
      showNotification({ message: "Despesa excluída!", color: "success" });
    } catch (error) {
      showNotification({ message: "Erro ao excluir.", color: "danger" });
    }
    setShowDeleteAlert(false);
    setExpenseToAction(null);
  };

  const confirmDeleteFutureInstallments = async () => {
    if (!user || !expenseToAction) return;
    try {
      await transactionsService.deleteFutureInstallments(
        user.uid,
        expenseToAction
      );
      showNotification({
        message: "Parcelas futuras excluídas!",
        color: "success",
      });
    } catch (error) {
      showNotification({
        message: "Erro ao excluir parcelas.",
        color: "danger",
      });
    }
    setShowInstallmentDeleteAlert(false);
    setExpenseToAction(null);
  };

  // Funções de UI (sem alterações de lógica)
  const confirmDeleteSingleInstallment = async () => {
    await confirmDelete();
    setShowInstallmentDeleteAlert(false);
  };
  const handleItemClick = (expense: Transaction) => {
    setExpenseToAction(expense);
    setShowActionSheet(true);
  };
  const handleDeleteClick = () => {
    if (!expenseToAction) return;
    if (expenseToAction.isInstallment) {
      setShowInstallmentDeleteAlert(true);
    } else {
      setShowDeleteAlert(true);
    }
  };
  const handleEditClick = () => {
    if (!expenseToAction) return;
    setEditingExpense(expenseToAction);
    setDescription(expenseToAction.description);
    setAmount(expenseToAction.amount);
    setDate(expenseToAction.date.toDate().toISOString());
    setIsRecurring(expenseToAction.isRecurring);
    setPaymentMethod(expenseToAction.paymentMethod || "debit");
    setSelectedCategories(expenseToAction.categories || []);
    setSelectedCardId(expenseToAction.cardId);
    setInstallments(1);
    setShowModal(true);
  };
  const closeModalAndReset = () => {
    setShowModal(false);
    setEditingExpense(null);
    setDescription("");
    setAmount(undefined);
    setDate(new Date().toISOString());
    setIsRecurring(false);
    setPaymentMethod("debit");
    setInstallments(1);
    setSelectedCategories([]);
    setSelectedCardId(undefined);
  };

  const displayedExpenses = useMemo(() => {
    const filtered =
      filterMode === "all"
        ? expensesForPeriod
        : expensesForPeriod.filter((exp) => exp.paymentMethod === filterMode);
    return filtered.sort(
      (a, b) => a.date.toDate().getTime() - b.date.toDate().getTime()
    );
  }, [expensesForPeriod, filterMode]);
  const totalExpense = displayedExpenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  // --- JSX (VISUAL) 100% PRESERVADO ---
  return (
    <PageLayout pageTitle="Lançamentos de Despesas">
      <div className="summary-card">
        <IonText>
          <p>Total gasto no período</p>
        </IonText>
        <IonText color="danger">
          <h2>
            {totalExpense.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>
        </IonText>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <PeriodSelector onPeriodChange={setSelectedPeriod} />
      </div>
      <div
        className="dashboard-chart-legend"
        style={{ justifyContent: "center" }}
      >
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            className={`dashboard-legend-btn${
              filterMode === opt.key ? " active" : ""
            }`}
            onClick={() => setFilterMode(opt.key)}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <IonSpinner />
        </div>
      ) : (
        <IonList>
          {displayedExpenses.map((expense) => (
            <IonItem
              key={expense.id}
              lines="inset"
              button
              onClick={() => handleItemClick(expense)}
            >
              <IonLabel>
                <h2>{expense.description}</h2>
                <p>{expense.date.toDate().toLocaleDateString("pt-BR")}</p>
              </IonLabel>
              <div slot="end" className="item-details-end">
                <IonText color="danger">
                  <p>
                    {expense.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </IonText>
                {expense.paymentMethod && (
                  <div
                    className={`payment-method-tag ${expense.paymentMethod}`}
                  >
                    {expense.paymentMethod === "credit" ? "CRÉD" : "DÉB"}
                  </div>
                )}
              </div>
            </IonItem>
          ))}
        </IonList>
      )}

      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={() => setShowModal(true)}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      <AppModal
        title={editingExpense ? "Editar Gasto" : "Novo Gasto"}
        isOpen={showModal}
        onClose={closeModalAndReset}
      >
        <div className="form-field-group">
          <IonItem>
            <IonLabel position="floating">Descrição</IonLabel>
            <IonInput
              value={description}
              onIonChange={(e) => setDescription(e.detail.value!)}
              placeholder="Ex: Tênis, Supermercado"
            />
          </IonItem>
        </div>
        <div className="form-field-group">
          <CategorySelector
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
          />
        </div>
        <div className="form-field-group">
          <CurrencyInput
            label={
              installments > 1 || editingExpense?.isInstallment
                ? "Valor Total (R$)"
                : "Valor (R$)"
            }
            value={amount}
            onValueChange={setAmount}
          />
        </div>
        <div className="form-field-group">
          <IonItem lines="none" className="date-item">
            <IonLabel>
              {installments > 1 ? "Data da Primeira Parcela" : "Data"}
            </IonLabel>
            <IonDatetimeButton datetime="datetime-in-modal"></IonDatetimeButton>
          </IonItem>
        </div>
        <div className="form-field-group">
          <IonLabel
            style={{
              paddingLeft: "16px",
              color: "var(--ion-color-medium-shade)",
            }}
          >
            Forma de Pagamento
          </IonLabel>
          <IonSegment
            value={paymentMethod}
            onIonChange={(e) => setPaymentMethod(e.detail.value as any)}
          >
            <IonSegmentButton value="debit">
              <IonLabel>Débito</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="credit">
              <IonLabel>Crédito</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>
        {paymentMethod === "credit" && (
          <div className="form-field-group">
            <IonItem>
              <IonLabel>Cartão de Crédito</IonLabel>
              <IonSelect
                value={selectedCardId}
                placeholder="Selecione (Opcional)"
                onIonChange={(e) => setSelectedCardId(e.detail.value)}
              >
                {cards.map((card) => (
                  <IonSelectOption key={card.id} value={card.id}>
                    {card.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </div>
        )}
        {paymentMethod === "credit" && !editingExpense && !isRecurring && (
          <div className="form-field-group">
            <IonItem>
              <IonLabel position="floating">Nº de Parcelas</IonLabel>
              <IonInput
                type="number"
                value={installments}
                onIonChange={(e) =>
                  setInstallments(parseInt(e.detail.value!, 10) || 1)
                }
              />
            </IonItem>
            {installments > 1 && amount && (
              <IonText
                color="medium"
                style={{ paddingLeft: "16px", fontSize: "0.8rem" }}
              >
                <p>
                  {installments}x de{" "}
                  {(amount / installments).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </IonText>
            )}
          </div>
        )}
        {installments <= 1 && (
          <div className="form-field-group">
            <IonItem lines="none" className="toggle-item">
              <IonLabel>Gasto Fixo Mensal?</IonLabel>
              <IonToggle
                checked={isRecurring}
                onIonChange={(e) => setIsRecurring(e.detail.checked)}
              />
            </IonItem>
          </div>
        )}
        <ActionButton
          onClick={handleSaveExpense}
          expand="block"
          color="primary"
        >
          {editingExpense ? "Salvar Alterações" : "Salvar Gasto"}
        </ActionButton>
      </AppModal>

      <ActionAlert
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        header={"Confirmar Exclusão"}
        message={"Tem certeza que deseja excluir este lançamento?"}
        onConfirm={confirmDelete}
        confirmButtonText="Excluir"
      />
      <IonAlert
        isOpen={showInstallmentDeleteAlert}
        onDidDismiss={() => setShowInstallmentDeleteAlert(false)}
        header={"Excluir Despesa Parcelada"}
        message={
          "Você deseja excluir apenas esta parcela ou esta e todas as futuras?"
        }
        buttons={[
          { text: "Apenas Esta", handler: confirmDeleteSingleInstallment },
          {
            text: "Esta e as Próximas",
            cssClass: "alert-button-danger",
            handler: confirmDeleteFutureInstallments,
          },
          { text: "Cancelar", role: "cancel" },
        ]}
      />
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header={expenseToAction?.description}
        buttons={[
          {
            text: "Editar",
            icon: pencil,
            handler: handleEditClick,
            cssClass: "action-sheet-edit",
          },
          {
            text: "Excluir",
            role: "destructive",
            icon: trash,
            handler: handleDeleteClick,
          },
          { text: "Cancelar", icon: close, role: "cancel" },
        ]}
      />
      <IonModal keepContentsMounted={true}>
        <IonDatetime
          id="datetime-in-modal"
          value={date}
          onIonChange={(e) => setDate(e.detail.value as string)}
          presentation="date"
        />
      </IonModal>
    </PageLayout>
  );
};

export default Despesas;