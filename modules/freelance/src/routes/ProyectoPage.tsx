import { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button, IconButton, Input, Panel } from "@doit/design-system";
import { useAccounts, useCreateTransaction } from "@doit/finance-core";
import {
  useClient,
  useCreateInvoice,
  useCreateTimeEntry,
  useDeleteTimeEntry,
  useInvoices,
  useMarkInvoicePaid,
  useProject,
  useTimeEntries,
  useUnbilledSummary,
} from "../hooks";
import "./freelance.css";

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Cobrada",
};

export function ProyectoPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = projectId as string;

  const { data: project } = useProject(id);
  const { data: client } = useClient(project?.clientId ?? null);

  const { data: entries } = useTimeEntries(id);
  const createEntry = useCreateTimeEntry(id);
  const deleteEntry = useDeleteTimeEntry(id);

  const { data: unbilled } = useUnbilledSummary(id);
  const { data: invoices } = useInvoices(id);
  const createInvoice = useCreateInvoice(id);
  const markPaid = useMarkInvoicePaid(id);

  const { data: accounts } = useAccounts();
  const createTransaction = useCreateTransaction();

  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entryHours, setEntryHours] = useState("");
  const [entryDesc, setEntryDesc] = useState("");

  function submitEntry() {
    const hours = Number(entryHours);
    if (!hours || hours <= 0) return;
    createEntry.mutate({ entryDate, hours, description: entryDesc.trim() || undefined });
    setEntryHours("");
    setEntryDesc("");
  }

  function submitInvoice() {
    const amount = unbilled?.suggestedAmount ?? 0;
    if (amount <= 0) return;
    createInvoice.mutate(amount);
  }

  async function payInvoice(invoiceId: string, amount: number) {
    const accountId = accounts?.[0]?.id;
    if (!accountId || !project || !client) return;
    const tx = await createTransaction.mutateAsync({
      accountId,
      transactionType: "sale",
      amount,
      note: `Factura ${client.name} — ${project.name}`,
      occurredAt: new Date().toISOString(),
    });
    markPaid.mutate({ id: invoiceId, transactionId: tx.id, paidAt: new Date().toISOString() });
  }

  if (!project) return null;

  return (
    <div className="freelance-page">
      <section className="freelance-project-list">
        <div className="freelance-detail-header">
          <div>
            <h1>{project.name}</h1>
            {client && <p className="freelance-client-contact">{client.name}</p>}
          </div>
          <span className={`freelance-project-status ${project.status}`}>{project.status}</span>
        </div>

        <Panel className="freelance-unbilled">
          <div>
            <span>Sin facturar</span>
            <div>
              <strong>
                {(unbilled?.suggestedAmount ?? 0).toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                })}
              </strong>
              {project.rateType === "hourly" && (
                <span> ({(unbilled?.hours ?? 0).toLocaleString("es-AR")} hs)</span>
              )}
            </div>
          </div>
          <Button onClick={submitInvoice}>Generar factura</Button>
        </Panel>

        {project.rateType === "hourly" && (
          <Panel className="ds-composer">
            <input
              className="ds-input"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Horas"
              value={entryHours}
              onChange={(e) => setEntryHours(e.target.value)}
            />
            <Input
              placeholder="Descripción (opcional)"
              value={entryDesc}
              onChange={(e) => setEntryDesc(e.target.value)}
            />
            <Button onClick={submitEntry}>
              <Plus size={14} /> Registrar horas
            </Button>
          </Panel>
        )}

        {project.rateType === "hourly" && (
          <div className="freelance-time-entries">
            {(entries ?? []).map((e) => (
              <div key={e.id} className="freelance-time-row">
                <strong>{e.hours}h</strong>
                <span className="freelance-time-row-desc">{e.description ?? "—"}</span>
                <span>{new Date(e.entryDate).toLocaleDateString("es-AR")}</span>
                {!e.invoiceId && (
                  <IconButton onClick={() => deleteEntry.mutate(e.id)} aria-label="Borrar">
                    <Trash2 size={13} />
                  </IconButton>
                )}
              </div>
            ))}
          </div>
        )}

        <h2>Facturas</h2>
        <div className="freelance-invoices">
          {(invoices ?? []).map((inv) => (
            <div key={inv.id} className="freelance-invoice-row">
              <strong>{inv.amount.toLocaleString("es-AR")}</strong>
              <span className={`freelance-invoice-status ${inv.status}`}>
                {INVOICE_STATUS_LABEL[inv.status]}
              </span>
              <span className="freelance-time-row-desc">
                {new Date(inv.issuedAt).toLocaleDateString("es-AR")}
              </span>
              {inv.status !== "paid" && (
                <Button variant="secondary" onClick={() => payInvoice(inv.id, inv.amount)}>
                  Marcar cobrada
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
