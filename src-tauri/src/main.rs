#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager};
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};
use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};
use windows::Win32::System::ProcessStatus::GetProcessImageFileNameA;
use windows::Win32::Foundation::BOOL;

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

fn get_active_window_process() -> Option<String> {
    unsafe {
        let hwnd = GetForegroundWindow();
        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));
        
        let process_handle = match OpenProcess(
            PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
            BOOL(0),
            process_id
        ) {
            Ok(handle) => handle,
            Err(_) => return None,
        };

        if !process_handle.is_invalid() {
            let mut buffer = [0u8; 260];
            let result = GetProcessImageFileNameA(process_handle, &mut buffer);
            if result != 0 {
                let path = String::from_utf8_lossy(&buffer)
                    .trim_matches(char::from(0))
                    .to_string();
                let name = path.split('\\').last()?.to_string();
                return Some(name);
            }
        }
        None
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
  loop {
      if let Some(process_name) = get_active_window_process() {
          let current_time = SystemTime::now()
              .duration_since(UNIX_EPOCH)
              .unwrap()
              .as_secs();

          let state = handle.state::<AppState>();
          // 创建一个新的作用域来确保锁被及时释放
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

              // 在发送之前克隆数据
              let data_clone = data.clone();
              // 在这里释放锁
              drop(data);
              // 发送克隆的数据
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