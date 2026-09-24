pub mod api;
pub mod commands;
pub mod models;

use db_core::{Migration, ModuleMigrations};

static MIGRATIONS: &[Migration] = &[Migration {
    version: 1,
    name: "init",
    sql: include_str!("../migrations/0001_init.sql"),
}];

pub fn module() -> ModuleMigrations {
    ModuleMigrations {
        module_id: "freelance",
        migrations: MIGRATIONS,
    }
}
