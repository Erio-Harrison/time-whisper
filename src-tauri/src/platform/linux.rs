#[cfg(target_os = "linux")]
mod linux {
    use super::WindowInfo;
    use x11rb::connection::Connection;
    use x11rb::protocol::xproto::*;
    use std::process::Command;
    use std::path::PathBuf;

    pub struct Linux;
    pub struct LinuxMonitor;

    impl LinuxMonitor {
        pub fn new() -> Self {
            LinuxMonitor
        }
    }

    impl WindowInfo for LinuxMonitor {
        fn get_active_window(&self) -> Option<String> {
            let (conn, screen_num) = x11rb::connect(None).ok()?;
            let screen = &conn.setup().roots[screen_num];
            
            let active_window = conn.get_property(
                false,
                screen.root,
                conn.atom("_NET_ACTIVE_WINDOW")?,
                conn.atom("WINDOW")?,
                0,
                1
            ).ok()?.reply().ok()?;

            if active_window.value.len() >= 4 {
                let window_id = u32::from_ne_bytes(active_window.value[0..4].try_into().ok()?);
                
                let pid = conn.get_property(
                    false,
                    window_id,
                    conn.atom("_NET_WM_PID")?,
                    conn.atom("CARDINAL")?,
                    0,
                    1
                ).ok()?.reply().ok()?;

                if pid.value.len() >= 4 {
                    let pid = u32::from_ne_bytes(pid.value[0..4].try_into().ok()?);
                    
                    let output = Command::new("ps")
                        .arg("-p")
                        .arg(pid.to_string())
                        .arg("-o")
                        .arg("comm=")
                        .output()
                        .ok()?;
                    
                    return String::from_utf8(output.stdout).ok()
                        .map(|s| s.trim().to_string());
                }
            }
            None
        }
    }
}