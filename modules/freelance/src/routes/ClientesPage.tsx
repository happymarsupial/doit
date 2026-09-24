import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Plus } from "lucide-react";
import { Button, Input, Panel } from "@doit/design-system";
import { useClients, useCreateClient, useCreateProject, useProjects } from "../hooks";
import type { RateType } from "../types";
import "./freelance.css";

export function ClientesPage() {
  const navigate = useNavigate();
  const { data: clients } = useClients();
  const createClient = useCreateClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientContact, setNewClientContact] = useState("");

  const { data: projects } = useProjects(selectedId);
  const createProject = useCreateProject();

  const [projectName, setProjectName] = useState("");
  const [rateType, setRateType] = useState<RateType>("hourly");
  const [rateAmount, setRateAmount] = useState("");

  async function addClient() {
    if (!newClientName.trim()) return;
    const client = await createClient.mutateAsync({
      name: newClientName.trim(),
      contact: newClientContact.trim() || undefined,
    });
    setNewClientName("");
    setNewClientContact("");
    setSelectedId(client.id);
  }

  function addProject() {
    const rate = Number(rateAmount);
    if (!selectedId || !projectName.trim() || !rate || rate <= 0) return;
    createProject.mutate({ clientId: selectedId, name: projectName.trim(), rateType, rateAmount: rate });
    setProjectName("");
    setRateAmount("");
  }

  const selectedClient = clients?.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="freelance-page">
      <aside className="freelance-client-list">
        <h2>Clientes</h2>
        {(clients ?? []).map((c) => (
          <button
            key={c.id}
            className={`freelance-client-item ${selectedId === c.id ? "active" : ""}`}
            onClick={() => setSelectedId(c.id)}
          >
            <span>{c.name}</span>
            {c.activeProjects > 0 && (
              <span className="freelance-client-badge">{c.activeProjects}</span>
            )}
          </button>
        ))}
        <div className="freelance-new-client">
          <Input
            placeholder="Nombre del cliente"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />
          <Input
            placeholder="Contacto (opcional)"
            value={newClientContact}
            onChange={(e) => setNewClientContact(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addClient()}
          />
          <Button onClick={addClient}>
            <Plus size={14} /> Agregar cliente
          </Button>
        </div>
      </aside>

      <section className="freelance-project-list">
        {!selectedClient && <p className="ds-empty">Elegí un cliente para ver sus proyectos.</p>}
        {selectedClient && (
          <>
            <h1>{selectedClient.name}</h1>
            {selectedClient.contact && <p className="freelance-client-contact">{selectedClient.contact}</p>}

            <Panel className="ds-composer freelance-project-form">
              <Input
                placeholder="Nombre del proyecto (ej. Mantenimiento web)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <div className="ds-toggle">
                <button
                  className={rateType === "hourly" ? "active" : ""}
                  onClick={() => setRateType("hourly")}
                  type="button"
                >
                  Por hora
                </button>
                <button
                  className={rateType === "fixed" ? "active" : ""}
                  onClick={() => setRateType("fixed")}
                  type="button"
                >
                  Fijo mensual
                </button>
              </div>
              <Input
                type="number"
                placeholder={rateType === "hourly" ? "Tarifa por hora" : "Monto fijo"}
                value={rateAmount}
                onChange={(e) => setRateAmount(e.target.value)}
              />
              <Button onClick={addProject}>Crear proyecto</Button>
            </Panel>

            <div className="freelance-projects">
              {(projects ?? []).map((p) => (
                <Panel
                  key={p.id}
                  className="freelance-project-card"
                  onClick={() => navigate(`/freelance/proyectos/${p.id}`)}
                >
                  <Briefcase size={16} />
                  <div className="freelance-project-info">
                    <strong>{p.name}</strong>
                    <span>
                      {p.rateType === "hourly"
                        ? `${p.rateAmount.toLocaleString("es-AR")}/hora`
                        : `${p.rateAmount.toLocaleString("es-AR")} fijo`}
                    </span>
                  </div>
                  <span className={`freelance-project-status ${p.status}`}>{p.status}</span>
                </Panel>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
