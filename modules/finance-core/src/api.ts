import { invoke } from "@tauri-apps/api/core";
import type {
  AccountBalance,
  AccountType,
  CategoryKind,
  FinAccount,
  FinCategory,
  FinDebt,
  FinDebtor,
  FinRecurringCharge,
  FinTransaction,
  TransactionType,
} from "./types";

export const financeApi = {
  listAccounts: () => invoke<FinAccount[]>("list_accounts"),
  listAccountBalances: () => invoke<AccountBalance[]>("list_account_balances"),
  createAccount: (name: string, accountType: AccountType, currency?: string, openingBalance?: number) =>
    invoke<FinAccount>("create_account", { name, accountType, currency, openingBalance }),

  listCategories: () => invoke<FinCategory[]>("list_fin_categories"),
  createCategory: (name: string, kind: CategoryKind, color: string) =>
    invoke<FinCategory>("create_fin_category", { name, kind, color }),

  listTransactions: (accountId?: string | null) =>
    invoke<FinTransaction[]>("list_transactions", { accountId: accountId ?? null }),
  createTransaction: (input: {
    accountId: string;
    transactionType: TransactionType;
    amount: number;
    categoryId?: string | null;
    note?: string | null;
    occurredAt: string;
  }) => invoke<FinTransaction>("create_transaction", input),

  listDebtors: () => invoke<FinDebtor[]>("list_debtors"),
  createDebtor: (name: string, notes?: string | null) =>
    invoke<FinDebtor>("create_debtor", { name, notes: notes ?? null }),

  listDebts: (debtorId?: string | null) => invoke<FinDebt[]>("list_debts", { debtorId: debtorId ?? null }),
  createDebt: (debtorId: string, principalAmount: number, dueDate?: string | null) =>
    invoke<FinDebt>("create_debt", { debtorId, principalAmount, dueDate: dueDate ?? null }),
  recordDebtPayment: (debtId: string, accountId: string, amount: number, paidAt: string) =>
    invoke<FinDebt>("record_debt_payment", { debtId, accountId, amount, paidAt }),

  listRecurringCharges: () => invoke<FinRecurringCharge[]>("list_recurring_charges"),
  createRecurringCharge: (input: {
    accountId: string;
    name: string;
    chargeType: CategoryKind;
    amount: number;
    billingDay: number;
  }) => invoke<FinRecurringCharge>("create_recurring_charge", input),
  deactivateRecurringCharge: (id: string) => invoke<void>("deactivate_recurring_charge", { id }),
};
