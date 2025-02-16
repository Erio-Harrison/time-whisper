mod platform;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppUsage {
    pub name: String,
    pub total_time: u64,
    pub last_active: u64,
}

pub struct AppState {
    usage_data: Mutex<HashMap<String, AppUsage>>,
}

impl AppState {
    fn new() -> Self {
        Self {
            usage_data: Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
async fn get_app_usage(state: tauri::State<'_, AppState>) -> Result<HashMap<String, AppUsage>, String> {
    state.usage_data
        .lock()
        .map(|data: std::sync::MutexGuard<'_, HashMap<String, AppUsage>>| data.clone())
        .map_err(|e| e.to_string())
}

async fn monitor_active_window(handle: tauri::AppHandle) {
    let window_monitor = platform::create_window_monitor();
    
    loop {
        if let Some(process_name) = window_monitor.get_active_window() {
            let current_time = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();

            let state = handle.state::<AppState>();
            {
                let mut data = state.usage_data.lock().unwrap();
                let app_usage = data.entry(process_name.clone())
                    .or_insert(AppUsage {
                        name: process_name,
                        total_time: 0,
                        last_active: current_time,
                    });

                if current_time - app_usage.last_active <= 2 {
                    app_usage.total_time += 1;
                }
                app_usage.last_active = current_time;

                let data_clone = data.clone();
                drop(data);
                let _ = handle.emit("usage_updated", data_clone);
            }
        }
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }
}

fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .with_file(true)
        .with_line_number(true)
        .init();

    tracing::info!("Application starting...");

    let runtime = match tokio::runtime::Runtime::new() {
        Ok(rt) => {
            tracing::info!("Tokio runtime created successfully");
            rt
        }
        Err(e) => {
            tracing::error!("Failed to create Tokio runtime: {}", e);
            std::process::exit(1);
        }
    };

    let app_state = AppState::new();
    tracing::info!("App state initialized successfully");

    let result = tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![get_app_usage])
        .setup(|app| {
            let handle = app.handle().clone();
            // 启动监控任务
            tauri::async_runtime::spawn(async move {
                monitor_active_window(handle).await;
            });
            
            tracing::info!("Tauri setup started");
            #[cfg(debug_assertions)]
            {
                let app_handle = app.handle();
                app_handle.plugin(tauri_plugin_shell::init())?;
                tracing::info!("Debug plugins initialized");
            }
            tracing::info!("Tauri setup completed");
            Ok(())
        })
        .run(tauri::generate_context!());

    match result {
        Ok(_) => tracing::info!("Application exited normally"),
        Err(e) => {
            tracing::error!("Application error: {}", e);
            std::process::exit(1);
        }
    }
}