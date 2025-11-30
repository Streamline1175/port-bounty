// Type definitions matching Rust models

export type Protocol = 'tcp' | 'udp';

export type SocketState = 
  | 'LISTENING'
  | 'ESTABLISHED'
  | 'SYN_SENT'
  | 'SYN_RECEIVED'
  | 'FIN_WAIT_1'
  | 'FIN_WAIT_2'
  | 'CLOSE_WAIT'
  | 'CLOSING'
  | 'LAST_ACK'
  | 'TIME_WAIT'
  | 'CLOSED'
  | 'UNKNOWN';

export type ContainerRuntime = 'docker' | 'podman' | 'containerd' | 'unknown';

export type ContainerAction = 'stop' | 'kill' | 'remove' | 'restart';

export interface PortEntry {
  protocol: Protocol;
  localAddress: string;
  localPort: number;
  remoteAddress: string | null;
  remotePort: number | null;
  state: SocketState;
}

export interface ContainerPort {
  hostPort: number;
  containerPort: number;
  protocol: Protocol;
  hostIp: string | null;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  runtime: ContainerRuntime;
  ports: ContainerPort[];
}

export interface ProcessNode {
  id: string;
  pid: number;
  name: string;
  exePath: string | null;
  commandLine: string | null;
  user: string;
  memoryUsage: number;
  cpuUsage: number;
  startTime: string | null;
  ports: PortEntry[];
  isDockerProxy: boolean;
  container: ContainerInfo | null;
  isProtected: boolean;
}

export interface AppState {
  processes: ProcessNode[];
  totalConnections: number;
  listeningPorts: number;
  dockerAvailable: boolean;
  lastUpdated: string;
}

export interface KillResult {
  success: boolean;
  message: string;
  requiredElevation: boolean;
}

export interface AppError {
  code: string;
  message: string;
  details: string | null;
}

// UI specific types
export interface FilterOptions {
  showAllConnections: boolean;
  searchQuery: string;
  selectedProtocol: Protocol | 'all';
  selectedState: SocketState | 'all';
}

export interface SortOptions {
  field: 'pid' | 'name' | 'port' | 'memory' | 'cpu' | 'user';
  direction: 'asc' | 'desc';
}
