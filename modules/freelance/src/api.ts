import { invoke } from "@tauri-apps/api/core";
import type {
  FreelanceClient,
  FreelanceInvoice,
  FreelanceProject,
  FreelanceTimeEntry,
  ProjectStatus,
  RateType,
  UnbilledSummary,
} from "./types";

export const freelanceApi = {
  listClients: () => invoke<FreelanceClient[]>("list_clients"),
  createClient: (name: string, contact?: string | null, notes?: string | null) =>
    invoke<FreelanceClient>("create_client", { name, contact: contact ?? null, notes: notes ?? null }),

  getClient: (id: string) => invoke<FreelanceClient>("get_client", { id }),
  getProject: (id: string) => invoke<FreelanceProject>("get_project", { id }),
  listProjects: (clientId: string) => invoke<FreelanceProject[]>("list_projects", { clientId }),
  createProject: (clientId: string, name: string, rateType: RateType, rateAmount: number) =>
    invoke<FreelanceProject>("create_project", { clientId, name, rateType, rateAmount }),
  updateProjectStatus: (id: string, status: ProjectStatus) =>
    invoke<FreelanceProject>("update_project_status", { id, status }),

  listTimeEntries: (projectId: string) =>
    invoke<FreelanceTimeEntry[]>("list_time_entries", { projectId }),
  createTimeEntry: (projectId: string, entryDate: string, hours: number, description?: string | null) =>
    invoke<FreelanceTimeEntry>("create_time_entry", {
      projectId,
      entryDate,
      hours,
      description: description ?? null,
    }),
  deleteTimeEntry: (id: string) => invoke<void>("delete_time_entry", { id }),

  unbilledSummary: (projectId: string) => invoke<UnbilledSummary>("unbilled_summary", { projectId }),

  listInvoices: (projectId: string) => invoke<FreelanceInvoice[]>("list_invoices", { projectId }),
  createInvoice: (projectId: string, amount: number) =>
    invoke<FreelanceInvoice>("create_invoice", { projectId, amount }),
  markInvoicePaid: (id: string, transactionId: string, paidAt: string) =>
    invoke<FreelanceInvoice>("mark_invoice_paid", { id, transactionId, paidAt }),
};
