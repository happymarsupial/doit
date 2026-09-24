use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub is_dark: bool,
    pub is_builtin: bool,
    pub token_schema_version: i64,
    pub tokens: Value,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Page {
    pub id: String,
    pub workspace_id: String,
    pub parent_page_id: Option<String>,
    pub title: String,
    pub icon: Option<String>,
    pub cover: Option<String>,
    pub is_archived: bool,
    pub is_favorite: bool,
    pub sort_order: f64,
    pub preview: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Block {
    pub id: String,
    pub page_id: String,
    pub parent_block_id: Option<String>,
    #[serde(rename = "type")]
    pub block_type: String,
    pub content: Value,
    pub sort_order: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Calendar {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub color: String,
    pub theme_id: Option<String>,
    pub is_default: bool,
    pub sort_order: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarCategory {
    pub id: String,
    pub calendar_id: String,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    pub id: String,
    pub calendar_id: String,
    pub category_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub start_at: String,
    pub end_at: String,
    pub all_day: bool,
    pub rrule: Option<String>,
    pub color_override: Option<String>,
    pub linked_page_id: Option<String>,
    pub module_ref: Option<Value>,
    pub created_at: String,
    pub updated_at: String,
}
