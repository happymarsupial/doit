mod commands;
mod db;
mod local_api;
mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let db = db_core::Db::open(&data_dir.join("doit.db"))?;
            db.migrate(&[
                db::core_module(),
                finance_core_native::module(),
                freelance_native::module(),
            ])?;
            db::ensure_seed(&db)?;
            finance_core_native::run_due_recurring_charges(&db)?;
            local_api::start(db.clone());
            app.manage(db);

            let window = app.get_webview_window("main").expect("main window must exist");
            #[cfg(target_os = "windows")]
            {
                if window_vibrancy::apply_mica(&window, None).is_err() {
                    let _ = window_vibrancy::apply_acrylic(&window, Some((18, 18, 20, 125)));
                }
            }
            #[cfg(target_os = "macos")]
            {
                let _ = window_vibrancy::apply_vibrancy(
                    &window,
                    window_vibrancy::NSVisualEffectMaterial::UnderWindowBackground,
                    None,
                    None,
                );
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::themes::list_themes,
            commands::themes::create_theme,
            commands::themes::update_theme,
            commands::themes::delete_theme,
            commands::themes::get_setting,
            commands::themes::set_setting,
            commands::pages::list_pages,
            commands::pages::create_page,
            commands::pages::update_page,
            commands::pages::delete_page,
            commands::pages::list_blocks,
            commands::pages::create_block,
            commands::pages::update_block,
            commands::pages::delete_block,
            commands::pages::create_page_link,
            commands::pages::list_backlinks,
            commands::calendar::list_calendars,
            commands::calendar::create_calendar,
            commands::calendar::update_calendar,
            commands::calendar::delete_calendar,
            commands::calendar::list_categories,
            commands::calendar::create_category,
            commands::calendar::list_events,
            commands::calendar::create_event,
            commands::calendar::update_event,
            commands::calendar::delete_event,
            finance_core_native::commands::list_accounts,
            finance_core_native::commands::list_account_balances,
            finance_core_native::commands::create_account,
            finance_core_native::commands::list_fin_categories,
            finance_core_native::commands::create_fin_category,
            finance_core_native::commands::list_transactions,
            finance_core_native::commands::create_transaction,
            finance_core_native::commands::list_debtors,
            finance_core_native::commands::create_debtor,
            finance_core_native::commands::list_debts,
            finance_core_native::commands::create_debt,
            finance_core_native::commands::record_debt_payment,
            finance_core_native::commands::list_recurring_charges,
            finance_core_native::commands::create_recurring_charge,
            finance_core_native::commands::deactivate_recurring_charge,
            freelance_native::commands::list_clients,
            freelance_native::commands::create_client,
            freelance_native::commands::get_client,
            freelance_native::commands::get_project,
            freelance_native::commands::list_projects,
            freelance_native::commands::create_project,
            freelance_native::commands::update_project_status,
            freelance_native::commands::list_time_entries,
            freelance_native::commands::create_time_entry,
            freelance_native::commands::delete_time_entry,
            freelance_native::commands::unbilled_summary,
            freelance_native::commands::list_invoices,
            freelance_native::commands::create_invoice,
            freelance_native::commands::mark_invoice_paid,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
