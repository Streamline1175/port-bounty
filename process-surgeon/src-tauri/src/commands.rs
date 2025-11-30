// Commands module - Tauri IPC command handlers
use crate::discovery::{ProcessEnricher, scan_listening_ports, scan_ports, find_port_users};
use crate::docker::DockerResolver;
use crate::models::*;
use crate::surgery::{ProcessTerminator, request_elevated_termination};
use chrono::Utc;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// Application state managed by Tauri
pub struct AppStateManager {
    pub docker: Arc<RwLock<DockerResolver>>,
    pub process_enricher: Arc<RwLock<ProcessEnricher>>,
    pub terminator: Arc<RwLock<ProcessTerminator>>,
}

impl AppStateManager {
    pub async fn new() -> Self {
        Self {
            docker: Arc::new(RwLock::new(DockerResolver::new().await)),
            process_enricher: Arc::new(RwLock::new(ProcessEnricher::new())),
            terminator: Arc::new(RwLock::new(ProcessTerminator::new())),
        }
    }
}

/// Fetch all processes with their port bindings
#[tauri::command]
pub async fn get_processes(
    state: State<'_, AppStateManager>,
    show_all_connections: bool,
) -> Result<AppState, AppError> {
    log::debug!("Fetching processes, show_all: {}", show_all_connections);

    // Scan ports
    let ports = if show_all_connections {
        scan_ports().map_err(|e| AppError::new("SCAN_ERROR", &e.to_string()))?
    } else {
        scan_listening_ports().map_err(|e| AppError::new("SCAN_ERROR", &e.to_string()))?
    };

    // Collect unique PIDs
    let all_pids: Vec<u32> = ports.iter().flat_map(|p| p.pids.clone()).collect();
    let unique_pids: Vec<u32> = {
        let mut pids = all_pids.clone();
        pids.sort();
        pids.dedup();
        pids
    };

    // Refresh and get process info
    let enricher = state.process_enricher.read().await;
    let process_map = enricher.get_processes_info(&unique_pids);

    // Refresh Docker port map
    let docker = state.docker.read().await;
    if docker.is_available() {
        let _ = docker.refresh().await;
    }

    // Build process nodes grouped by PID
    // Use a set to track unique ports per process (protocol + port + address)
    let mut pid_to_ports: HashMap<u32, Vec<PortEntry>> = HashMap::new();
    let mut pid_seen_ports: HashMap<u32, HashSet<(Protocol, u16, String)>> = HashMap::new();
    
    for port_info in &ports {
        let port_entry = PortEntry {
            protocol: port_info.protocol,
            local_address: port_info.local_address.clone(),
            local_port: port_info.local_port,
            remote_address: port_info.remote_address.clone(),
            remote_port: port_info.remote_port,
            state: port_info.state,
        };
        
        // Create a key for deduplication (protocol + port + normalized address)
        // Normalize address: treat 0.0.0.0, ::, and specific IPs as potentially the same listening port
        let normalized_addr = if port_info.local_address == "0.0.0.0" || 
                                 port_info.local_address == "::" || 
                                 port_info.local_address == "::1" ||
                                 port_info.local_address == "127.0.0.1" {
            "any".to_string()
        } else {
            port_info.local_address.clone()
        };
        let port_key = (port_info.protocol, port_info.local_port, normalized_addr);
        
        for &pid in &port_info.pids {
            let seen = pid_seen_ports.entry(pid).or_insert_with(HashSet::new);
            
            // Only add if we haven't seen this port combination for this PID
            if seen.insert(port_key.clone()) {
                pid_to_ports
                    .entry(pid)
                    .or_insert_with(Vec::new)
                    .push(port_entry.clone());
            }
        }
    }

    // Create ProcessNodes
    let mut processes: Vec<ProcessNode> = Vec::new();
    
    for (pid, ports) in pid_to_ports {
        let is_docker = enricher.is_docker_proxy(pid);
        
        // Try to get container info for first port
        let container = if is_docker && docker.is_available() {
            if let Some(first_port) = ports.first() {
                docker.get_container_for_port(first_port.local_port).await
            } else {
                None
            }
        } else {
            None
        };

        let (name, exe_path, command_line, user, memory_usage, cpu_usage, start_time) =
            if let Some(info) = process_map.get(&pid) {
                (
                    info.name.clone(),
                    info.exe_path.clone(),
                    info.command_line.clone(),
                    info.user.clone(),
                    info.memory_usage,
                    info.cpu_usage,
                    info.start_time,
                )
            } else {
                (
                    "Unknown".to_string(),
                    None,
                    None,
                    "Unknown".to_string(),
                    0,
                    0.0,
                    None,
                )
            };

        // Check if process is protected
        let safety = crate::surgery::check_process_safety(pid, &name);
        let is_protected = !safety.is_safe();

        let node = ProcessNode {
            id: format!("{}-{}", pid, ports.first().map(|p| p.local_port).unwrap_or(0)),
            pid,
            name,
            exe_path,
            command_line,
            user,
            memory_usage,
            cpu_usage,
            start_time,
            ports,
            is_docker_proxy: is_docker,
            container,
            is_protected,
        };
        
        processes.push(node);
    }

    // Sort by PID for consistency
    processes.sort_by_key(|p| p.pid);

    let listening_count = processes
        .iter()
        .filter(|p| p.ports.iter().any(|port| matches!(port.state, SocketState::Listening)))
        .count();

    Ok(AppState {
        processes,
        total_connections: ports.len(),
        listening_ports: listening_count,
        docker_available: docker.is_available(),
        last_updated: Utc::now(),
    })
}

/// Find processes using a specific port
#[tauri::command]
pub async fn find_port(
    state: State<'_, AppStateManager>,
    port: u16,
) -> Result<Vec<ProcessNode>, AppError> {
    let ports = find_port_users(port).map_err(|e| AppError::new("SCAN_ERROR", &e.to_string()))?;
    
    if ports.is_empty() {
        return Ok(vec![]);
    }

    let enricher = state.process_enricher.read().await;
    let docker = state.docker.read().await;
    
    let mut nodes = Vec::new();
    
    for port_info in ports {
        for &pid in &port_info.pids {
            let is_docker = enricher.is_docker_proxy(pid);
            let container = if is_docker && docker.is_available() {
                docker.get_container_for_port(port_info.local_port).await
            } else {
                None
            };

            let info = enricher.get_process_info(pid);
            let (name, exe_path, command_line, user, memory_usage, cpu_usage, start_time) =
                if let Some(info) = info {
                    (
                        info.name,
                        info.exe_path,
                        info.command_line,
                        info.user,
                        info.memory_usage,
                        info.cpu_usage,
                        info.start_time,
                    )
                } else {
                    (
                        "Unknown".to_string(),
                        None,
                        None,
                        "Unknown".to_string(),
                        0,
                        0.0,
                        None,
                    )
                };

            let safety = crate::surgery::check_process_safety(pid, &name);
            
            nodes.push(ProcessNode {
                id: format!("{}-{}", pid, port_info.local_port),
                pid,
                name,
                exe_path,
                command_line,
                user,
                memory_usage,
                cpu_usage,
                start_time,
                ports: vec![PortEntry {
                    protocol: port_info.protocol,
                    local_address: port_info.local_address.clone(),
                    local_port: port_info.local_port,
                    remote_address: port_info.remote_address.clone(),
                    remote_port: port_info.remote_port,
                    state: port_info.state,
                }],
                is_docker_proxy: is_docker,
                container,
                is_protected: !safety.is_safe(),
            });
        }
    }
    
    Ok(nodes)
}

/// Kill a process by PID
#[tauri::command]
pub async fn kill_process(
    state: State<'_, AppStateManager>,
    pid: u32,
    force: bool,
) -> Result<KillResult, AppError> {
    log::info!("Kill request for PID {} (force: {})", pid, force);
    
    let mut terminator = state.terminator.write().await;
    
    match terminator.terminate(pid, force) {
        Ok(result) => {
            if !result.success && result.required_elevation {
                log::info!("Requesting elevated termination for PID {}", pid);
                // Try elevated termination
                match request_elevated_termination(pid, force) {
                    Ok(elevated_result) => Ok(elevated_result),
                    Err(e) => Ok(KillResult {
                        success: false,
                        message: format!("Elevated termination failed: {}", e),
                        required_elevation: true,
                    }),
                }
            } else {
                Ok(result)
            }
        }
        Err(e) => Err(AppError::new("KILL_ERROR", &e.to_string())),
    }
}

/// Execute a container action (stop, kill, remove)
#[tauri::command]
pub async fn container_action(
    state: State<'_, AppStateManager>,
    container_id: String,
    action: ContainerAction,
) -> Result<KillResult, AppError> {
    log::info!("Container action {:?} for {}", action, container_id);
    
    let docker = state.docker.read().await;
    
    if !docker.is_available() {
        return Err(AppError::new("DOCKER_UNAVAILABLE", "Docker is not available"));
    }
    
    match docker.execute_action(&container_id, action.clone()).await {
        Ok(_) => Ok(KillResult {
            success: true,
            message: format!("Container {} action {:?} completed", container_id, action),
            required_elevation: false,
        }),
        Err(e) => Ok(KillResult {
            success: false,
            message: format!("Container action failed: {}", e),
            required_elevation: false,
        }),
    }
}

/// Get Docker containers
#[tauri::command]
pub async fn get_containers(
    state: State<'_, AppStateManager>,
) -> Result<Vec<ContainerInfo>, AppError> {
    let docker = state.docker.read().await;
    
    if !docker.is_available() {
        return Ok(vec![]);
    }
    
    docker
        .get_all_containers()
        .await
        .map_err(|e| AppError::new("DOCKER_ERROR", &e.to_string()))
}

/// Check if Docker is available
#[tauri::command]
pub async fn is_docker_available(state: State<'_, AppStateManager>) -> Result<bool, AppError> {
    let docker = state.docker.read().await;
    Ok(docker.is_available())
}
