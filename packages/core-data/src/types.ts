export interface Theme {
  id: string;
  workspaceId: string;
  name: string;
  isDark: boolean;
  isBuiltin: boolean;
  tokenSchemaVersion: number;
  tokens: import("@doit/design-system").ThemeTokens;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  workspaceId: string;
  parentPageId: string | null;
  title: string;
  icon: string | null;
  cover: string | null;
  isArchived: boolean;
  isFavorite: boolean;
  sortOrder: number;
  preview: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BlockType = "paragraph" | "heading" | "todo" | "bulleted_list_item" | "page_link";

export interface BlockContent {
  text?: string;
  checked?: boolean;
  targetPageId?: string;
}

export interface Block {
  id: string;
  pageId: string;
  parentBlockId: string | null;
  type: BlockType;
  content: BlockContent;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Calendar {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  themeId: string | null;
  isDefault: boolean;
  sortOrder: number;
}

export interface CalendarCategory {
  id: string;
  calendarId: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  rrule: string | null;
  colorOverride: string | null;
  linkedPageId: string | null;
  moduleRef: unknown | null;
  createdAt: string;
  updatedAt: string;
}
