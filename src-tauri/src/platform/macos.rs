#[cfg(target_os = "macos")]
mod macos {
    use super::WindowInfo;
    use core_foundation::string::CFString;
    use core_foundation::array::CFArray;
    use core_foundation::dictionary::CFDictionary;
    use core_graphics::window::CGWindowListOption;
    use core_graphics::window::CGWindow;

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