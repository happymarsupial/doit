use db_core::{Db, DbResult, Migration, ModuleMigrations};
use rusqlite::params;

const LIGHT_TOKENS: &str = r##"{
  "color": {
    "bg": "rgba(244,244,246,0.78)",
    "surface": "rgba(255,255,255,0.72)",
    "border": "rgba(0,0,0,0.08)",
    "text": "#1c1c1e",
    "textMuted": "#6b6b70",
    "accent": "#4f6df5"
  },
  "radius": { "sm": 8, "md": 12, "lg": 16, "xl": 24 },
  "blur": { "panel": 20 }
}"##;

const DARK_TOKENS: &str = r##"{
  "color": {
    "bg": "#1c1c1e",
    "surface": "rgba(44,44,46,0.72)",
    "border": "rgba(255,255,255,0.08)",
    "text": "#f5f5f7",
    "textMuted": "#a1a1a6",
    "accent": "#7c93ff"
  },
  "radius": { "sm": 8, "md": 12, "lg": 16, "xl": 24 },
  "blur": { "panel": 20 }
}"##;

static CORE_MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        name: "init",
        sql: include_str!("../migrations/core/0001_init.sql"),
    },
    Migration {
        version: 2,
        name: "glass_background",
        sql: include_str!("../migrations/core/0002_glass_background.sql"),
    },
];

pub fn core_module() -> ModuleMigrations {
    ModuleMigrations {
        module_id: "core",
        migrations: CORE_MIGRATIONS,
    }
}

/// Creates the default workspace, builtin themes and default calendar the
/// very first time the app runs. No-op on every later launch.
pub fn ensure_seed(db: &Db) -> DbResult<()> {
    let conn = db.lock()?;
    let workspace_id: Option<String> = conn
        .query_row("SELECT id FROM workspace LIMIT 1", [], |r| r.get(0))
        .ok();

    let workspace_id = match workspace_id {
        Some(id) => id,
        None => {
            conn.execute(
                "INSERT INTO workspace (name) VALUES (?1)",
                params!["Mi espacio"],
            )?;
            conn.query_row("SELECT id FROM workspace LIMIT 1", [], |r| r.get(0))?
        }
    };

    let theme_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM themes", [], |r| r.get(0))?;
    if theme_count == 0 {
        conn.execute(
            "INSERT INTO themes (workspace_id, name, is_dark, is_builtin, tokens_json) VALUES (?1, 'Claro', 0, 1, ?2)",
            params![workspace_id, LIGHT_TOKENS],
        )?;
        conn.execute(
            "INSERT INTO themes (workspace_id, name, is_dark, is_builtin, tokens_json) VALUES (?1, 'Oscuro', 1, 1, ?2)",
            params![workspace_id, DARK_TOKENS],
        )?;
    }

    let calendar_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM calendars", [], |r| r.get(0))?;
    if calendar_count == 0 {
        conn.execute(
            "INSERT INTO calendars (workspace_id, name, color, is_default) VALUES (?1, 'Personal', '#4F6DF5', 1)",
            params![workspace_id],
        )?;
    }

    Ok(())
}
