import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "./api";
import type { AccountType } from "./types";

export function useAccountBalances() {
  return useQuery({ queryKey: ["fin", "balances"], queryFn: financeApi.listAccountBalances });
}

export function useAccounts() {
  return useQuery({ queryKey: ["fin", "accounts"], queryFn: financeApi.listAccounts });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, accountType }: { name: string; accountType: AccountType }) =>
      financeApi.createAccount(name, accountType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin", "accounts"] });
      qc.invalidateQueries({ queryKey: ["fin", "balances"] });
    },
  });
}

export function useTransactions(accountId?: string | null) {
  return useQuery({
    queryKey: ["fin", "transactions", accountId ?? "all"],
    queryFn: () => financeApi.listTransactions(accountId),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin", "transactions"] });
      qc.invalidateQueries({ queryKey: ["fin", "balances"] });
    },
  });
}

export function useDebtors() {
  return useQuery({ queryKey: ["fin", "debtors"], queryFn: financeApi.listDebtors });
}

export function useCreateDebtor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, notes }: { name: string; notes?: string | null }) =>
      financeApi.createDebtor(name, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin", "debtors"] }),
  });
}

export function useDebts(debtorId?: string | null) {
  return useQuery({
    queryKey: ["fin", "debts", debtorId ?? "all"],
    queryFn: () => financeApi.listDebts(debtorId),
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      debtorId,
      principalAmount,
      dueDate,
    }: {
      debtorId: string;
      principalAmount: number;
      dueDate?: string | null;
    }) => financeApi.createDebt(debtorId, principalAmount, dueDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin", "debts"] }),
  });
}

export function useRecurringCharges() {
  return useQuery({ queryKey: ["fin", "recurring"], queryFn: financeApi.listRecurringCharges });
}

export function useCreateRecurringCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.createRecurringCharge,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin", "recurring"] }),
  });
}

export function useDeactivateRecurringCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: financeApi.deactivateRecurringCharge,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin", "recurring"] }),
  });
}

export function useRecordDebtPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      debtId,
      accountId,
      amount,
      paidAt,
    }: {
      debtId: string;
      accountId: string;
      amount: number;
      paidAt: string;
    }) => financeApi.recordDebtPayment(debtId, accountId, amount, paidAt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin", "debts"] });
      qc.invalidateQueries({ queryKey: ["fin", "transactions"] });
      qc.invalidateQueries({ queryKey: ["fin", "balances"] });
    },
  });
}
