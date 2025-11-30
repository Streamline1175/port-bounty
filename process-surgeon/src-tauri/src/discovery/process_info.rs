// Process Info Module - Cross-platform process metadata gathering
use crate::models::ProcessInfo;
use chrono::{DateTime, Utc};
use sysinfo::{Pid, System, Users};
use std::collections::HashMap;

/// Process information gatherer
pub struct ProcessEnricher {
    system: System,
    users: Users,
}

impl ProcessEnricher {
    pub fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();
        let users = Users::new_with_refreshed_list();
        
        Self { system, users }
    }

    /// Refresh system information
    pub fn refresh(&mut self) {
        self.system.refresh_all();
    }

    /// Get process information by PID
    pub fn get_process_info(&self, pid: u32) -> Option<ProcessInfo> {
        let sysinfo_pid = Pid::from_u32(pid);
        let process = self.system.process(sysinfo_pid)?;

        let user_name = process
            .user_id()
            .and_then(|uid| self.users.get_user_by_id(uid))
            .map(|u| u.name().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        let start_time = if process.start_time() > 0 {
            Some(DateTime::from_timestamp(process.start_time() as i64, 0)
                .unwrap_or_else(|| Utc::now()))
        } else {
            None
        };

        Some(ProcessInfo {
            pid,
            name: process.name().to_string_lossy().to_string(),
            exe_path: process.exe().map(|p| p.to_string_lossy().to_string()),
            command_line: Some(process.cmd().iter().map(|s| s.to_string_lossy()).collect::<Vec<_>>().join(" ")),
            user: user_name,
            memory_usage: process.memory(),
            cpu_usage: process.cpu_usage(),
            start_time,
            parent_pid: process.parent().map(|p| p.as_u32()),
        })
    }

    /// Get information for multiple PIDs
    pub fn get_processes_info(&self, pids: &[u32]) -> HashMap<u32, ProcessInfo> {
        pids.iter()
            .filter_map(|&pid| self.get_process_info(pid).map(|info| (pid, info)))
            .collect()
    }

    /// Get all running processes
    pub fn get_all_processes(&self) -> Vec<ProcessInfo> {
        self.system
            .processes()
            .iter()
            .filter_map(|(pid, _)| self.get_process_info(pid.as_u32()))
            .collect()
    }

    /// Check if a process is a Docker proxy
    pub fn is_docker_proxy(&self, pid: u32) -> bool {
        if let Some(info) = self.get_process_info(pid) {
            let name_lower = info.name.to_lowercase();
            name_lower.contains("docker")
                || name_lower.contains("com.docker")
                || name_lower == "vpnkit"
                || name_lower == "dockerd"
                || name_lower.contains("containerd")
        } else {
            false
        }
    }
}

impl Default for ProcessEnricher {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_enricher() {
        let enricher = ProcessEnricher::new();
        
        // Get info for PID 1 (init/launchd on Unix, System on Windows)
        let info = enricher.get_process_info(1);
        println!("PID 1 info: {:?}", info);
    }
}
