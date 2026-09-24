use std::collections::HashSet;
use std::path::Path;
use std::sync::{Arc, Mutex, MutexGuard};

use rusqlite::Connection;

#[derive(thiserror::Error, Debug)]
pub enum DbError {
    #[error(transparent)]
    Sqlite(#[from] rusqlite::Error),
    #[error("poisoned connection lock")]
    Poisoned,
}

pub type DbResult<T> = Result<T, DbError>;

pub struct Migration {
    pub version: i64,
    pub name: &'static str,
    pub sql: &'static str,
}

pub struct ModuleMigrations {
    pub module_id: &'static str,
    pub migrations: &'static [Migration],
}

/// Local SQLite connection for a single-user desktop workspace.
/// One mutex-guarded connection is enough here: there is no concurrent
/// writer contention to design around (see docs/adr on rusqlite vs sqlx).
#[derive(Clone)]
pub struct Db {
    conn: Arc<Mutex<Connection>>,
}

impl Db {
    pub fn open(path: &Path) -> DbResult<Self> {
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                module_id TEXT NOT NULL,
                version INTEGER NOT NULL,
                name TEXT NOT NULL,
                applied_at TEXT NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY (module_id, version)
            );",
        )?;
        Ok(Self { conn: Arc::new(Mutex::new(conn)) })
    }

    pub fn lock(&self) -> DbResult<MutexGuard<'_, Connection>> {
        self.conn.lock().map_err(|_| DbError::Poisoned)
    }

    /// Applies every not-yet-applied migration for each module, in the
    /// order the caller passes them (core first, then dependent modules).
    pub fn migrate(&self, modules: &[ModuleMigrations]) -> DbResult<()> {
        let conn = self.lock()?;
        for module in modules {
            let applied: HashSet<i64> = {
                let mut stmt = conn
                    .prepare("SELECT version FROM schema_migrations WHERE module_id = ?1")?;
                let rows = stmt.query_map([module.module_id], |r| r.get::<_, i64>(0))?;
                rows.filter_map(|r| r.ok()).collect()
            };
            let mut sorted: Vec<&Migration> = module.migrations.iter().collect();
            sorted.sort_by_key(|m| m.version);
            for m in sorted {
                if applied.contains(&m.version) {
                    continue;
                }
                conn.execute_batch(m.sql)?;
                conn.execute(
                    "INSERT INTO schema_migrations (module_id, version, name) VALUES (?1, ?2, ?3)",
                    rusqlite::params![module.module_id, m.version, m.name],
                )?;
            }
        }
        Ok(())
    }
}
