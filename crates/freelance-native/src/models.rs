use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FreelanceClient {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub contact: Option<String>,
    pub notes: Option<String>,
    pub active_projects: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FreelanceProject {
    pub id: String,
    pub client_id: String,
    pub name: String,
    pub rate_type: String,
    pub rate_amount: f64,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FreelanceTimeEntry {
    pub id: String,
    pub project_id: String,
    pub entry_date: String,
    pub hours: f64,
    pub description: Option<String>,
    pub invoice_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FreelanceInvoice {
    pub id: String,
    pub project_id: String,
    pub amount: f64,
    pub status: String,
    pub issued_at: String,
    pub paid_at: Option<String>,
    pub transaction_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnbilledSummary {
    pub hours: f64,
    pub suggested_amount: f64,
}
