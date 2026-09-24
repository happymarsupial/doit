-- "Gastos e ingresos fijos": recurring monthly charges. Covers fixed costs
-- (rent, hosting, software subscriptions) and recurring income (a
-- freelancer's monthly maintenance fee for a client's site/host).
CREATE TABLE fin_recurring_charges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES fin_accounts(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES fin_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount REAL NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly')),
  next_occurrence TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fin_recurring_account ON fin_recurring_charges(account_id);
