// Safety Module - "Do No Harm" registry and protection logic
use std::collections::HashSet;
use once_cell::sync::Lazy;

/// Protected process names that should never be terminated
/// These are critical system processes that could cause system instability if killed

#[cfg(target_os = "windows")]
static PROTECTED_PROCESSES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    let mut set = HashSet::new();
    // Windows critical processes
    set.insert("csrss.exe");
    set.insert("lsass.exe");
    set.insert("wininit.exe");
    set.insert("smss.exe");
    set.insert("services.exe");
    set.insert("winlogon.exe");
    set.insert("dwm.exe");
    set.insert("system");
    set.insert("registry");
    set.insert("memory compression");
    // Self-protection
    set.insert("process-surgeon.exe");
    set.insert("ps-surgeon-proxy.exe");
    set
});

#[cfg(target_os = "linux")]
static PROTECTED_PROCESSES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    let mut set = HashSet::new();
    // Linux critical processes
    set.insert("init");
    set.insert("systemd");
    set.insert("kthreadd");
    set.insert("ksoftirqd");
    set.insert("kworker");
    set.insert("rcu_sched");
    set.insert("migration");
    set.insert("watchdog");
    set.insert("cpuhp");
    set.insert("netns");
    set.insert("dbus-daemon");
    set.insert("NetworkManager");
    set.insert("systemd-journald");
    set.insert("systemd-logind");
    set.insert("systemd-udevd");
    // Self-protection
    set.insert("process-surgeon");
    set.insert("ps-surgeon-proxy");
    set
});

#[cfg(target_os = "macos")]
static PROTECTED_PROCESSES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    let mut set = HashSet::new();
    // macOS critical processes
    set.insert("kernel_task");
    set.insert("launchd");
    set.insert("WindowServer");
    set.insert("loginwindow");
    set.insert("opendirectoryd");
    set.insert("diskarbitrationd");
    set.insert("configd");
    set.insert("securityd");
    set.insert("coreauthd");
    set.insert("cfprefsd");
    set.insert("powerd");
    set.insert("logd");
    set.insert("UserEventAgent");
    set.insert("mds");
    set.insert("mds_stores");
    set.insert("notifyd");
    set.insert("distnoted");
    // Self-protection
    set.insert("process-surgeon");
    set.insert("Process Surgeon");
    set.insert("ps-surgeon-proxy");
    set
});

/// Protected PIDs that should never be terminated
static PROTECTED_PIDS: Lazy<HashSet<u32>> = Lazy::new(|| {
    let mut set = HashSet::new();
    set.insert(0); // System/kernel
    set.insert(1); // init/launchd
    set
});

/// Safety check result
#[derive(Debug, Clone)]
pub enum SafetyCheckResult {
    Safe,
    ProtectedProcess(String),
    ProtectedPid(u32),
    SelfTermination,
}

impl SafetyCheckResult {
    pub fn is_safe(&self) -> bool {
        matches!(self, SafetyCheckResult::Safe)
    }
}

/// Check if a process is protected based on PID and name
pub fn check_process_safety(pid: u32, process_name: &str) -> SafetyCheckResult {
    // Check for self-termination
    let current_pid = std::process::id();
    if pid == current_pid {
        return SafetyCheckResult::SelfTermination;
    }

    // Check protected PIDs
    if PROTECTED_PIDS.contains(&pid) {
        return SafetyCheckResult::ProtectedPid(pid);
    }

    // Normalize process name for comparison
    let name_lower = process_name.to_lowercase();
    let name_without_ext = name_lower.trim_end_matches(".exe");

    // Check against protected process names
    for protected in PROTECTED_PROCESSES.iter() {
        let protected_lower = protected.to_lowercase();
        let protected_without_ext = protected_lower.trim_end_matches(".exe");
        
        if name_without_ext == protected_without_ext || name_lower == protected_lower {
            return SafetyCheckResult::ProtectedProcess(process_name.to_string());
        }
    }

    SafetyCheckResult::Safe
}

/// Check if PID 1 is being targeted (always protected)
pub fn is_pid_one(pid: u32) -> bool {
    pid == 1
}

/// Check if the process is the application itself
pub fn is_self_process(pid: u32) -> bool {
    pid == std::process::id()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protected_pid() {
        assert!(!check_process_safety(0, "System").is_safe());
        assert!(!check_process_safety(1, "init").is_safe());
    }

    #[test]
    fn test_protected_process_names() {
        #[cfg(target_os = "macos")]
        {
            assert!(!check_process_safety(100, "kernel_task").is_safe());
            assert!(!check_process_safety(100, "launchd").is_safe());
            assert!(!check_process_safety(100, "WindowServer").is_safe());
        }

        #[cfg(target_os = "linux")]
        {
            assert!(!check_process_safety(100, "systemd").is_safe());
            assert!(!check_process_safety(100, "init").is_safe());
        }

        #[cfg(target_os = "windows")]
        {
            assert!(!check_process_safety(100, "csrss.exe").is_safe());
            assert!(!check_process_safety(100, "lsass.exe").is_safe());
        }
    }

    #[test]
    fn test_safe_process() {
        assert!(check_process_safety(12345, "node").is_safe());
        assert!(check_process_safety(12345, "python3").is_safe());
        assert!(check_process_safety(12345, "nginx").is_safe());
    }

    #[test]
    fn test_self_protection() {
        let current_pid = std::process::id();
        assert!(!check_process_safety(current_pid, "test").is_safe());
    }
}
