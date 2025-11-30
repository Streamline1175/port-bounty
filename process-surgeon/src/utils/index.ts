import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with Tailwind CSS merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format bytes to human readable
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format date relative to now
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'Unknown';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// Format CPU percentage
export function formatCpu(cpu: number): string {
  return `${cpu.toFixed(1)}%`;
}

// Truncate string with ellipsis
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Get color for socket state
export function getStateColor(state: string): string {
  switch (state) {
    case 'LISTENING':
      return 'bg-green-500';
    case 'ESTABLISHED':
      return 'bg-blue-500';
    case 'TIME_WAIT':
    case 'CLOSE_WAIT':
      return 'bg-gray-400';
    case 'SYN_SENT':
    case 'SYN_RECEIVED':
      return 'bg-yellow-500';
    case 'FIN_WAIT_1':
    case 'FIN_WAIT_2':
    case 'CLOSING':
    case 'LAST_ACK':
      return 'bg-orange-500';
    case 'CLOSED':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

// Get human readable state name
export function getStateName(state: string): string {
  return state.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
