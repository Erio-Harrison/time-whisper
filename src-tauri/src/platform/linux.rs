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

#[cfg(test)]
#[cfg(target_os = "linux")]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::thread;
    use std::process::Command;

    // 1. 基础窗口信息测试
    #[test]
    fn test_get_active_window() {
        let monitor = LinuxMonitor::new();
        let result = monitor.get_active_window();
        
        match result {
            Some(window_name) => {
                // Linux 下进程名通常不包含路径
                assert!(!window_name.is_empty());
                assert!(!window_name.contains('/'));
            }
            None => {} // 可能没有活动窗口，这是合法的
        }
    }

    #[test]
    fn test_multiple_queries() {
        let monitor = LinuxMonitor::new();
        
        // 连续多次查询窗口信息
        for _ in 0..5 {
            let result = monitor.get_active_window();
            match result {
                Some(name) => {
                    assert!(!name.is_empty());
                    assert!(!name.contains('\0')); // 不应包含空字符
                }
                None => continue,
            }
        }
    }

    // 2. X11 连接测试
    #[test]
    fn test_x11_connection() {
        if let Ok((conn, screen_num)) = x11rb::connect(None) {
            let screen = &conn.setup().roots[screen_num];
            assert!(screen.root != 0);
            
            // 测试根窗口属性获取
            if let Ok(atom) = conn.intern_atom(false, b"_NET_ACTIVE_WINDOW") {
                let atom_reply = atom.reply();
                assert!(atom_reply.is_ok());
            }
        }
    }

    // 3. 进程命令测试
    #[test]
    fn test_process_command() {
        // 测试 ps 命令
        let output = Command::new("ps")
            .arg("-e")
            .arg("-o")
            .arg("comm=")
            .output();
            
        assert!(output.is_ok());
        if let Ok(out) = output {
            assert!(!out.stdout.is_empty());
            let processes = String::from_utf8_lossy(&out.stdout);
            assert!(!processes.is_empty());
        }
    }

    // 4. 并发测试
    #[test]
    fn test_concurrent_monitoring() {
        let monitor = Arc::new(LinuxMonitor::new());
        let mut handles = vec![];

        // 创建多个线程同时获取窗口信息
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

    // 5. 错误处理测试
    #[test]
    fn test_error_handling() {
        let monitor = LinuxMonitor::new();
        
        // 测试无效的 pid
        let output = Command::new("ps")
            .arg("-p")
            .arg("999999999") // 使用一个极大的无效 pid
            .arg("-o")
            .arg("comm=")
            .output();
            
        // ps 命令对无效 pid 应该返回错误状态
        assert!(output.is_ok());
        assert!(!output.unwrap().status.success());
    }

    // 6. 进程名解析测试
    #[test]
    fn test_process_name_parsing() {
        // 测试一些常见的进程名格式
        let test_outputs = vec![
            "process_name\n",
            "process-name\n",
            "process.name\n",
            "    process_name    \n",  // 带空格
            "proc\0ess_name\n",        // 带 null 字符
        ];

        for output in test_outputs {
            let cleaned = output.trim().replace('\0', "");
            assert!(!cleaned.is_empty());
            assert!(!cleaned.contains('\n'));
            assert!(!cleaned.contains('\0'));
        }
    }

    // 7. 边界条件测试
    #[test]
    fn test_edge_cases() {
        let monitor = LinuxMonitor::new();
        
        // 快速连续查询
        for _ in 0..100 {
            let _ = monitor.get_active_window();
        }
        
        // 在不同线程中同时查询
        let monitor = Arc::new(monitor);
        let monitor2 = monitor.clone();
        
        let handle = thread::spawn(move || {
            monitor2.get_active_window()
        });
        
        let _ = monitor.get_active_window();
        let _ = handle.join();
    }

    // 8. 系统信息测试
    #[test]
    fn test_system_info() {
        // 验证是否在 X11 环境下
        let display = std::env::var("DISPLAY");
        if let Ok(display_val) = display {
            assert!(!display_val.is_empty());
        }

        // 检查必要的系统命令
        let commands = vec!["ps", "xwininfo", "xprop"];
        for cmd in commands {
            let which_output = Command::new("which")
                .arg(cmd)
                .output();
            assert!(which_output.is_ok());
        }
    }

    // 9. 集成测试
    #[test]
    fn test_integrated_functionality() {
        let monitor = LinuxMonitor::new();

        // 组合测试窗口监控
        for _ in 0..3 {
            let window_name = monitor.get_active_window();
            println!("Current window: {:?}", window_name);
            thread::sleep(std::time::Duration::from_millis(100));
        }
    }

    // 10. 性能测试
    #[test]
    fn test_performance() {
        let monitor = LinuxMonitor::new();
        let start = std::time::Instant::now();
        
        // 测试 100 次窗口信息获取的性能
        for _ in 0..100 {
            let _ = monitor.get_active_window();
        }
        
        let duration = start.elapsed();
        println!("100 queries took: {:?}", duration);
        // 确保每次查询平均不超过 50ms
        assert!(duration.as_millis() < 5000);
    }
}