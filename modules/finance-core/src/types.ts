export type AccountType = "cash_register" | "bank" | "wallet";
export type TransactionType = "income" | "expense" | "transfer" | "sale" | "debt_payment";
export type CategoryKind = "income" | "expense";
export type DebtStatus = "pending" | "partial" | "paid";

export interface FinAccount {
  id: string;
  workspaceId: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  createdAt: string;
}

export interface AccountBalance {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
}

export interface FinCategory {
  id: string;
  workspaceId: string;
  name: string;
  kind: CategoryKind;
  color: string;
}

export interface FinTransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  counterpartyId: string | null;
  occurredAt: string;
  note: string | null;
  sourceModule: string;
  sourceRef: unknown | null;
  createdAt: string;
}

export interface FinDebtor {
  id: string;
  workspaceId: string;
  name: string;
  contact: unknown | null;
  notes: string | null;
  totalOwed: number;
  createdAt: string;
}

export interface FinRecurringCharge {
  id: string;
  workspaceId: string;
  accountId: string;
  categoryId: string | null;
  name: string;
  type: CategoryKind;
  amount: number;
  frequency: "monthly";
  billingDay: number;
  nextOccurrence: string;
  active: boolean;
  createdAt: string;
}

export interface FinDebt {
  id: string;
  debtorId: string;
  principalAmount: number;
  balanceRemaining: number;
  dueDate: string | null;
  status: DebtStatus;
  calendarEventId: string | null;
  createdAt: string;
}
