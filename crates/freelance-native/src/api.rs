//! Plain functions over `&Db`, reused by both the Tauri commands (called
//! from the app's own webview) and the local HTTP API (called from the
//! VS Code extension, which is an external process with no Tauri context).
use db_core::Db;
use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::commands::row_to_time_entry;
use crate::models::FreelanceTimeEntry;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub client_name: String,
}

pub fn list_active_projects_with_client(db: &Db) -> Result<Vec<ProjectSummary>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.name, c.name AS client_name
             FROM freelance_projects p
             JOIN freelance_clients c ON c.id = p.client_id
             WHERE p.status = 'active'
             ORDER BY c.name ASC, p.name ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(ProjectSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                client_name: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

pub fn create_time_entry_raw(
    db: &Db,
    project_id: &str,
    entry_date: &str,
    hours: f64,
    description: Option<&str>,
) -> Result<FreelanceTimeEntry, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO freelance_time_entries (project_id, entry_date, hours, description)
         VALUES (?1, ?2, ?3, ?4)",
        params![project_id, entry_date, hours, description],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM freelance_time_entries WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM freelance_time_entries WHERE id = ?1",
        [id],
        row_to_time_entry,
    )
    .map_err(|e| e.to_string())
}
