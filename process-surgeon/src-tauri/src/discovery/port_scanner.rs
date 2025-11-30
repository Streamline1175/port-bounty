// Port Scanner Module - Cross-platform socket enumeration
use crate::models::{PortInfo, Protocol, SocketState};
use anyhow::Result;
use netstat2::{get_sockets_info, AddressFamilyFlags, ProtocolFlags, ProtocolSocketInfo};

/// Scans all active network sockets on the system
pub fn scan_ports() -> Result<Vec<PortInfo>> {
    let af_flags = AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6;
    let proto_flags = ProtocolFlags::TCP | ProtocolFlags::UDP;

    let sockets = get_sockets_info(af_flags, proto_flags)?;

    let mut ports: Vec<PortInfo> = sockets
        .into_iter()
        .filter_map(|socket| {
            let (protocol, local_addr, local_port, remote_addr, remote_port, state) =
                match &socket.protocol_socket_info {
                    ProtocolSocketInfo::Tcp(tcp) => {
                        let state = tcp_state_to_socket_state(&tcp.state);
                        (
                            Protocol::TCP,
                            tcp.local_addr,
                            tcp.local_port,
                            Some(tcp.remote_addr),
                            Some(tcp.remote_port),
                            state,
                        )
                    }
                    ProtocolSocketInfo::Udp(udp) => (
                        Protocol::UDP,
                        udp.local_addr,
                        udp.local_port,
                        None,
                        None,
                        SocketState::Listening, // UDP is connectionless
                    ),
                };

            // Get associated PIDs
            let pids: Vec<u32> = socket.associated_pids.iter().map(|&p| p as u32).collect();

            if pids.is_empty() {
                return None;
            }

            Some(PortInfo {
                protocol,
                local_address: local_addr.to_string(),
                local_port,
                remote_address: remote_addr.map(|a| a.to_string()),
                remote_port,
                state,
                pids,
            })
        })
        .collect();

    // Sort by local port for consistency
    ports.sort_by_key(|p| p.local_port);

    Ok(ports)
}

/// Scan only listening ports (servers)
pub fn scan_listening_ports() -> Result<Vec<PortInfo>> {
    let all_ports = scan_ports()?;
    Ok(all_ports
        .into_iter()
        .filter(|p| matches!(p.state, SocketState::Listening))
        .collect())
}

/// Find processes using a specific port
pub fn find_port_users(port: u16) -> Result<Vec<PortInfo>> {
    let all_ports = scan_ports()?;
    Ok(all_ports
        .into_iter()
        .filter(|p| p.local_port == port)
        .collect())
}

/// Convert netstat2 TCP state to our SocketState enum
fn tcp_state_to_socket_state(state: &netstat2::TcpState) -> SocketState {
    match state {
        netstat2::TcpState::Listen => SocketState::Listening,
        netstat2::TcpState::Established => SocketState::Established,
        netstat2::TcpState::SynSent => SocketState::SynSent,
        netstat2::TcpState::SynReceived => SocketState::SynReceived,
        netstat2::TcpState::FinWait1 => SocketState::FinWait1,
        netstat2::TcpState::FinWait2 => SocketState::FinWait2,
        netstat2::TcpState::CloseWait => SocketState::CloseWait,
        netstat2::TcpState::Closing => SocketState::Closing,
        netstat2::TcpState::LastAck => SocketState::LastAck,
        netstat2::TcpState::TimeWait => SocketState::TimeWait,
        netstat2::TcpState::Closed => SocketState::Closed,
        _ => SocketState::Unknown,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_ports() {
        let result = scan_ports();
        assert!(result.is_ok());
        // Should find at least some ports on any system
        let ports = result.unwrap();
        println!("Found {} ports", ports.len());
    }
}
