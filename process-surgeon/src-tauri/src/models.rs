// Models module - Core data structures
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Network protocol type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Protocol {
    TCP,
    UDP,
}

/// Socket connection state
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SocketState {
    Listening,
    Established,
    SynSent,
    SynReceived,
    FinWait1,
    FinWait2,
    CloseWait,
    Closing,
    LastAck,
    TimeWait,
    Closed,
    Unknown,
}

/// Port information from socket enumeration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortInfo {
    pub protocol: Protocol,
    pub local_address: String,
    pub local_port: u16,
    pub remote_address: Option<String>,
    pub remote_port: Option<u16>,
    pub state: SocketState,
    pub pids: Vec<u32>,
}

/// Process information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub exe_path: Option<String>,
    pub command_line: Option<String>,
    pub user: String,
    pub memory_usage: u64,
    pub cpu_usage: f32,
    pub start_time: Option<DateTime<Utc>>,
    pub parent_pid: Option<u32>,
}

/// Container type enum
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ContainerRuntime {
    Docker,
    Podman,
    Containerd,
    Unknown,
}

/// Docker container information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerInfo {
    pub id: String,
    pub name: String,
    pub image: String,
    pub status: String,
    pub state: String,
    pub runtime: ContainerRuntime,
    pub ports: Vec<ContainerPort>,
}

/// Container port mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerPort {
    pub host_port: u16,
    pub container_port: u16,
    pub protocol: Protocol,
    pub host_ip: Option<String>,
}

/// Unified process node combining port, process, and container info
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessNode {
    pub id: String, // Unique identifier (PID-Port combination)
    pub pid: u32,
    pub name: String,
    pub exe_path: Option<String>,
    pub command_line: Option<String>,
    pub user: String,
    pub memory_usage: u64,
    pub cpu_usage: f32,
    pub start_time: Option<DateTime<Utc>>,
    pub ports: Vec<PortEntry>,
    pub is_docker_proxy: bool,
    pub container: Option<ContainerInfo>,
    pub is_protected: bool,
}

/// Port entry within a process node
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortEntry {
    pub protocol: Protocol,
    pub local_address: String,
    pub local_port: u16,
    pub remote_address: Option<String>,
    pub remote_port: Option<u16>,
    pub state: SocketState,
}

/// Kill request from frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KillRequest {
    pub pid: u32,
    pub force: bool,
}

/// Kill result response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KillResult {
    pub success: bool,
    pub message: String,
    pub required_elevation: bool,
}

/// Container action request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerActionRequest {
    pub container_id: String,
    pub action: ContainerAction,
}

/// Available container actions
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ContainerAction {
    Stop,
    Kill,
    Remove,
    Restart,
}

/// Application state for the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub processes: Vec<ProcessNode>,
    pub total_connections: usize,
    pub listening_ports: usize,
    pub docker_available: bool,
    pub last_updated: DateTime<Utc>,
}

/// Error types for IPC communication
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl AppError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            details: None,
        }
    }

    pub fn with_details(code: &str, message: &str, details: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            details: Some(details.to_string()),
        }
    }

    pub fn safety_violation(process_name: &str) -> Self {
        Self::with_details(
            "SAFETY_VIOLATION",
            "Operation Forbidden: Critical System Process",
            &format!("Cannot terminate protected process: {}", process_name),
        )
    }

    pub fn access_denied(pid: u32) -> Self {
        Self::with_details(
            "ACCESS_DENIED",
            "Insufficient privileges",
            &format!("Elevated privileges required to terminate PID {}", pid),
        )
    }

    pub fn process_not_found(pid: u32) -> Self {
        Self::new("NOT_FOUND", &format!("Process {} not found", pid))
    }
}
