export type RateType = "hourly" | "fixed";
export type ProjectStatus = "active" | "paused" | "done";
export type InvoiceStatus = "draft" | "sent" | "paid";

export interface FreelanceClient {
  id: string;
  workspaceId: string;
  name: string;
  contact: string | null;
  notes: string | null;
  activeProjects: number;
  createdAt: string;
}

export interface FreelanceProject {
  id: string;
  clientId: string;
  name: string;
  rateType: RateType;
  rateAmount: number;
  status: ProjectStatus;
  createdAt: string;
}

export interface FreelanceTimeEntry {
  id: string;
  projectId: string;
  entryDate: string;
  hours: number;
  description: string | null;
  invoiceId: string | null;
  createdAt: string;
}

export interface FreelanceInvoice {
  id: string;
  projectId: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
  transactionId: string | null;
  createdAt: string;
}

export interface UnbilledSummary {
  hours: number;
  suggestedAmount: number;
}
