use rusqlite::params;
use serde_json::Value;
use tauri::State;

use crate::models::{Block, Page};
use db_core::Db;

fn row_to_page(row: &rusqlite::Row) -> rusqlite::Result<Page> {
    Ok(Page {
        id: row.get("id")?,
        workspace_id: row.get("workspace_id")?,
        parent_page_id: row.get("parent_page_id")?,
        title: row.get("title")?,
        icon: row.get("icon")?,
        cover: row.get("cover")?,
        is_archived: row.get::<_, i64>("is_archived")? != 0,
        is_favorite: row.get::<_, i64>("is_favorite")? != 0,
        sort_order: row.get("sort_order")?,
        preview: row.get("preview").unwrap_or(None),
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn row_to_block(row: &rusqlite::Row) -> rusqlite::Result<Block> {
    let content_json: String = row.get("content_json")?;
    Ok(Block {
        id: row.get("id")?,
        page_id: row.get("page_id")?,
        parent_block_id: row.get("parent_block_id")?,
        block_type: row.get("type")?,
        content: serde_json::from_str(&content_json).unwrap_or(Value::Null),
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

#[tauri::command]
pub fn list_pages(state: State<'_, Db>) -> Result<Vec<Page>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT p.*,
                (SELECT json_extract(b.content_json, '$.text') FROM blocks b
                 WHERE b.page_id = p.id AND json_extract(b.content_json, '$.text') IS NOT NULL
                   AND json_extract(b.content_json, '$.text') != ''
                 ORDER BY b.sort_order ASC LIMIT 1) AS preview
             FROM pages p
             WHERE p.is_archived = 0
             ORDER BY p.sort_order ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], row_to_page).map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_page(
    state: State<'_, Db>,
    parent_page_id: Option<String>,
    title: String,
) -> Result<Page, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let workspace_id: String = conn
        .query_row("SELECT id FROM workspace LIMIT 1", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let max_sort: f64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), 0) FROM pages WHERE parent_page_id IS ?1",
            params![parent_page_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO pages (workspace_id, parent_page_id, title, sort_order) VALUES (?1, ?2, ?3, ?4)",
        params![workspace_id, parent_page_id, title, max_sort + 1000.0],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM pages WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row("SELECT * FROM pages WHERE id = ?1", [id], row_to_page)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_page(
    state: State<'_, Db>,
    id: String,
    title: Option<String>,
    icon: Option<String>,
    is_favorite: Option<bool>,
    is_archived: Option<bool>,
) -> Result<Page, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    if let Some(title) = title {
        conn.execute(
            "UPDATE pages SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![title, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(icon) = icon {
        conn.execute(
            "UPDATE pages SET icon = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![icon, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(fav) = is_favorite {
        conn.execute(
            "UPDATE pages SET is_favorite = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![fav as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(arch) = is_archived {
        conn.execute(
            "UPDATE pages SET is_archived = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![arch as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }
    conn.query_row("SELECT * FROM pages WHERE id = ?1", [id], row_to_page)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_page(state: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM pages WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_blocks(state: State<'_, Db>, page_id: String) -> Result<Vec<Block>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM blocks WHERE page_id = ?1 ORDER BY sort_order ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([page_id], row_to_block)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_block(
    state: State<'_, Db>,
    page_id: String,
    block_type: String,
    content: Value,
    after_block_id: Option<String>,
) -> Result<Block, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let sort_order = match after_block_id {
        Some(after_id) => {
            let after_sort: f64 = conn
                .query_row(
                    "SELECT sort_order FROM blocks WHERE id = ?1",
                    [&after_id],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            let next_sort: Option<f64> = conn
                .query_row(
                    "SELECT MIN(sort_order) FROM blocks WHERE page_id = ?1 AND sort_order > ?2",
                    params![page_id, after_sort],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            match next_sort {
                Some(next) => (after_sort + next) / 2.0,
                None => after_sort + 1000.0,
            }
        }
        None => {
            let max_sort: f64 = conn
                .query_row(
                    "SELECT COALESCE(MAX(sort_order), 0) FROM blocks WHERE page_id = ?1",
                    [&page_id],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;
            max_sort + 1000.0
        }
    };
    conn.execute(
        "INSERT INTO blocks (page_id, type, content_json, sort_order) VALUES (?1, ?2, ?3, ?4)",
        params![page_id, block_type, content.to_string(), sort_order],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM blocks WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row("SELECT * FROM blocks WHERE id = ?1", [id], row_to_block)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_block(
    state: State<'_, Db>,
    id: String,
    block_type: Option<String>,
    content: Option<Value>,
    sort_order: Option<f64>,
) -> Result<Block, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    if let Some(block_type) = block_type {
        conn.execute(
            "UPDATE blocks SET type = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![block_type, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(content) = content {
        conn.execute(
            "UPDATE blocks SET content_json = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![content.to_string(), id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(sort_order) = sort_order {
        conn.execute(
            "UPDATE blocks SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![sort_order, id],
        )
        .map_err(|e| e.to_string())?;
    }
    conn.query_row("SELECT * FROM blocks WHERE id = ?1", [id], row_to_block)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_block(state: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM blocks WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_page_link(
    state: State<'_, Db>,
    source_page_id: String,
    target_page_id: String,
    block_id: Option<String>,
) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO page_links (source_page_id, target_page_id, block_id) VALUES (?1, ?2, ?3)",
        params![source_page_id, target_page_id, block_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_backlinks(state: State<'_, Db>, page_id: String) -> Result<Vec<String>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT DISTINCT source_page_id FROM page_links WHERE target_page_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([page_id], |r| r.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}
