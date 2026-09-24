use db_core::{Db, DbResult};
use rusqlite::params;
use serde_json::json;

/// Generates any transactions that a recurring charge missed while the app
/// was closed (e.g. a monthly maintenance fee due last week), then advances
/// each charge to its next occurrence. Called once on startup, after
/// migrations — cheap no-op when nothing is due.
pub fn run_due_recurring_charges(db: &Db) -> DbResult<()> {
    let conn = db.lock()?;
    let today: String = conn.query_row("SELECT date('now')", [], |r| r.get(0))?;

    let due_ids: Vec<String> = {
        let mut stmt = conn.prepare(
            "SELECT id FROM fin_recurring_charges WHERE active = 1 AND next_occurrence <= ?1",
        )?;
        let rows = stmt.query_map([&today], |r| r.get::<_, String>(0))?;
        rows.filter_map(|r| r.ok()).collect()
    };

    for charge_id in due_ids {
        // Bounded to avoid ever looping unbounded on bad data (~8 years of monthly charges).
        for _ in 0..100 {
            let (account_id, category_id, name, charge_type, amount, next_occurrence, billing_day): (
                String,
                Option<String>,
                String,
                String,
                f64,
                String,
                u32,
            ) = conn.query_row(
                "SELECT account_id, category_id, name, type, amount, next_occurrence, billing_day
                 FROM fin_recurring_charges WHERE id = ?1",
                [&charge_id],
                |r| {
                    Ok((
                        r.get(0)?,
                        r.get(1)?,
                        r.get(2)?,
                        r.get(3)?,
                        r.get(4)?,
                        r.get(5)?,
                        r.get(6)?,
                    ))
                },
            )?;

            if next_occurrence > today {
                break;
            }

            conn.execute(
                "INSERT INTO fin_transactions
                    (account_id, type, amount, category_id, note, occurred_at, source_module, source_ref_json)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'finance-core', ?7)",
                params![
                    account_id,
                    charge_type,
                    amount,
                    category_id,
                    name,
                    next_occurrence,
                    json!({ "recurringChargeId": charge_id }).to_string()
                ],
            )?;

            let advanced = crate::billing::advance_occurrence(&conn, &next_occurrence, billing_day)?;
            conn.execute(
                "UPDATE fin_recurring_charges SET next_occurrence = ?1 WHERE id = ?2",
                params![advanced, charge_id],
            )?;
        }
    }

    Ok(())
}
