use super::{AutoStart, WindowInfo};
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};
use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};
use windows::Win32::System::ProcessStatus::GetProcessImageFileNameA;
use windows::Win32::Foundation::BOOL;
use std::path::PathBuf;
use winreg::enums::*;
use winreg::RegKey;

pub struct Windows;
pub struct WindowsMonitor;

impl WindowsMonitor {
    pub fn new() -> Self {
        WindowsMonitor
    }
}

impl WindowInfo for WindowsMonitor {
    fn get_active_window(&self) -> Option<String> {
        unsafe {
            let hwnd = GetForegroundWindow();
            let mut process_id: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut process_id));
            
            let process_handle = OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                BOOL(0),
                process_id
            ).ok()?;

            if !process_handle.is_invalid() {
                let mut buffer = [0u8; 260];
                let result = GetProcessImageFileNameA(process_handle, &mut buffer);
                if result != 0 {
                    let path = String::from_utf8_lossy(&buffer)
                        .trim_matches(char::from(0))
                        .to_string();
                    return path.split('\\').last().map(String::from);
                }
            }
            None
        }
    }
}

fn get_app_info() -> Result<(String, PathBuf), String> {
    let context: tauri::Context<tauri::Wry> = tauri::generate_context!();
    let app_name = context.package_info().name.clone();
    let app_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))?;
    
    Ok((app_name, app_path))
}

impl AutoStart for Windows {
    fn set_auto_start(&self, enable: bool) -> Result<(), String> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let path = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
        let (app_name, app_path) = get_app_info()?;
        
        let run_key = hkcu.open_subkey_with_flags(path, KEY_WRITE)
            .map_err(|e| format!("Failed to open registry key: {}", e))?;

        if enable {
            run_key.set_value(&app_name, &app_path.to_string_lossy().as_ref())
                .map_err(|e| format!("Failed to set registry value: {}", e))?;
        } else {
            run_key.delete_value(&app_name)
                .map_err(|e| format!("Failed to delete registry value: {}", e))?;
        }
        
        Ok(())
    }

    fn is_auto_start_enabled(&self) -> Result<bool, String> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let path = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
        let (app_name, _) = get_app_info()?;
        
        let run_key = hkcu.open_subkey(path)
            .map_err(|e| format!("Failed to open registry key: {}", e))?;
            
        match run_key.get_value::<String, &str>(&app_name) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false)
        }
    }
}