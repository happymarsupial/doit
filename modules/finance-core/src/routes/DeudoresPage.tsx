import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, IconButton, Input, Modal, Panel } from "@doit/design-system";
import {
  useAccounts,
  useCreateDebt,
  useCreateDebtor,
  useDebtors,
  useDebts,
  useRecordDebtPayment,
} from "../hooks";
import "./finance.css";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagada",
};

export function DeudoresPage() {
  const { data: debtors } = useDebtors();
  const createDebtor = useCreateDebtor();
  const { data: accounts } = useAccounts();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newDebtorName, setNewDebtorName] = useState("");

  const { data: debts } = useDebts(selectedId);
  const createDebt = useCreateDebt();
  const recordPayment = useRecordDebtPayment();

  const [debtAmount, setDebtAmount] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [payingDebt, setPayingDebt] = useState<{ id: string; remaining: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState<string>("");

  async function addDebtor() {
    if (!newDebtorName.trim()) return;
    const debtor = await createDebtor.mutateAsync({ name: newDebtorName.trim() });
    setNewDebtorName("");
    setSelectedId(debtor.id);
  }

  function addDebt() {
    const value = Number(debtAmount);
    if (!selectedId || !value || value <= 0) return;
    createDebt.mutate({
      debtorId: selectedId,
      principalAmount: value,
      dueDate: debtDueDate ? new Date(debtDueDate).toISOString() : null,
    });
    setDebtAmount("");
    setDebtDueDate("");
  }

  function openPayment(debtId: string, remaining: number) {
    setPayingDebt({ id: debtId, remaining });
    setPaymentAmount(String(remaining));
    setPaymentAccountId(accounts?.[0]?.id ?? "");
  }

  function submitPayment() {
    const amount = Number(paymentAmount);
    if (!payingDebt || !paymentAccountId || !amount || amount <= 0) return;
    recordPayment.mutate({
      debtId: payingDebt.id,
      accountId: paymentAccountId,
      amount,
      paidAt: new Date().toISOString(),
    });
    setPayingDebt(null);
  }

  const totalOwed = (debtors ?? []).reduce((sum, d) => sum + d.totalOwed, 0);

  return (
    <div className="finance-page finance-debtors">
      <aside className="finance-debtor-list">
        <div className="finance-debtors-total">
          <span>Total por cobrar</span>
          <strong>{totalOwed.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</strong>
        </div>
        <h2>Deudores</h2>
        {(debtors ?? []).map((d) => (
          <button
            key={d.id}
            className={`finance-debtor-item ${selectedId === d.id ? "active" : ""}`}
            onClick={() => setSelectedId(d.id)}
          >
            <span className="finance-debtor-item-name">{d.name}</span>
            {d.totalOwed > 0 && (
              <span className="finance-debtor-item-balance">
                {d.totalOwed.toLocaleString("es-AR")}
              </span>
            )}
          </button>
        ))}
        <div className="finance-new-debtor">
          <Input
            placeholder="Nombre del deudor"
            value={newDebtorName}
            onChange={(e) => setNewDebtorName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDebtor()}
          />
          <Button variant="secondary" onClick={addDebtor}>
            <Plus size={14} />
          </Button>
        </div>
      </aside>

      <section className="finance-debtor-detail">
        {!selectedId && <p className="ds-empty">Elegí un deudor para ver sus deudas.</p>}
        {selectedId && (
          <>
            <h1>Deudas</h1>
            <Panel className="ds-composer">
              <Input
                type="number"
                placeholder="Monto"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
              />
              <input
                className="ds-input"
                type="date"
                value={debtDueDate}
                onChange={(e) => setDebtDueDate(e.target.value)}
              />
              <Button onClick={addDebt}>Nueva deuda</Button>
            </Panel>

            <div className="finance-debts">
              {(debts ?? []).map((debt) => {
                const overdue =
                  debt.status !== "paid" && debt.dueDate && new Date(debt.dueDate) < new Date();
                return (
                <Panel key={debt.id} className={`finance-debt-card ${overdue ? "overdue" : ""}`}>
                  <div>
                    <strong>{debt.principalAmount.toLocaleString("es-AR")}</strong>
                    <span className={`finance-debt-status ${debt.status}`}>
                      {STATUS_LABEL[debt.status]}
                    </span>
                    {overdue && <span className="finance-debt-status overdue">Vencida</span>}
                  </div>
                  <span>Saldo: {debt.balanceRemaining.toLocaleString("es-AR")}</span>
                  {debt.dueDate && (
                    <span>Vence: {new Date(debt.dueDate).toLocaleDateString("es-AR")}</span>
                  )}
                  {debt.status !== "paid" && (
                    <Button
                      variant="secondary"
                      onClick={() => openPayment(debt.id, debt.balanceRemaining)}
                    >
                      Registrar pago
                    </Button>
                  )}
                </Panel>
                );
              })}
            </div>
          </>
        )}
      </section>

      {payingDebt && (
        <Modal onClose={() => setPayingDebt(null)}>
          <div className="ds-modal-header">
            <strong>Registrar pago</strong>
            <IconButton onClick={() => setPayingDebt(null)} aria-label="Cerrar">
              <X size={16} />
            </IconButton>
          </div>
          <label className="ds-field">
            <span>Cuenta</span>
            <select
              className="ds-input"
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
            >
              {(accounts ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="ds-field">
            <span>Monto (saldo: {payingDebt.remaining.toLocaleString("es-AR")})</span>
            <Input
              autoFocus
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPayment()}
            />
          </label>
          <Button onClick={submitPayment}>Confirmar pago</Button>
        </Modal>
      )}
    </div>
  );
}
