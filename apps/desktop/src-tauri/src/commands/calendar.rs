use rusqlite::params;
use tauri::State;

use crate::models::{Calendar, CalendarCategory, CalendarEvent};
use db_core::Db;

fn row_to_calendar(row: &rusqlite::Row) -> rusqlite::Result<Calendar> {
    Ok(Calendar {
        id: row.get("id")?,
        workspace_id: row.get("workspace_id")?,
        name: row.get("name")?,
        color: row.get("color")?,
        theme_id: row.get("theme_id")?,
        is_default: row.get::<_, i64>("is_default")? != 0,
        sort_order: row.get("sort_order")?,
    })
}

fn row_to_category(row: &rusqlite::Row) -> rusqlite::Result<CalendarCategory> {
    Ok(CalendarCategory {
        id: row.get("id")?,
        calendar_id: row.get("calendar_id")?,
        name: row.get("name")?,
        color: row.get("color")?,
    })
}

fn row_to_event(row: &rusqlite::Row) -> rusqlite::Result<CalendarEvent> {
    let module_ref_json: Option<String> = row.get("module_ref_json")?;
    Ok(CalendarEvent {
        id: row.get("id")?,
        calendar_id: row.get("calendar_id")?,
        category_id: row.get("category_id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        start_at: row.get("start_at")?,
        end_at: row.get("end_at")?,
        all_day: row.get::<_, i64>("all_day")? != 0,
        rrule: row.get("rrule")?,
        color_override: row.get("color_override")?,
        linked_page_id: row.get("linked_page_id")?,
        module_ref: module_ref_json.and_then(|s| serde_json::from_str(&s).ok()),
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

#[tauri::command]
pub fn list_calendars(state: State<'_, Db>) -> Result<Vec<Calendar>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM calendars ORDER BY sort_order ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_calendar)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_calendar(
    state: State<'_, Db>,
    name: String,
    color: String,
) -> Result<Calendar, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let workspace_id: String = conn
        .query_row("SELECT id FROM workspace LIMIT 1", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO calendars (workspace_id, name, color) VALUES (?1, ?2, ?3)",
        params![workspace_id, name, color],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM calendars WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row("SELECT * FROM calendars WHERE id = ?1", [id], row_to_calendar)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_calendar(
    state: State<'_, Db>,
    id: String,
    name: Option<String>,
    color: Option<String>,
) -> Result<Calendar, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    if let Some(name) = name {
        conn.execute("UPDATE calendars SET name = ?1 WHERE id = ?2", params![name, id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(color) = color {
        conn.execute("UPDATE calendars SET color = ?1 WHERE id = ?2", params![color, id])
            .map_err(|e| e.to_string())?;
    }
    conn.query_row("SELECT * FROM calendars WHERE id = ?1", [id], row_to_calendar)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_calendar(state: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM calendars WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_categories(
    state: State<'_, Db>,
    calendar_id: String,
) -> Result<Vec<CalendarCategory>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT * FROM calendar_categories WHERE calendar_id = ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([calendar_id], row_to_category)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_category(
    state: State<'_, Db>,
    calendar_id: String,
    name: String,
    color: String,
) -> Result<CalendarCategory, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO calendar_categories (calendar_id, name, color) VALUES (?1, ?2, ?3)",
        params![calendar_id, name, color],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM calendar_categories WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT * FROM calendar_categories WHERE id = ?1",
        [id],
        row_to_category,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_events(
    state: State<'_, Db>,
    range_start: String,
    range_end: String,
) -> Result<Vec<CalendarEvent>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT * FROM calendar_events
             WHERE start_at < ?2 AND end_at > ?1
             ORDER BY start_at ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![range_start, range_end], row_to_event)
        .map_err(|e| e.to_string())?;
    rows.collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn create_event(
    state: State<'_, Db>,
    calendar_id: String,
    category_id: Option<String>,
    title: String,
    description: Option<String>,
    start_at: String,
    end_at: String,
    all_day: bool,
    color_override: Option<String>,
) -> Result<CalendarEvent, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO calendar_events
            (calendar_id, category_id, title, description, start_at, end_at, all_day, color_override)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            calendar_id,
            category_id,
            title,
            description,
            start_at,
            end_at,
            all_day as i64,
            color_override
        ],
    )
    .map_err(|e| e.to_string())?;
    let id: String = conn
        .query_row(
            "SELECT id FROM calendar_events WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.query_row("SELECT * FROM calendar_events WHERE id = ?1", [id], row_to_event)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn update_event(
    state: State<'_, Db>,
    id: String,
    title: Option<String>,
    description: Option<String>,
    start_at: Option<String>,
    end_at: Option<String>,
    all_day: Option<bool>,
    category_id: Option<String>,
    color_override: Option<String>,
) -> Result<CalendarEvent, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    macro_rules! set_field {
        ($col:literal, $val:expr) => {
            if let Some(v) = $val {
                conn.execute(
                    concat!("UPDATE calendar_events SET ", $col, " = ?1, updated_at = datetime('now') WHERE id = ?2"),
                    params![v, id],
                )
                .map_err(|e| e.to_string())?;
            }
        };
    }
    set_field!("title", title);
    set_field!("description", description);
    set_field!("start_at", start_at);
    set_field!("end_at", end_at);
    set_field!("category_id", category_id);
    set_field!("color_override", color_override);
    if let Some(all_day) = all_day {
        conn.execute(
            "UPDATE calendar_events SET all_day = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![all_day as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }
    conn.query_row("SELECT * FROM calendar_events WHERE id = ?1", [id], row_to_event)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_event(state: State<'_, Db>, id: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM calendar_events WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
