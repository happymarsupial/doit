use rusqlite::Connection;

/// Day-of-month billing helpers. SQLite's own `date(x, '+1 month')` does
/// NOT clamp — `date('2026-01-31', '+1 month')` overflows to March 3rd
/// instead of landing on February's last day, which would silently shift
/// a charge off its billing day forever. These helpers always re-derive
/// the occurrence from `billing_day` and the target month, clamped to
/// that month's real last day (e.g. billing_day 31 in February -> 28/29).
fn last_day_of_month(conn: &Connection, month_first: &str) -> rusqlite::Result<u32> {
    let last: String = conn.query_row(
        "SELECT date(?1, '+1 month', '-1 day')",
        [month_first],
        |r| r.get(0),
    )?;
    Ok(last[8..10].parse().unwrap_or(28))
}

/// `month_first` must be a "YYYY-MM-01" date string.
pub fn occurrence_for_month(
    conn: &Connection,
    month_first: &str,
    billing_day: u32,
) -> rusqlite::Result<String> {
    let last = last_day_of_month(conn, month_first)?;
    let day = billing_day.min(last);
    Ok(format!("{}{:02}", &month_first[0..8], day))
}

pub fn month_first_of(date: &str) -> String {
    format!("{}-01", &date[0..7])
}

pub fn next_month_first(conn: &Connection, month_first: &str) -> rusqlite::Result<String> {
    conn.query_row("SELECT date(?1, '+1 month')", [month_first], |r| r.get(0))
}

/// The first occurrence for a charge created today: this month's billing
/// day if it hasn't passed yet, otherwise next month's.
pub fn first_occurrence(
    conn: &Connection,
    today: &str,
    billing_day: u32,
) -> rusqlite::Result<String> {
    let this_month = month_first_of(today);
    let candidate = occurrence_for_month(conn, &this_month, billing_day)?;
    if candidate.as_str() >= today {
        Ok(candidate)
    } else {
        let next_month = next_month_first(conn, &this_month)?;
        occurrence_for_month(conn, &next_month, billing_day)
    }
}

pub fn advance_occurrence(
    conn: &Connection,
    current_occurrence: &str,
    billing_day: u32,
) -> rusqlite::Result<String> {
    let current_month = month_first_of(current_occurrence);
    let next_month = next_month_first(conn, &current_month)?;
    occurrence_for_month(conn, &next_month, billing_day)
}
