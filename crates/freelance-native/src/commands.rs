use db_core::Db;
use rusqlite::params;
use tauri::State;

use crate::models::{
    FreelanceClient, FreelanceInvoice, FreelanceProject, FreelanceTimeEntry, UnbilledSummary,
};

fn workspace_id(conn: &rusqlite::Connection) -> rusqlite::Result<String> {
    conn.query_row("SELECT id FROM workspace LIMIT 1", [], |r| r.get(0))
}

fn row_to_client(row: &rusqlite::Row) -> rusqlite::Result<FreelanceClient> {
    Ok(FreelanceClient {
        id: row.get("id")?,
        workspace_id: row.get("workspace_id")?,
        name: row.get("name")?,
        contact: row.get("contact")?,
        notes: row.get("notes")?,
        active_projects: row.get("active_projects").unwrap_or(0),
        created_at: row.get("created_at")?,
    })
}

fn row_to_project(row: &rusqlite::Row) -> rusqlite::Result<FreelanceProject> {
    Ok(FreelanceProject {
        id: row.get("id")?,
        client_id: row.get("client_id")?,
        name: row.get("name")?,
        rate_type: row.get("rate_type")?,
        rate_amount: row.get("rate_amount")?,
        status: row.get("status")?,
        created_at: row.get("created_at")?,
    })
}

pub(crate) fn row_to_time_entry(row: &rusqlite::Row) -> rusqlite::Result<FreelanceTimeEntry> {
    Ok(FreelanceTimeEntry {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        entry_date: row.get("entry_date")?,
        hours: row.get("hours")?,
        description: row.get("description")?,
        invoice_id: row.get("invoice_id")?,
        created_at: row.get("created_at")?,
    })
}

fn row_to_invoice(row: &rusqlite::Row) -> rusqlite::Result<FreelanceInvoice> {
    Ok(FreelanceInvoice {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        amount: row.get("amount")?,
        status: row.get("status")?,
        issued_at: row.get("issued_at")?,
        paid_at: row.get("paid_at")?,
        transaction_id: row.get("transaction_id")?,
        created_at: row.get("created_at")?,
    })
}

#[tauri::command]
pub fn list_clients(state: State<'_, Db>) -> Result<Vec<FreelanceClient>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT c.*,
                (SELECT COUNT(*) FROM freelance_projects WHERE client_id = c.id AND status = 'active')
                    AS active_projects
             FROM freelance_clients c
             ORDER BY name ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_client)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_client(
    state: State<'_, Db>,
    name: String,
    contact: Option<String>,
    notes: Option<String>,
) -> Result<FreelanceClient, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let ws = workspace_id(&conn).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO freelance_clients (workspace_id, name, contact, notes) VALUES (?1, ?2, ?3, ?4)",
        params![ws, name, contact, notes],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM freelance_clients WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT *, 0 AS active_projects FROM freelance_clients WHERE id = ?1",
        [id],
        row_to_client,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_client(state: State<'_, Db>, id: String) -> Result<FreelanceClient, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT c.*,
            (SELECT COUNT(*) FROM freelance_projects WHERE client_id = c.id AND status = 'active')
                AS active_projects
         FROM freelance_clients c WHERE c.id = ?1",
        [id],
        row_to_client,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project(state: State<'_, Db>, id: String) -> Result<FreelanceProject, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM freelance_projects WHERE id = ?1",
        [id],
        row_to_project,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_projects(state: State<'_, Db>, client_id: String) -> Result<Vec<FreelanceProject>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM freelance_projects WHERE client_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([client_id], row_to_project)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(
    state: State<'_, Db>,
    client_id: String,
    name: String,
    rate_type: String,
    rate_amount: f64,
) -> Result<FreelanceProject, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO freelance_projects (client_id, name, rate_type, rate_amount) VALUES (?1, ?2, ?3, ?4)",
        params![client_id, name, rate_type, rate_amount],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM freelance_projects WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM freelance_projects WHERE id = ?1",
        [id],
        row_to_project,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project_status(
    state: State<'_, Db>,
    id: String,
    status: String,
) -> Result<FreelanceProject, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE freelance_projects SET status = ?1 WHERE id = ?2",
        params![status, id],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM freelance_projects WHERE id = ?1",
        [id],
        row_to_project,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_time_entries(
    state: State<'_, Db>,
    project_id: String,
) -> Result<Vec<FreelanceTimeEntry>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM freelance_time_entries WHERE project_id = ?1 ORDER BY entry_date DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([project_id], row_to_time_entry)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_time_entry(
    state: State<'_, Db>,
    project_id: String,
    entry_date: String,
    hours: f64,
    description: Option<String>,
) -> Result<FreelanceTimeEntry, String> {
    crate::api::create_time_entry_raw(&state, &project_id, &entry_date, hours, description.as_deref())
}

#[tauri::command]
pub fn delete_time_entry(state: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM freelance_time_entries WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn unbilled_summary(state: State<'_, Db>, project_id: String) -> Result<UnbilledSummary, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let (rate_type, rate_amount): (String, f64) = conn
        .query_row(
            "SELECT rate_type, rate_amount FROM freelance_projects WHERE id = ?1",
            [&project_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .map_err(|e| e.to_string())?;
    let hours: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(hours), 0) FROM freelance_time_entries
             WHERE project_id = ?1 AND invoice_id IS NULL",
            [&project_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    let suggested_amount = if rate_type == "hourly" {
        hours * rate_amount
    } else {
        rate_amount
    };
    Ok(UnbilledSummary {
        hours,
        suggested_amount,
    })
}

#[tauri::command]
pub fn list_invoices(state: State<'_, Db>, project_id: String) -> Result<Vec<FreelanceInvoice>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM freelance_invoices WHERE project_id = ?1 ORDER BY issued_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([project_id], row_to_invoice)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_invoice(
    state: State<'_, Db>,
    project_id: String,
    amount: f64,
) -> Result<FreelanceInvoice, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO freelance_invoices (project_id, amount) VALUES (?1, ?2)",
        params![project_id, amount],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM freelance_invoices WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE freelance_time_entries SET invoice_id = ?1
         WHERE project_id = ?2 AND invoice_id IS NULL",
        params![id, project_id],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM freelance_invoices WHERE id = ?1",
        [id],
        row_to_invoice,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_invoice_paid(
    state: State<'_, Db>,
    id: String,
    transaction_id: String,
    paid_at: String,
) -> Result<FreelanceInvoice, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE freelance_invoices SET status = 'paid', paid_at = ?1, transaction_id = ?2 WHERE id = ?3",
        params![paid_at, transaction_id, id],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM freelance_invoices WHERE id = ?1",
        [id],
        row_to_invoice,
    )
    .map_err(|e| e.to_string())
}
