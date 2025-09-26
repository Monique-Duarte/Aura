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
import { useAuth } from "../../../app/providers/AuthContext";
import { useNotifier } from "../../../app/providers/NotificationContext";

// --- ARQUITETURA APLICADA ---
import { Transaction, ExpenseFormData } from "../../../shared/types/types";
import { transactionsService } from "../api/transactions.service";
import { useCreditCards, CreditCard } from "../../cards/hooks/useCreditCards";
import { useExpenseForm } from "../hooks/useExpenseForm";

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

  const [allFetchedExpenses, setAllFetchedExpenses] = useState<Transaction[]>(
    []
  );
  const { cards } = useCreditCards();
  const { formState, handleInputChange, setFormForEditing, resetForm } =
    useExpenseForm();

  // Estados de controle da UI
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

  const handleSaveExpense = async () => {
    if (!user || !formState.amount || !formState.description) {
      showNotification({
        message: "Descrição e valor são obrigatórios.",
        color: "warning",
      });
      return;
    }
    try {
      // O objeto do formulário é usado diretamente
      const formData: ExpenseFormData = {
        amount: formState.amount,
        description: formState.description,
        date: formState.date,
        isRecurring: formState.isRecurring,
        paymentMethod: formState.paymentMethod,
        installments: formState.installments,
        categories: formState.selectedCategories,
        cardId: formState.selectedCardId,
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
    setFormForEditing(expenseToAction);
    setShowModal(true);
  };

  const closeModalAndReset = () => {
    setShowModal(false);
    setEditingExpense(null);
    // 4. A lógica de resetar o formulário agora é uma única chamada
    resetForm();
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

  return (
    <PageLayout pageTitle="Lançamentos de Despesas">
      {/* ... Seu JSX da parte superior (filtros, etc.) permanece igual ... */}
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

      {/* O modal agora usa o 'formState' e 'handleInputChange' do hook */}
      <AppModal
        title={editingExpense ? "Editar Gasto" : "Novo Gasto"}
        isOpen={showModal}
        onClose={closeModalAndReset}
      >
        <IonItem>
          <IonLabel position="floating">Descrição</IonLabel>
          <IonInput
            value={formState.description}
            onIonChange={(e) =>
              handleInputChange("description", e.detail.value!)
            }
          />
        </IonItem>
        <CategorySelector
          selectedCategories={formState.selectedCategories}
          onCategoryChange={(cats) =>
            handleInputChange("selectedCategories", cats)
          }
        />
        <CurrencyInput
          label={
            formState.installments > 1 || editingExpense?.isInstallment
              ? "Valor Total (R$)"
              : "Valor (R$)"
          }
          value={formState.amount}
          onValueChange={(val) => handleInputChange("amount", val)}
        />
        <IonItem lines="none" className="date-item">
          <IonLabel>
            {formState.installments > 1 ? "Data da Primeira Parcela" : "Data"}
          </IonLabel>
          <IonDatetimeButton datetime="datetime-in-modal"></IonDatetimeButton>
        </IonItem>
        <IonSegment
          value={formState.paymentMethod}
          onIonChange={(e) =>
            handleInputChange("paymentMethod", e.detail.value as any)
          }
        >
          <IonSegmentButton value="debit">
            <IonLabel>Débito</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="credit">
            <IonLabel>Crédito</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        {formState.paymentMethod === "credit" && (
          <IonItem>
            <IonLabel>Cartão de Crédito</IonLabel>
            <IonSelect
              value={formState.selectedCardId}
              placeholder="Selecione (Opcional)"
              onIonChange={(e) =>
                handleInputChange("selectedCardId", e.detail.value)
              }
            >
              {cards.map((card) => (
                <IonSelectOption key={card.id} value={card.id}>
                  {card.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}
        {formState.paymentMethod === "credit" &&
          !editingExpense &&
          !formState.isRecurring && (
            <IonItem>
              <IonLabel position="floating">Nº de Parcelas</IonLabel>
              <IonInput
                type="number"
                value={formState.installments}
                onIonChange={(e) =>
                  handleInputChange(
                    "installments",
                    parseInt(e.detail.value!, 10) || 1
                  )
                }
              />
            </IonItem>
          )}
        {formState.installments > 1 && formState.amount && (
          <IonText
            color="medium"
            style={{ paddingLeft: "16px", fontSize: "0.8rem" }}
          >
            <p>
              {formState.installments}x de{" "}
              {(formState.amount / formState.installments).toLocaleString(
                "pt-BR",
                { style: "currency", currency: "BRL" }
              )}
            </p>
          </IonText>
        )}
        {formState.installments <= 1 && (
          <IonItem lines="none" className="toggle-item">
            <IonLabel>Gasto Fixo Mensal?</IonLabel>
            <IonToggle
              checked={formState.isRecurring}
              onIonChange={(e) =>
                handleInputChange("isRecurring", e.detail.checked)
              }
            />
          </IonItem>
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
          value={formState.date}
          onIonChange={(e) =>
            handleInputChange("date", e.detail.value as string)
          }
          presentation="date"
        />
      </IonModal>
    </PageLayout>
  );
};

export default Despesas;