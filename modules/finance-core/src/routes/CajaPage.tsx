import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Plus, Repeat, X } from "lucide-react";
import { Button, IconButton, Input, Panel } from "@doit/design-system";
import {
  useAccountBalances,
  useCreateAccount,
  useCreateRecurringCharge,
  useCreateTransaction,
  useDeactivateRecurringCharge,
  useRecurringCharges,
  useTransactions,
} from "../hooks";
import type { CategoryKind, TransactionType } from "../types";
import "./finance.css";

export function CajaPage() {
  const { data: balances } = useAccountBalances();
  const createAccount = useCreateAccount();

  const primaryAccount = balances?.[0];
  const { data: transactions } = useTransactions(primaryAccount?.id);
  const createTransaction = useCreateTransaction();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<TransactionType>("income");

  const { data: recurringCharges } = useRecurringCharges();
  const createRecurringCharge = useCreateRecurringCharge();
  const deactivateRecurringCharge = useDeactivateRecurringCharge();
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringName, setRecurringName] = useState("");
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringType, setRecurringType] = useState<CategoryKind>("expense");
  const [recurringDay, setRecurringDay] = useState(1);

  function submitRecurring() {
    const value = Number(recurringAmount);
    if (!primaryAccount || !recurringName.trim() || !value || value <= 0) return;
    createRecurringCharge.mutate({
      accountId: primaryAccount.id,
      name: recurringName.trim(),
      chargeType: recurringType,
      amount: value,
      billingDay: recurringDay,
    });
    setRecurringName("");
    setRecurringAmount("");
    setRecurringDay(1);
    setShowRecurringForm(false);
  }

  function submit() {
    const value = Number(amount);
    if (!primaryAccount || !value || value <= 0) return;
    createTransaction.mutate({
      accountId: primaryAccount.id,
      transactionType: type,
      amount: value,
      note: note.trim() || null,
      occurredAt: new Date().toISOString(),
    });
    setAmount("");
    setNote("");
  }

  if (!balances) return null;

  if (balances.length === 0) {
    return (
      <div className="finance-page">
        <h1>Caja</h1>
        <p className="ds-empty">Todavía no tenés ninguna caja creada.</p>
        <Button onClick={() => createAccount.mutate({ name: "Caja", accountType: "cash_register" })}>
          <Plus size={16} /> Crear caja
        </Button>
      </div>
    );
  }

  return (
    <div className="finance-page">
      <h1>Caja</h1>

      <div className="finance-accounts">
        {balances.map((b) => (
          <Panel key={b.id} className="finance-account-card">
            <span className="finance-account-name">{b.name}</span>
            <span className="finance-account-balance">
              {b.balance.toLocaleString("es-AR", { style: "currency", currency: b.currency })}
            </span>
          </Panel>
        ))}
      </div>

      <Panel className="ds-composer">
        <div className="ds-toggle">
          <button
            className={type === "income" ? "active income" : ""}
            onClick={() => setType("income")}
            type="button"
          >
            <ArrowUpCircle size={16} /> Ingreso
          </button>
          <button
            className={type === "expense" ? "active expense" : ""}
            onClick={() => setType("expense")}
            type="button"
          >
            <ArrowDownCircle size={16} /> Gasto
          </button>
        </div>
        <Input
          type="number"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button onClick={submit}>Registrar</Button>
      </Panel>

      <section className="finance-recurring">
        <div className="finance-recurring-header">
          <h2>
            <Repeat size={15} /> Gastos e ingresos fijos
          </h2>
          <Button variant="secondary" onClick={() => setShowRecurringForm((v) => !v)}>
            <Plus size={14} /> Nuevo
          </Button>
        </div>
        <p className="finance-recurring-hint">
          Alquiler, hosting, suscripciones, o un cobro mensual fijo a un cliente. Se registran solos
          cada mes.
        </p>

        {showRecurringForm && (
          <Panel className="ds-composer">
            <div className="ds-toggle">
              <button
                className={recurringType === "income" ? "active income" : ""}
                onClick={() => setRecurringType("income")}
                type="button"
              >
                <ArrowUpCircle size={16} /> Ingreso
              </button>
              <button
                className={recurringType === "expense" ? "active expense" : ""}
                onClick={() => setRecurringType("expense")}
                type="button"
              >
                <ArrowDownCircle size={16} /> Gasto
              </button>
            </div>
            <Input
              placeholder="Nombre (ej. Hosting cliente X)"
              value={recurringName}
              onChange={(e) => setRecurringName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Monto"
              value={recurringAmount}
              onChange={(e) => setRecurringAmount(e.target.value)}
            />
            <label className="ds-field finance-day-field">
              <span>Día del mes que cobra</span>
              <select
                className="ds-input"
                value={recurringDay}
                onChange={(e) => setRecurringDay(Number(e.target.value))}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <span className="finance-day-hint">
                Si un mes tiene menos días, se cobra el último día de ese mes.
              </span>
            </label>
            <Button onClick={submitRecurring}>Guardar</Button>
          </Panel>
        )}

        <div className="finance-recurring-list">
          {(recurringCharges ?? []).map((c) => (
            <div key={c.id} className="finance-recurring-row">
              <span className={`finance-transaction-badge ${c.type}`}>
                {c.type === "income" ? "+" : "-"}
                {c.amount.toLocaleString("es-AR")}
              </span>
              <span className="finance-transaction-note">{c.name}</span>
              <span className="finance-transaction-date">
                Día {c.billingDay} · próximo {new Date(c.nextOccurrence).toLocaleDateString("es-AR")}
              </span>
              <IconButton
                onClick={() => deactivateRecurringCharge.mutate(c.id)}
                aria-label="Desactivar"
              >
                <X size={13} />
              </IconButton>
            </div>
          ))}
        </div>
      </section>

      <div className="finance-transactions">
        {(transactions ?? []).map((t) => (
          <div key={t.id} className="finance-transaction-row">
            <span className={`finance-transaction-badge ${t.type}`}>
              {t.type === "income" || t.type === "sale" || t.type === "debt_payment" ? "+" : "-"}
              {t.amount.toLocaleString("es-AR")}
            </span>
            <span className="finance-transaction-note">{t.note ?? "—"}</span>
            <span className="finance-transaction-date">
              {new Date(t.occurredAt).toLocaleDateString("es-AR")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
