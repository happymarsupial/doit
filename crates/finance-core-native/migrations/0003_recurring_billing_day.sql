-- Recurring charges are billed by day-of-month (e.g. "the 31st of every
-- month"), not by picking a one-off calendar date. billing_day is the
-- source of truth; next_occurrence stays as the cached/advanced due date
-- so the "what's due" query can still use a plain index-friendly compare.
ALTER TABLE fin_recurring_charges ADD COLUMN billing_day INTEGER NOT NULL DEFAULT 1;
UPDATE fin_recurring_charges SET billing_day = CAST(substr(next_occurrence, 9, 2) AS INTEGER);
