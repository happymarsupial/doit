CREATE TABLE workspace (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  settings_json TEXT NOT NULL DEFAULT '{}',
  encrypted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE themes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_dark INTEGER NOT NULL DEFAULT 0,
  is_builtin INTEGER NOT NULL DEFAULT 0,
  token_schema_version INTEGER NOT NULL DEFAULT 1,
  tokens_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  parent_page_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  icon TEXT,
  cover TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  sort_order REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE blocks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  parent_block_id TEXT REFERENCES blocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content_json TEXT NOT NULL DEFAULT '{}',
  sort_order REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE page_links (
  source_page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  block_id TEXT REFERENCES blocks(id) ON DELETE CASCADE,
  PRIMARY KEY (source_page_id, target_page_id, block_id)
);

CREATE TABLE calendars (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4F6DF5',
  theme_id TEXT REFERENCES themes(id) ON DELETE SET NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  sort_order REAL NOT NULL DEFAULT 0
);

CREATE TABLE calendar_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4F6DF5'
);

CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES calendar_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  all_day INTEGER NOT NULL DEFAULT 0,
  rrule TEXT,
  color_override TEXT,
  linked_page_id TEXT REFERENCES pages(id) ON DELETE SET NULL,
  module_ref_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime TEXT,
  size INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'app'
);

CREATE INDEX idx_pages_parent ON pages(parent_page_id);
CREATE INDEX idx_pages_workspace ON pages(workspace_id);
CREATE INDEX idx_blocks_page ON blocks(page_id);
CREATE INDEX idx_categories_calendar ON calendar_categories(calendar_id);
CREATE INDEX idx_events_calendar ON calendar_events(calendar_id);
CREATE INDEX idx_events_range ON calendar_events(start_at, end_at);
