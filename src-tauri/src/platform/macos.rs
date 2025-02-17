#[cfg(target_os = "macos")]
mod macos {
    use super::WindowInfo;
    use core_foundation::string::CFString;
    use core_foundation::array::CFArray;
    use core_foundation::dictionary::CFDictionary;
    use core_graphics::window::CGWindowListOption;
    use core_graphics::window::CGWindow;
    use std::process::Command;

    pub struct MacOS;
    pub struct MacOSMonitor;

    impl MacOSMonitor {
        pub fn new() -> Self {
            MacOSMonitor
        }
    }

    impl WindowInfo for MacOSMonitor {
        fn get_active_window(&self) -> Option<String> {
            let options = CGWindowListOption::OPTION_ON_SCREEN | 
                         CGWindowListOption::OPTION_RELATIVE_TO_FRONT;
            let window_list = CGWindow::window_list_info(options, None)?;
            
            if let Some(window_info) = window_list.get(0) {
                if let Some(app_name) = window_info.get("kCGWindowOwnerName") {
                    return Some(app_name.to_string());
                }
            }
            None
        }
    }
}

impl AutoStart for MacOS {
    fn set_auto_start(&self, enable: bool) -> Result<(), String> {
        let (app_name, app_path) = get_app_info()?;
        let plist_path = format!("~/Library/LaunchAgents/{}.plist", app_name);
        
        if enable {
            let plist_content = format!(
                r#"<?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
                <plist version="1.0">
                <dict>
                    <key>Label</key>
                    <string>{}</string>
                    <key>ProgramArguments</key>
                    <array>
                        <string>{}</string>
                    </array>
                    <key>RunAtLoad</key>
                    <true/>
                </dict>
                </plist>"#,
                app_name,
                app_path.to_string_lossy()
            );
            
            std::fs::write(&plist_path, plist_content)
                .map_err(|e| format!("Failed to write plist file: {}", e))?;
                
            Command::new("launchctl")
                .args(&["load", &plist_path])
                .output()
                .map_err(|e| format!("Failed to load launch agent: {}", e))?;
        } else {
            Command::new("launchctl")
                .args(&["unload", &plist_path])
                .output()
                .map_err(|e| format!("Failed to unload launch agent: {}", e))?;
                
            std::fs::remove_file(&plist_path)
                .map_err(|e| format!("Failed to remove plist file: {}", e))?;
        }
        
        Ok(())
    }

    fn is_auto_start_enabled(&self) -> Result<bool, String> {
        let (app_name, _) = get_app_info()?;
        let plist_path = format!("~/Library/LaunchAgents/{}.plist", app_name);
        Ok(std::path::Path::new(&plist_path).exists())
    }
}