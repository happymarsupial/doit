import { invoke } from "@tauri-apps/api/core";
import type {
  Block,
  BlockContent,
  BlockType,
  Calendar,
  CalendarCategory,
  CalendarEvent,
  Page,
  Theme,
} from "./types";

export const themesApi = {
  list: () => invoke<Theme[]>("list_themes"),
  create: (name: string, isDark: boolean, tokens: unknown) =>
    invoke<Theme>("create_theme", { name, isDark, tokens }),
  update: (id: string, patch: { name?: string; tokens?: unknown }) =>
    invoke<Theme>("update_theme", { id, ...patch }),
  delete: (id: string) => invoke<void>("delete_theme", { id }),
};

export const settingsApi = {
  get: <T,>(key: string) => invoke<T | null>("get_setting", { key }),
  set: (key: string, value: unknown) => invoke<void>("set_setting", { key, value }),
};

export const pagesApi = {
  list: () => invoke<Page[]>("list_pages"),
  create: (title: string, parentPageId?: string | null) =>
    invoke<Page>("create_page", { title, parentPageId: parentPageId ?? null }),
  update: (
    id: string,
    patch: Partial<Pick<Page, "title" | "icon" | "isFavorite" | "isArchived">>,
  ) => invoke<Page>("update_page", { id, ...patch }),
  delete: (id: string) => invoke<void>("delete_page", { id }),
  listBlocks: (pageId: string) => invoke<Block[]>("list_blocks", { pageId }),
  createBlock: (
    pageId: string,
    blockType: BlockType,
    content: BlockContent,
    afterBlockId?: string | null,
  ) =>
    invoke<Block>("create_block", {
      pageId,
      blockType,
      content,
      afterBlockId: afterBlockId ?? null,
    }),
  updateBlock: (
    id: string,
    patch: { blockType?: BlockType; content?: BlockContent; sortOrder?: number },
  ) => invoke<Block>("update_block", { id, ...patch }),
  deleteBlock: (id: string) => invoke<void>("delete_block", { id }),
  createLink: (sourcePageId: string, targetPageId: string, blockId?: string | null) =>
    invoke<void>("create_page_link", { sourcePageId, targetPageId, blockId: blockId ?? null }),
  listBacklinks: (pageId: string) => invoke<string[]>("list_backlinks", { pageId }),
};

export const calendarApi = {
  listCalendars: () => invoke<Calendar[]>("list_calendars"),
  createCalendar: (name: string, color: string) =>
    invoke<Calendar>("create_calendar", { name, color }),
  updateCalendar: (id: string, patch: { name?: string; color?: string }) =>
    invoke<Calendar>("update_calendar", { id, ...patch }),
  deleteCalendar: (id: string) => invoke<void>("delete_calendar", { id }),
  listCategories: (calendarId: string) =>
    invoke<CalendarCategory[]>("list_categories", { calendarId }),
  createCategory: (calendarId: string, name: string, color: string) =>
    invoke<CalendarCategory>("create_category", { calendarId, name, color }),
  listEvents: (rangeStart: string, rangeEnd: string) =>
    invoke<CalendarEvent[]>("list_events", { rangeStart, rangeEnd }),
  createEvent: (input: {
    calendarId: string;
    categoryId?: string | null;
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    allDay: boolean;
    colorOverride?: string | null;
  }) => invoke<CalendarEvent>("create_event", input),
  updateEvent: (
    id: string,
    patch: Partial<{
      title: string;
      description: string | null;
      startAt: string;
      endAt: string;
      allDay: boolean;
      categoryId: string | null;
      colorOverride: string | null;
    }>,
  ) => invoke<CalendarEvent>("update_event", { id, ...patch }),
  deleteEvent: (id: string) => invoke<void>("delete_event", { id }),
};
