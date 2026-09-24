use db_core::Db;
use rusqlite::{params, OptionalExtension};
use serde_json::{json, Value};
use tauri::State;

use crate::models::{
    AccountBalance, FinAccount, FinCategory, FinDebt, FinDebtor, FinRecurringCharge, FinTransaction,
};

fn row_to_account(row: &rusqlite::Row) -> rusqlite::Result<FinAccount> {
    Ok(FinAccount {
        id: row.get("id")?,
        workspace_id: row.get("workspace_id")?,
        name: row.get("name")?,
        account_type: row.get("type")?,
        currency: row.get("currency")?,
        opening_balance: row.get("opening_balance")?,
        created_at: row.get("created_at")?,
    })
}

fn row_to_category(row: &rusqlite::Row) -> rusqlite::Result<FinCategory> {
    Ok(FinCategory {
        id: row.get("id")?,
        workspace_id: row.get("workspace_id")?,
        name: row.get("name")?,
        kind: row.get("kind")?,
        color: row.get("color")?,
    })
}

fn row_to_transaction(row: &rusqlite::Row) -> rusqlite::Result<FinTransaction> {
    let source_ref_json: Option<String> = row.get("source_ref_json")?;
    Ok(FinTransaction {
        id: row.get("id")?,
        account_id: row.get("account_id")?,
        transaction_type: row.get("type")?,
        amount: row.get("amount")?,
        category_id: row.get("category_id")?,
        counterparty_id: row.get("counterparty_id")?,
        occurred_at: row.get("occurred_at")?,
        note: row.get("note")?,
        source_module: row.get("source_module")?,
        source_ref: source_ref_json.and_then(|s| serde_json::from_str(&s).ok()),
        created_at: row.get("created_at")?,
    })
}

fn row_to_debtor(row: &rusqlite::Row) -> rusqlite::Result<FinDebtor> {
    let contact_json: Option<String> = row.get("contact_json")?;
    Ok(FinDebtor {
        id: row.get("id")?,
        workspace_id: row.get("workspace_id")?,
        name: row.get("name")?,
        contact: contact_json.and_then(|s| serde_json::from_str(&s).ok()),
        notes: row.get("notes")?,
        total_owed: row.get("total_owed").unwrap_or(0.0),
        created_at: row.get("created_at")?,
    })
}

fn row_to_debt(row: &rusqlite::Row) -> rusqlite::Result<FinDebt> {
    Ok(FinDebt {
        id: row.get("id")?,
        debtor_id: row.get("debtor_id")?,
        principal_amount: row.get("principal_amount")?,
        balance_remaining: row.get("balance_remaining")?,
        due_date: row.get("due_date")?,
        status: row.get("status")?,
        calendar_event_id: row.get("calendar_event_id")?,
        created_at: row.get("created_at")?,
    })
}

fn workspace_id(conn: &rusqlite::Connection) -> rusqlite::Result<String> {
    conn.query_row("SELECT id FROM workspace LIMIT 1", [], |r| r.get(0))
}

fn row_to_recurring(row: &rusqlite::Row) -> rusqlite::Result<FinRecurringCharge> {
    Ok(FinRecurringCharge {
        id: row.get("id")?,
        workspace_id: row.get("workspace_id")?,
        account_id: row.get("account_id")?,
        category_id: row.get("category_id")?,
        name: row.get("name")?,
        charge_type: row.get("type")?,
        amount: row.get("amount")?,
        frequency: row.get("frequency")?,
        billing_day: row.get("billing_day")?,
        next_occurrence: row.get("next_occurrence")?,
        active: row.get::<_, i64>("active")? != 0,
        created_at: row.get("created_at")?,
    })
}

#[tauri::command]
pub fn list_accounts(state: State<'_, Db>) -> Result<Vec<FinAccount>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM fin_accounts ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_account)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_account_balances(state: State<'_, Db>) -> Result<Vec<AccountBalance>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT a.id, a.name, a.type, a.currency,
                a.opening_balance + COALESCE(SUM(
                    CASE
                        WHEN t.type IN ('income','sale','debt_payment') THEN t.amount
                        WHEN t.type IN ('expense','transfer') THEN -t.amount
                        ELSE 0
                    END
                ), 0) AS balance
             FROM fin_accounts a
             LEFT JOIN fin_transactions t ON t.account_id = a.id
             GROUP BY a.id
             ORDER BY a.created_at ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(AccountBalance {
                id: row.get("id")?,
                name: row.get("name")?,
                account_type: row.get("type")?,
                currency: row.get("currency")?,
                balance: row.get("balance")?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_account(
    state: State<'_, Db>,
    name: String,
    account_type: String,
    currency: Option<String>,
    opening_balance: Option<f64>,
) -> Result<FinAccount, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let ws = workspace_id(&conn).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO fin_accounts (workspace_id, name, type, currency, opening_balance)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            ws,
            name,
            account_type,
            currency.unwrap_or_else(|| "ARS".into()),
            opening_balance.unwrap_or(0.0)
        ],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM fin_accounts WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row("SELECT * FROM fin_accounts WHERE id = ?1", [id], row_to_account)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_fin_categories(state: State<'_, Db>) -> Result<Vec<FinCategory>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM fin_categories ORDER BY name ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_category)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_fin_category(
    state: State<'_, Db>,
    name: String,
    kind: String,
    color: String,
) -> Result<FinCategory, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let ws = workspace_id(&conn).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO fin_categories (workspace_id, name, kind, color) VALUES (?1, ?2, ?3, ?4)",
        params![ws, name, kind, color],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM fin_categories WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM fin_categories WHERE id = ?1",
        [id],
        row_to_category,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_transactions(
    state: State<'_, Db>,
    account_id: Option<String>,
) -> Result<Vec<FinTransaction>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT * FROM fin_transactions
             WHERE account_id = COALESCE(?1, account_id)
             ORDER BY occurred_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![account_id], row_to_transaction)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_transaction(
    state: State<'_, Db>,
    account_id: String,
    transaction_type: String,
    amount: f64,
    category_id: Option<String>,
    note: Option<String>,
    occurred_at: String,
) -> Result<FinTransaction, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO fin_transactions (account_id, type, amount, category_id, note, occurred_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![account_id, transaction_type, amount, category_id, note, occurred_at],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM fin_transactions WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM fin_transactions WHERE id = ?1",
        [id],
        row_to_transaction,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_debtors(state: State<'_, Db>) -> Result<Vec<FinDebtor>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT d.*,
                (SELECT COALESCE(SUM(balance_remaining), 0) FROM fin_debts
                 WHERE debtor_id = d.id AND status != 'paid') AS total_owed
             FROM fin_debtors d
             ORDER BY total_owed DESC, name ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_debtor)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_debtor(
    state: State<'_, Db>,
    name: String,
    notes: Option<String>,
) -> Result<FinDebtor, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let ws = workspace_id(&conn).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO fin_debtors (workspace_id, name, notes) VALUES (?1, ?2, ?3)",
        params![ws, name, notes],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM fin_debtors WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row("SELECT * FROM fin_debtors WHERE id = ?1", [id], row_to_debtor)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_debts(
    state: State<'_, Db>,
    debtor_id: Option<String>,
) -> Result<Vec<FinDebt>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT * FROM fin_debts
             WHERE debtor_id = COALESCE(?1, debtor_id)
             ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![debtor_id], row_to_debt)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

/// Creates a debt and, when it has a due date, an event on the workspace's
/// default calendar so it shows up without any calendar-side code knowing
/// finance-core exists (see `module_ref` on `calendar_events`).
#[tauri::command]
pub fn create_debt(
    state: State<'_, Db>,
    debtor_id: String,
    principal_amount: f64,
    due_date: Option<String>,
) -> Result<FinDebt, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO fin_debts (debtor_id, principal_amount, balance_remaining, due_date)
         VALUES (?1, ?2, ?2, ?3)",
        params![debtor_id, principal_amount, due_date],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM fin_debts WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    if let Some(due_date) = &due_date {
        let default_calendar_id: Option<String> = conn
            .query_row(
                "SELECT id FROM calendars WHERE is_default = 1 LIMIT 1",
                [],
                |r| r.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;
        if let Some(calendar_id) = default_calendar_id {
            let debtor_name: String = conn
                .query_row(
                    "SELECT name FROM fin_debtors WHERE id = ?1",
                    [&debtor_id],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            let module_ref: Value = json!({ "module": "finance-core", "entity": "debt", "id": id });
            conn.execute(
                "INSERT INTO calendar_events
                    (calendar_id, title, start_at, end_at, all_day, module_ref_json)
                 VALUES (?1, ?2, ?3, ?3, 1, ?4)",
                params![
                    calendar_id,
                    format!("Vence: {debtor_name}"),
                    due_date,
                    module_ref.to_string()
                ],
            )
            .map_err(|e| e.to_string())?;
            let event_id: String = conn
                .query_row(
                    "SELECT id FROM calendar_events WHERE rowid = last_insert_rowid()",
                    [],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            conn.execute(
                "UPDATE fin_debts SET calendar_event_id = ?1 WHERE id = ?2",
                params![event_id, id],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    conn.query_row("SELECT * FROM fin_debts WHERE id = ?1", [id], row_to_debt)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn record_debt_payment(
    state: State<'_, Db>,
    debt_id: String,
    account_id: String,
    amount: f64,
    paid_at: String,
) -> Result<FinDebt, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO fin_transactions (account_id, type, amount, note, occurred_at, source_module, source_ref_json)
         VALUES (?1, 'debt_payment', ?2, 'Pago de deuda', ?3, 'finance-core', ?4)",
        params![
            account_id,
            amount,
            paid_at,
            json!({ "debtId": debt_id }).to_string()
        ],
    )
    .map_err(|e| e.to_string())?;
    let transaction_id: String = conn
        .query_row(
            "SELECT id FROM fin_transactions WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO fin_debt_payments (debt_id, transaction_id, amount, paid_at) VALUES (?1, ?2, ?3, ?4)",
        params![debt_id, transaction_id, amount, paid_at],
    )
    .map_err(|e| e.to_string())?;

    let balance_remaining: f64 = conn
        .query_row(
            "SELECT balance_remaining FROM fin_debts WHERE id = ?1",
            [&debt_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let new_balance = (balance_remaining - amount).max(0.0);
    let status = if new_balance <= 0.0 {
        "paid"
    } else {
        "partial"
    };
    conn.execute(
        "UPDATE fin_debts SET balance_remaining = ?1, status = ?2 WHERE id = ?3",
        params![new_balance, status, debt_id],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row("SELECT * FROM fin_debts WHERE id = ?1", [debt_id], row_to_debt)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_recurring_charges(state: State<'_, Db>) -> Result<Vec<FinRecurringCharge>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM fin_recurring_charges WHERE active = 1 ORDER BY next_occurrence ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_recurring)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_recurring_charge(
    state: State<'_, Db>,
    account_id: String,
    name: String,
    charge_type: String,
    amount: f64,
    billing_day: i32,
) -> Result<FinRecurringCharge, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let ws = workspace_id(&conn).map_err(|e| e.to_string())?;
    let billing_day = billing_day.clamp(1, 31) as u32;
    let today: String = conn
        .query_row("SELECT date('now')", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let next_occurrence = crate::billing::first_occurrence(&conn, &today, billing_day)
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO fin_recurring_charges (workspace_id, account_id, name, type, amount, billing_day, next_occurrence)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![ws, account_id, name, charge_type, amount, billing_day, next_occurrence],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM fin_recurring_charges WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM fin_recurring_charges WHERE id = ?1",
        [id],
        row_to_recurring,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn deactivate_recurring_charge(state: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE fin_recurring_charges SET active = 0 WHERE id = ?1",
        [id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
