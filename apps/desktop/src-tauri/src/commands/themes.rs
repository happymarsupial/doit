use rusqlite::{params, OptionalExtension};
use serde_json::Value;
use tauri::State;

use crate::models::Theme;
use db_core::Db;

fn row_to_theme(row: &rusqlite::Row) -> rusqlite::Result<Theme> {
    let tokens_json: String = row.get("tokens_json")?;
    Ok(Theme {
        id: row.get("id")?,
        workspace_id: row.get("workspace_id")?,
        name: row.get("name")?,
        is_dark: row.get::<_, i64>("is_dark")? != 0,
        is_builtin: row.get::<_, i64>("is_builtin")? != 0,
        token_schema_version: row.get("token_schema_version")?,
        tokens: serde_json::from_str(&tokens_json).unwrap_or(Value::Null),
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

#[tauri::command]
pub fn list_themes(state: State<'_, Db>) -> Result<Vec<Theme>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM themes ORDER BY is_builtin DESC, created_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_theme)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_theme(
    state: State<'_, Db>,
    name: String,
    is_dark: bool,
    tokens: Value,
) -> Result<Theme, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let workspace_id: String = conn
        .query_row("SELECT id FROM workspace LIMIT 1", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let tokens_json = tokens.to_string();
    conn.execute(
        "INSERT INTO themes (workspace_id, name, is_dark, is_builtin, tokens_json) VALUES (?1, ?2, ?3, 0, ?4)",
        params![workspace_id, name, is_dark as i64, tokens_json],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM themes WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row("SELECT * FROM themes WHERE id = ?1", [id], row_to_theme)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_theme(
    state: State<'_, Db>,
    id: String,
    name: Option<String>,
    tokens: Option<Value>,
) -> Result<Theme, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    if let Some(name) = name {
        conn.execute(
            "UPDATE themes SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![name, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(tokens) = tokens {
        conn.execute(
            "UPDATE themes SET tokens_json = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![tokens.to_string(), id],
        )
        .map_err(|e| e.to_string())?;
    }
    conn.query_row("SELECT * FROM themes WHERE id = ?1", [id], row_to_theme)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_theme(state: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let is_builtin: i64 = conn
        .query_row("SELECT is_builtin FROM themes WHERE id = ?1", [&id], |r| {
            r.get(0)
        })
        .map_err(|e| e.to_string())?;
    if is_builtin != 0 {
        return Err("No se pueden borrar los temas incluidos por defecto".into());
    }
    conn.execute("DELETE FROM themes WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_setting(state: State<'_, Db>, key: String) -> Result<Option<Value>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let value: Option<String> = conn
        .query_row(
            "SELECT value_json FROM settings WHERE key = ?1",
            [&key],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(value.and_then(|v| serde_json::from_str(&v).ok()))
}

#[tauri::command]
pub fn set_setting(
    state: State<'_, Db>,
    key: String,
    value: Value,
) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value_json) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json",
        params![key, value.to_string()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
