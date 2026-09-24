CREATE TABLE fin_accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cash_register',
  currency TEXT NOT NULL DEFAULT 'ARS',
  opening_balance REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE fin_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#4F6DF5'
);

CREATE TABLE fin_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  account_id TEXT NOT NULL REFERENCES fin_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'sale', 'debt_payment')),
  amount REAL NOT NULL,
  category_id TEXT REFERENCES fin_categories(id) ON DELETE SET NULL,
  counterparty_id TEXT,
  occurred_at TEXT NOT NULL,
  note TEXT,
  source_module TEXT NOT NULL DEFAULT 'finance-core',
  source_ref_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE fin_debtors (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workspace_id TEXT NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_json TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE fin_debts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  debtor_id TEXT NOT NULL REFERENCES fin_debtors(id) ON DELETE CASCADE,
  principal_amount REAL NOT NULL,
  balance_remaining REAL NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  calendar_event_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE fin_debt_payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  debt_id TEXT NOT NULL REFERENCES fin_debts(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL REFERENCES fin_transactions(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  paid_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fin_transactions_account ON fin_transactions(account_id);
CREATE INDEX idx_fin_debts_debtor ON fin_debts(debtor_id);
CREATE INDEX idx_fin_debt_payments_debt ON fin_debt_payments(debt_id);
