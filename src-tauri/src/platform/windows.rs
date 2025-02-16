use super::WindowInfo;
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};
use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};
use windows::Win32::System::ProcessStatus::GetProcessImageFileNameA;
use windows::Win32::Foundation::BOOL;

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