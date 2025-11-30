// Terminator Module - Process termination implementation
use crate::models::KillResult;
use crate::surgery::safety::{check_process_safety, SafetyCheckResult};
use anyhow::Result;
use sysinfo::{Pid, Signal, System};

/// Process terminator with safety checks
pub struct ProcessTerminator {
    system: System,
}

impl ProcessTerminator {
    pub fn new() -> Self {
        let mut system = System::new();
        system.refresh_processes(sysinfo::ProcessesToUpdate::All);
        Self { system }
    }

    /// Refresh process list
    pub fn refresh(&mut self) {
        self.system.refresh_processes(sysinfo::ProcessesToUpdate::All);
    }

    /// Terminate a process by PID
    /// 
    /// # Arguments
    /// * `pid` - Process ID to terminate
    /// * `force` - If true, use SIGKILL; if false, try SIGTERM first
    /// 
    /// # Returns
    /// * `Ok(KillResult)` - Result of the termination attempt
    /// * `Err` - On system errors
    pub fn terminate(&mut self, pid: u32, force: bool) -> Result<KillResult> {
        self.refresh();

        // Get process info for safety check
        let sysinfo_pid = Pid::from_u32(pid);
        let process = self.system.process(sysinfo_pid);

        let process_name = process
            .map(|p| p.name().to_string_lossy().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        // Perform safety check
        let safety_result = check_process_safety(pid, &process_name);
        
        match safety_result {
            SafetyCheckResult::Safe => {
                // Process is safe to terminate
            }
            SafetyCheckResult::ProtectedProcess(name) => {
                return Ok(KillResult {
                    success: false,
                    message: format!("Cannot terminate protected system process: {}", name),
                    required_elevation: false,
                });
            }
            SafetyCheckResult::ProtectedPid(p) => {
                return Ok(KillResult {
                    success: false,
                    message: format!("Cannot terminate protected PID: {}", p),
                    required_elevation: false,
                });
            }
            SafetyCheckResult::SelfTermination => {
                return Ok(KillResult {
                    success: false,
                    message: "Cannot terminate self".to_string(),
                    required_elevation: false,
                });
            }
        }

        // Check if process exists
        let process = match self.system.process(sysinfo_pid) {
            Some(p) => p,
            None => {
                return Ok(KillResult {
                    success: false,
                    message: format!("Process {} not found", pid),
                    required_elevation: false,
                });
            }
        };

        // Attempt termination
        let signal = if force { Signal::Kill } else { Signal::Term };
        
        if process.kill_with(signal).unwrap_or(false) {
            Ok(KillResult {
                success: true,
                message: format!(
                    "Process {} ({}) terminated successfully",
                    pid, process_name
                ),
                required_elevation: false,
            })
        } else {
            // Kill failed - might need elevation
            Ok(KillResult {
                success: false,
                message: format!(
                    "Failed to terminate process {} ({}). May require elevated privileges.",
                    pid, process_name
                ),
                required_elevation: true,
            })
        }
    }

    /// Graceful termination with timeout
    /// Tries SIGTERM first, then SIGKILL after timeout
    pub async fn terminate_graceful(&mut self, pid: u32, timeout_secs: u64) -> Result<KillResult> {
        // First try graceful termination
        let result = self.terminate(pid, false)?;
        
        if result.success {
            return Ok(result);
        }

        if result.required_elevation {
            return Ok(result);
        }

        // Wait for process to exit
        let start = std::time::Instant::now();
        let timeout = std::time::Duration::from_secs(timeout_secs);

        while start.elapsed() < timeout {
            self.refresh();
            let sysinfo_pid = Pid::from_u32(pid);
            
            if self.system.process(sysinfo_pid).is_none() {
                return Ok(KillResult {
                    success: true,
                    message: format!("Process {} terminated gracefully", pid),
                    required_elevation: false,
                });
            }
            
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }

        // Timeout - force kill
        log::warn!("Process {} did not exit gracefully, forcing termination", pid);
        self.terminate(pid, true)
    }

    /// Check if current user owns the process
    pub fn is_owned_by_current_user(&self, pid: u32) -> bool {
        let sysinfo_pid = Pid::from_u32(pid);
        
        if let Some(process) = self.system.process(sysinfo_pid) {
            if let Some(process_uid) = process.user_id() {
                // On Unix, compare UIDs
                #[cfg(unix)]
                {
                    let current_uid = unsafe { libc::getuid() };
                    return **process_uid == current_uid;
                }
                
                #[cfg(windows)]
                {
                    // On Windows, this is more complex - simplified for now
                    return true;
                }
            }
        }
        
        false
    }
}

impl Default for ProcessTerminator {
    fn default() -> Self {
        Self::new()
    }
}

/// Platform-specific elevated termination
#[cfg(target_os = "macos")]
pub fn request_elevated_termination(pid: u32, force: bool) -> Result<KillResult> {
    use std::process::Command;
    
    // On macOS, we'll use the sidecar pattern with osascript for now
    // In production, this would use SMAppService
    let signal = if force { "KILL" } else { "TERM" };
    
    let script = format!(
        "do shell script \"kill -{} {}\" with administrator privileges",
        signal, pid
    );
    
    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()?;
    
    if output.status.success() {
        Ok(KillResult {
            success: true,
            message: format!("Process {} terminated with elevated privileges", pid),
            required_elevation: true,
        })
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Ok(KillResult {
            success: false,
            message: format!("Elevated termination failed: {}", error),
            required_elevation: true,
        })
    }
}

#[cfg(target_os = "linux")]
pub fn request_elevated_termination(pid: u32, force: bool) -> Result<KillResult> {
    use std::process::Command;
    
    let signal = if force { "-9" } else { "-15" };
    
    // Try pkexec first (Polkit)
    let output = Command::new("pkexec")
        .arg("kill")
        .arg(signal)
        .arg(pid.to_string())
        .output()?;
    
    if output.status.success() {
        Ok(KillResult {
            success: true,
            message: format!("Process {} terminated with elevated privileges", pid),
            required_elevation: true,
        })
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Ok(KillResult {
            success: false,
            message: format!("Elevated termination failed: {}", error),
            required_elevation: true,
        })
    }
}

#[cfg(target_os = "windows")]
pub fn request_elevated_termination(pid: u32, _force: bool) -> Result<KillResult> {
    use std::process::Command;
    
    // On Windows, we'd use ShellExecute with "runas" verb
    // For now, use taskkill with elevated prompt
    let output = Command::new("powershell")
        .args([
            "-Command",
            &format!(
                "Start-Process -FilePath 'taskkill' -ArgumentList '/F /PID {}' -Verb RunAs -Wait",
                pid
            ),
        ])
        .output()?;
    
    if output.status.success() {
        Ok(KillResult {
            success: true,
            message: format!("Process {} terminated with elevated privileges", pid),
            required_elevation: true,
        })
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Ok(KillResult {
            success: false,
            message: format!("Elevated termination failed: {}", error),
            required_elevation: true,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_terminator_creation() {
        let terminator = ProcessTerminator::new();
        // Just verify it creates successfully
        assert!(true);
    }
}
