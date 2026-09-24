use db_core::Db;
use serde::Deserialize;
use serde_json::json;
use tiny_http::{Header, Method, Response, Server};

/// Local-only HTTP API so external tools that aren't a Tauri webview (the
/// VS Code extension, running as its own Node process) can still read/write
/// doit's data — but only while doit itself is open, and only through the
/// same Rust process that already owns the SQLite connection. Bound to
/// 127.0.0.1 only: never reachable from the network.
pub const PORT: u16 = 47821;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct NewTimeEntry {
    project_id: String,
    entry_date: String,
    hours: f64,
    description: Option<String>,
}

pub fn start(db: Db) {
    std::thread::spawn(move || {
        let server = match Server::http(("127.0.0.1", PORT)) {
            Ok(s) => s,
            Err(_) => return, // Port already taken by another doit instance; that one serves fine.
        };
        for mut request in server.incoming_requests() {
            let method = request.method().clone();
            let url = request.url().to_string();
            let response = handle(&db, &method, &url, &mut request);
            let _ = request.respond(response);
        }
    });
}

fn json_response(status: u16, body: serde_json::Value) -> Response<std::io::Cursor<Vec<u8>>> {
    let bytes = body.to_string().into_bytes();
    Response::from_data(bytes)
        .with_status_code(status)
        .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
}

fn handle(
    db: &Db,
    method: &Method,
    url: &str,
    request: &mut tiny_http::Request,
) -> Response<std::io::Cursor<Vec<u8>>> {
    match (method, url) {
        (Method::Get, "/api/health") => json_response(200, json!({ "ok": true })),
        (Method::Get, "/api/projects") => match freelance_native::api::list_active_projects_with_client(db)
        {
            Ok(projects) => json_response(200, json!(projects)),
            Err(e) => json_response(500, json!({ "error": e })),
        },
        (Method::Post, "/api/time-entries") => {
            let mut body = String::new();
            if request.as_reader().read_to_string(&mut body).is_err() {
                return json_response(400, json!({ "error": "invalid body" }));
            }
            let payload: NewTimeEntry = match serde_json::from_str(&body) {
                Ok(p) => p,
                Err(e) => return json_response(400, json!({ "error": e.to_string() })),
            };
            match freelance_native::api::create_time_entry_raw(
                db,
                &payload.project_id,
                &payload.entry_date,
                payload.hours,
                payload.description.as_deref(),
            ) {
                Ok(entry) => json_response(200, json!(entry)),
                Err(e) => json_response(500, json!({ "error": e })),
            }
        }
        _ => json_response(404, json!({ "error": "not found" })),
    }
}
