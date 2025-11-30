// Docker Resolver Module - Container port resolution
use crate::models::{ContainerAction, ContainerInfo, ContainerPort, ContainerRuntime, Protocol};
use anyhow::{anyhow, Result};
use bollard::container::{
    KillContainerOptions, ListContainersOptions, RemoveContainerOptions, StopContainerOptions,
};
use bollard::Docker;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Docker container resolver for mapping ports to containers
pub struct DockerResolver {
    client: Option<Docker>,
    port_map: Arc<RwLock<HashMap<u16, ContainerInfo>>>,
}

impl DockerResolver {
    /// Create a new Docker resolver, connecting to the default socket
    pub async fn new() -> Self {
        let client = Self::connect().await;
        
        if client.is_some() {
            log::info!("Docker connection established");
        } else {
            log::warn!("Docker not available - container features disabled");
        }

        Self {
            client,
            port_map: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Attempt to connect to Docker daemon
    async fn connect() -> Option<Docker> {
        // Try default connection methods
        match Docker::connect_with_local_defaults() {
            Ok(docker) => {
                // Verify connection works
                match docker.ping().await {
                    Ok(_) => Some(docker),
                    Err(e) => {
                        log::debug!("Docker ping failed: {}", e);
                        None
                    }
                }
            }
            Err(e) => {
                log::debug!("Docker connection failed: {}", e);
                None
            }
        }
    }

    /// Check if Docker is available
    pub fn is_available(&self) -> bool {
        self.client.is_some()
    }

    /// Refresh the port-to-container mapping
    pub async fn refresh(&self) -> Result<()> {
        let client = self.client.as_ref().ok_or_else(|| anyhow!("Docker not available"))?;

        let options = ListContainersOptions::<String> {
            all: false, // Only running containers
            ..Default::default()
        };

        let containers = client.list_containers(Some(options)).await?;
        let mut port_map = self.port_map.write().await;
        port_map.clear();

        for container in containers {
            let container_info = self.container_to_info(&container);
            
            // Map each host port to this container
            for port in &container_info.ports {
                port_map.insert(port.host_port, container_info.clone());
            }
        }

        Ok(())
    }

    /// Convert Bollard container summary to our ContainerInfo
    fn container_to_info(&self, container: &bollard::models::ContainerSummary) -> ContainerInfo {
        let ports: Vec<ContainerPort> = container
            .ports
            .as_ref()
            .map(|ports| {
                ports
                    .iter()
                    .filter_map(|p| {
                        // Only include ports that have a host binding
                        p.public_port.map(|host_port| ContainerPort {
                            host_port,
                            container_port: p.private_port,
                            protocol: match &p.typ {
                                Some(bollard::models::PortTypeEnum::UDP) => Protocol::UDP,
                                _ => Protocol::TCP,
                            },
                            host_ip: p.ip.clone(),
                        })
                    })
                    .collect()
            })
            .unwrap_or_default();

        let name = container
            .names
            .as_ref()
            .and_then(|names| names.first())
            .map(|n| n.trim_start_matches('/').to_string())
            .unwrap_or_else(|| "unknown".to_string());

        ContainerInfo {
            id: container.id.clone().unwrap_or_default(),
            name,
            image: container.image.clone().unwrap_or_default(),
            status: container.status.clone().unwrap_or_default(),
            state: container.state.clone().unwrap_or_default(),
            runtime: ContainerRuntime::Docker,
            ports,
        }
    }

    /// Get container info for a specific port
    pub async fn get_container_for_port(&self, port: u16) -> Option<ContainerInfo> {
        let port_map = self.port_map.read().await;
        port_map.get(&port).cloned()
    }

    /// Get all containers with port mappings
    pub async fn get_all_containers(&self) -> Result<Vec<ContainerInfo>> {
        let client = self.client.as_ref().ok_or_else(|| anyhow!("Docker not available"))?;

        let options = ListContainersOptions::<String> {
            all: true,
            ..Default::default()
        };

        let containers = client.list_containers(Some(options)).await?;
        
        Ok(containers
            .iter()
            .map(|c| self.container_to_info(c))
            .collect())
    }

    /// Stop a container gracefully
    pub async fn stop_container(&self, container_id: &str) -> Result<()> {
        let client = self.client.as_ref().ok_or_else(|| anyhow!("Docker not available"))?;
        
        let options = StopContainerOptions { t: 10 }; // 10 second timeout
        client.stop_container(container_id, Some(options)).await?;
        
        log::info!("Stopped container: {}", container_id);
        Ok(())
    }

    /// Force kill a container
    pub async fn kill_container(&self, container_id: &str) -> Result<()> {
        let client = self.client.as_ref().ok_or_else(|| anyhow!("Docker not available"))?;
        
        let options = KillContainerOptions { signal: "SIGKILL" };
        client.kill_container(container_id, Some(options)).await?;
        
        log::info!("Killed container: {}", container_id);
        Ok(())
    }

    /// Remove a container
    pub async fn remove_container(&self, container_id: &str, force: bool) -> Result<()> {
        let client = self.client.as_ref().ok_or_else(|| anyhow!("Docker not available"))?;
        
        let options = RemoveContainerOptions {
            force,
            ..Default::default()
        };
        client.remove_container(container_id, Some(options)).await?;
        
        log::info!("Removed container: {}", container_id);
        Ok(())
    }

    /// Execute a container action
    pub async fn execute_action(&self, container_id: &str, action: ContainerAction) -> Result<()> {
        match action {
            ContainerAction::Stop => self.stop_container(container_id).await,
            ContainerAction::Kill => self.kill_container(container_id).await,
            ContainerAction::Remove => self.remove_container(container_id, true).await,
            ContainerAction::Restart => {
                let client = self.client.as_ref().ok_or_else(|| anyhow!("Docker not available"))?;
                client.restart_container(container_id, None).await?;
                Ok(())
            }
        }
    }
}

impl Default for DockerResolver {
    fn default() -> Self {
        // Create without async - client will be None
        Self {
            client: None,
            port_map: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_docker_connection() {
        let resolver = DockerResolver::new().await;
        println!("Docker available: {}", resolver.is_available());
        
        if resolver.is_available() {
            let containers = resolver.get_all_containers().await;
            println!("Containers: {:?}", containers);
        }
    }
}
