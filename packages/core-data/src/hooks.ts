import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarApi, pagesApi, settingsApi, themesApi } from "./api";
import type { BlockContent, BlockType, Page } from "./types";

export function useThemes() {
  return useQuery({ queryKey: ["themes"], queryFn: themesApi.list });
}

export function useActiveThemeId() {
  return useQuery({
    queryKey: ["settings", "activeThemeId"],
    queryFn: () => settingsApi.get<string>("activeThemeId"),
  });
}

export function useSetActiveThemeId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsApi.set("activeThemeId", id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "activeThemeId"] }),
  });
}

export function useCreateTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, isDark, tokens }: { name: string; isDark: boolean; tokens: unknown }) =>
      themesApi.create(name, isDark, tokens),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["themes"] }),
  });
}

export function usePages() {
  return useQuery({ queryKey: ["pages"], queryFn: pagesApi.list });
}

export function useCreatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, parentPageId }: { title: string; parentPageId?: string | null }) =>
      pagesApi.create(title, parentPageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Page> }) =>
      pagesApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pagesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useBlocks(pageId: string | null) {
  return useQuery({
    queryKey: ["blocks", pageId],
    queryFn: () => pagesApi.listBlocks(pageId as string),
    enabled: !!pageId,
  });
}

export function useCreateBlock(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      blockType,
      content,
      afterBlockId,
    }: {
      blockType: BlockType;
      content: BlockContent;
      afterBlockId?: string | null;
    }) => pagesApi.createBlock(pageId, blockType, content, afterBlockId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocks", pageId] }),
  });
}

export function useUpdateBlock(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { blockType?: BlockType; content?: BlockContent; sortOrder?: number };
    }) => pagesApi.updateBlock(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocks", pageId] }),
  });
}

export function useDeleteBlock(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pagesApi.deleteBlock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocks", pageId] }),
  });
}

export function useCalendars() {
  return useQuery({ queryKey: ["calendars"], queryFn: calendarApi.listCalendars });
}

export function useCreateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      calendarApi.createCalendar(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendars"] }),
  });
}

export function useEvents(rangeStart: string, rangeEnd: string) {
  return useQuery({
    queryKey: ["events", rangeStart, rangeEnd],
    queryFn: () => calendarApi.listEvents(rangeStart, rangeEnd),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

type EventPatch = Parameters<typeof calendarApi.updateEvent>[1];

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EventPatch }) =>
      calendarApi.updateEvent(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarApi.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}
