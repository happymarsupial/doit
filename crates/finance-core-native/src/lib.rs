pub mod billing;
pub mod commands;
pub mod models;
pub mod recurring;

use db_core::{Migration, ModuleMigrations};

static MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        name: "init",
        sql: include_str!("../migrations/0001_init.sql"),
    },
    Migration {
        version: 2,
        name: "recurring_charges",
        sql: include_str!("../migrations/0002_recurring_charges.sql"),
    },
    Migration {
        version: 3,
        name: "recurring_billing_day",
        sql: include_str!("../migrations/0003_recurring_billing_day.sql"),
    },
];

pub fn module() -> ModuleMigrations {
    ModuleMigrations {
        module_id: "finance-core",
        migrations: MIGRATIONS,
    }
}

pub use recurring::run_due_recurring_charges;
