use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinAccount {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: String,
    pub currency: String,
    pub opening_balance: f64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountBalance {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: String,
    pub currency: String,
    pub balance: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinCategory {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub kind: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinTransaction {
    pub id: String,
    pub account_id: String,
    #[serde(rename = "type")]
    pub transaction_type: String,
    pub amount: f64,
    pub category_id: Option<String>,
    pub counterparty_id: Option<String>,
    pub occurred_at: String,
    pub note: Option<String>,
    pub source_module: String,
    pub source_ref: Option<Value>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinDebtor {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub contact: Option<Value>,
    pub notes: Option<String>,
    pub total_owed: f64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinDebt {
    pub id: String,
    pub debtor_id: String,
    pub principal_amount: f64,
    pub balance_remaining: f64,
    pub due_date: Option<String>,
    pub status: String,
    pub calendar_event_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinRecurringCharge {
    pub id: String,
    pub workspace_id: String,
    pub account_id: String,
    pub category_id: Option<String>,
    pub name: String,
    #[serde(rename = "type")]
    pub charge_type: String,
    pub amount: f64,
    pub frequency: String,
    pub billing_day: i32,
    pub next_occurrence: String,
    pub active: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinDebtPayment {
    pub id: String,
    pub debt_id: String,
    pub transaction_id: String,
    pub amount: f64,
    pub paid_at: String,
}
