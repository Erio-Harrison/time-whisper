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

#[cfg(test)]
#[cfg(target_os = "macos")]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;
    use std::process::Command;
    use std::sync::Arc;
    use std::thread;

    // 1. 测试窗口信息获取
    #[test]
    fn test_get_active_window() {
        let monitor = MacOSMonitor::new();
        // 测试窗口信息获取
        let result = monitor.get_active_window();
        match result {
            Some(window_name) => {
                assert!(!window_name.is_empty());
                // macOS 应用名称通常不包含扩展名
                assert!(!window_name.ends_with(".app"));
            }
            None => {} // 可能没有活动窗口
        }
    }

    #[test]
    fn test_multiple_window_queries() {
        let monitor = MacOSMonitor::new();
        // 连续查询测试
        for _ in 0..5 {
            let result = monitor.get_active_window();
            match result {
                Some(name) => assert!(!name.is_empty()),
                None => continue,
            }
        }
    }

    // 2. 测试自启动功能
    #[test]
    fn test_auto_start_operations() {
        let macos = MacOS;
        
        // 测试设置自启动
        let enable_result = macos.set_auto_start(true);
        if let Ok(_) = enable_result {
            // 验证plist文件是否创建
            assert!(macos.is_auto_start_enabled().unwrap_or(false));
            
            // 测试关闭自启动
            let disable_result = macos.set_auto_start(false);
            assert!(disable_result.is_ok());
            assert!(!macos.is_auto_start_enabled().unwrap_or(true));
        }
    }

    #[test]
    fn test_plist_file_operations() {
        let (app_name, _) = get_app_info().unwrap();
        let plist_path = format!("~/Library/LaunchAgents/{}.plist", app_name);
        let path = Path::new(&plist_path);

        if path.exists() {
            // 如果文件存在，读取并验证内容
            if let Ok(content) = fs::read_to_string(path) {
                assert!(content.contains("Label"));
                assert!(content.contains("ProgramArguments"));
                assert!(content.contains("RunAtLoad"));
                assert!(content.contains(&app_name));
            }
        }
    }

    // 3. 测试并发场景
    #[test]
    fn test_concurrent_window_monitoring() {
        let monitor = Arc::new(MacOSMonitor::new());
        let mut handles = vec![];

        for _ in 0..5 {
            let monitor_clone = Arc::clone(&monitor);
            let handle = thread::spawn(move || {
                for _ in 0..10 {
                    let _ = monitor_clone.get_active_window();
                    thread::sleep(std::time::Duration::from_millis(10));
                }
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap();
        }
    }

    // 4. 测试错误处理
    #[test]
    fn test_error_handling() {
        let macos = MacOS;

        // 测试无效路径场景
        let (app_name, _) = get_app_info().unwrap();
        let invalid_plist_path = format!("/invalid/path/{}.plist", app_name);
        
        // 尝试操作不存在的文件
        if let Err(e) = std::fs::write(&invalid_plist_path, "invalid content") {
            assert!(!e.to_string().is_empty());
        }

        // 测试无效的launchctl命令
        let output = Command::new("launchctl")
            .args(&["invalid_command"])
            .output();
        assert!(output.is_err() || output.unwrap().status.success() == false);
    }

    // 5. 测试状态检查
    #[test]
    fn test_auto_start_status_check() {
        let macos = MacOS;
        
        // 检查当前状态
        let status = macos.is_auto_start_enabled();
        assert!(status.is_ok());
        
        // 测试状态切换
        let current_status = status.unwrap();
        if current_status {
            // 如果已启用，测试禁用
            assert!(macos.set_auto_start(false).is_ok());
            assert!(!macos.is_auto_start_enabled().unwrap());
        } else {
            // 如果已禁用，测试启用
            assert!(macos.set_auto_start(true).is_ok());
            assert!(macos.is_auto_start_enabled().unwrap());
        }
        
        // 恢复原始状态
        assert!(macos.set_auto_start(current_status).is_ok());
    }

    // 6. 测试窗口信息解析
    #[test]
    fn test_window_info_parsing() {
        let monitor = MacOSMonitor::new();
        let window_info = monitor.get_active_window();
        
        if let Some(name) = window_info {
            // macOS 应用名称验证
            assert!(!name.is_empty());
            assert!(!name.contains('/'));  // 不应包含路径分隔符
            assert!(!name.contains('\0')); // 不应包含空字符
        }
    }

    // 7. 测试边界情况
    #[test]
    fn test_edge_cases() {
        let macos = MacOS;
        
        // 快速切换自启动状态
        for _ in 0..3 {
            let _ = macos.set_auto_start(true);
            let _ = macos.set_auto_start(false);
        }
        
        // 连续检查状态
        for _ in 0..5 {
            let _ = macos.is_auto_start_enabled();
        }
    }

    // 8. 测试路径处理
    #[test]
    fn test_path_handling() {
        let (app_name, app_path) = get_app_info().unwrap();
        
        // 验证应用名称
        assert!(!app_name.is_empty());
        assert!(!app_name.contains('/'));
        
        // 验证应用路径
        assert!(app_path.exists());
        assert!(app_path.is_absolute());
    }

    // 9. 集成测试
    #[test]
    fn test_integrated_functionality() {
        let macos = MacOS;
        let monitor = MacOSMonitor::new();

        // 组合测试窗口监控和自启动
        let window_name = monitor.get_active_window();
        let auto_start_status = macos.is_auto_start_enabled();

        println!("Current window: {:?}", window_name);
        println!("Auto start status: {:?}", auto_start_status);
    }
}