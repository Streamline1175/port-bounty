// Process Surgeon - Cross-platform network resource management utility
// Main library entry point

pub mod commands;
pub mod discovery;
pub mod docker;
pub mod models;
pub mod surgery;

use commands::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    log::info!("Starting Process Surgeon...");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize app state asynchronously
            let handle = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                log::info!("Initializing application state...");
                let state = AppStateManager::new().await;
                handle.manage(state);
                log::info!("Application state initialized");
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_processes,
            find_port,
            kill_process,
            container_action,
            get_containers,
            is_docker_available,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

