import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { freelanceApi } from "./api";
import type { ProjectStatus, RateType } from "./types";

export function useClients() {
  return useQuery({ queryKey: ["freelance", "clients"], queryFn: freelanceApi.listClients });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, contact, notes }: { name: string; contact?: string; notes?: string }) =>
      freelanceApi.createClient(name, contact, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["freelance", "clients"] }),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["freelance", "project", projectId],
    queryFn: () => freelanceApi.getProject(projectId),
  });
}

export function useClient(clientId: string | null) {
  return useQuery({
    queryKey: ["freelance", "client", clientId],
    queryFn: () => freelanceApi.getClient(clientId as string),
    enabled: !!clientId,
  });
}

export function useProjects(clientId: string | null) {
  return useQuery({
    queryKey: ["freelance", "projects", clientId],
    queryFn: () => freelanceApi.listProjects(clientId as string),
    enabled: !!clientId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      name,
      rateType,
      rateAmount,
    }: {
      clientId: string;
      name: string;
      rateType: RateType;
      rateAmount: number;
    }) => freelanceApi.createProject(clientId, name, rateType, rateAmount),
    onSuccess: (project) =>
      qc.invalidateQueries({ queryKey: ["freelance", "projects", project.clientId] }),
  });
}

export function useUpdateProjectStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) =>
      freelanceApi.updateProjectStatus(id, status),
    onSuccess: (project) =>
      qc.invalidateQueries({ queryKey: ["freelance", "projects", project.clientId] }),
  });
}

export function useTimeEntries(projectId: string) {
  return useQuery({
    queryKey: ["freelance", "timeEntries", projectId],
    queryFn: () => freelanceApi.listTimeEntries(projectId),
  });
}

export function useCreateTimeEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryDate,
      hours,
      description,
    }: {
      entryDate: string;
      hours: number;
      description?: string;
    }) => freelanceApi.createTimeEntry(projectId, entryDate, hours, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["freelance", "timeEntries", projectId] });
      qc.invalidateQueries({ queryKey: ["freelance", "unbilled", projectId] });
    },
  });
}

export function useDeleteTimeEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: freelanceApi.deleteTimeEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["freelance", "timeEntries", projectId] });
      qc.invalidateQueries({ queryKey: ["freelance", "unbilled", projectId] });
    },
  });
}

export function useUnbilledSummary(projectId: string) {
  return useQuery({
    queryKey: ["freelance", "unbilled", projectId],
    queryFn: () => freelanceApi.unbilledSummary(projectId),
  });
}

export function useInvoices(projectId: string) {
  return useQuery({
    queryKey: ["freelance", "invoices", projectId],
    queryFn: () => freelanceApi.listInvoices(projectId),
  });
}

export function useCreateInvoice(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => freelanceApi.createInvoice(projectId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["freelance", "invoices", projectId] });
      qc.invalidateQueries({ queryKey: ["freelance", "timeEntries", projectId] });
      qc.invalidateQueries({ queryKey: ["freelance", "unbilled", projectId] });
    },
  });
}

export function useMarkInvoicePaid(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transactionId, paidAt }: { id: string; transactionId: string; paidAt: string }) =>
      freelanceApi.markInvoicePaid(id, transactionId, paidAt),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["freelance", "invoices", projectId] }),
  });
}
