// Zustand store for application state management
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { ProcessNode, AppState, KillResult, FilterOptions, SortOptions, ContainerAction, AppError } from '../types';
import type { HistoryEntry } from '../components/HistoryPanel';

interface StoreState {
  // Data
  processes: ProcessNode[];
  totalConnections: number;
  listeningPorts: number;
  dockerAvailable: boolean;
  lastUpdated: Date | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedPid: number | null;
  selectedPids: Set<number>; // Multi-select
  filterOptions: FilterOptions;
  sortOptions: SortOptions;
  
  // Favorites (persisted)
  favoritePorts: number[];
  
  // History
  history: HistoryEntry[];
  
  // Polling
  pollingInterval: number;
  isPolling: boolean;
  
  // Panel states
  showDetailsPanel: boolean;
  
  // Actions
  fetchProcesses: () => Promise<void>;
  findPort: (port: number) => Promise<ProcessNode[]>;
  killProcess: (pid: number, force: boolean) => Promise<KillResult>;
  containerAction: (containerId: string, action: ContainerAction) => Promise<KillResult>;
  setSelectedPid: (pid: number | null) => void;
  toggleSelectedPid: (pid: number) => void;
  selectAllPids: () => void;
  clearSelectedPids: () => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  setSortOptions: (options: Partial<SortOptions>) => void;
  startPolling: () => void;
  stopPolling: () => void;
  setPollingInterval: (ms: number) => void;
  
  // Favorites
  addFavoritePort: (port: number) => void;
  removeFavoritePort: (port: number) => void;
  toggleFavoritePort: (port: number) => void;
  
  // History
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  // Panels
  setShowDetailsPanel: (show: boolean) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial data state
  processes: [],
  totalConnections: 0,
  listeningPorts: 0,
  dockerAvailable: false,
  lastUpdated: null,
  
  // Initial UI state
  isLoading: false,
  error: null,
  selectedPid: null,
  selectedPids: new Set(),
  filterOptions: {
    showAllConnections: false,
    searchQuery: '',
    selectedProtocol: 'all',
    selectedState: 'all',
  },
  sortOptions: {
    field: 'port',
    direction: 'asc',
  },
  
  // Favorites (load from localStorage)
  favoritePorts: JSON.parse(localStorage.getItem('favoritePorts') || '[]'),
  
  // History
  history: [],
  
  // Polling state
  pollingInterval: 2000,
  isPolling: false,
  
  // Panel states
  showDetailsPanel: false,
  
  // Actions
  fetchProcesses: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { filterOptions } = get();
      const result = await invoke<AppState>('get_processes', {
        showAllConnections: filterOptions.showAllConnections,
      });
      
      set({
        processes: result.processes,
        totalConnections: result.totalConnections,
        listeningPorts: result.listeningPorts,
        dockerAvailable: result.dockerAvailable,
        lastUpdated: new Date(result.lastUpdated),
        isLoading: false,
      });
    } catch (err) {
      const error = err as AppError;
      set({ 
        error: error.message || 'Failed to fetch processes',
        isLoading: false,
      });
    }
  },
  
  findPort: async (port: number) => {
    try {
      const result = await invoke<ProcessNode[]>('find_port', { port });
      return result;
    } catch (err) {
      const error = err as AppError;
      throw new Error(error.message || 'Failed to find port');
    }
  },
  
  killProcess: async (pid: number, force: boolean) => {
    // Find process info for history
    const process = get().processes.find(p => p.pid === pid);
    
    try {
      const result = await invoke<KillResult>('kill_process', { pid, force });
      
      // Add to history
      get().addHistoryEntry({
        action: force ? 'force_kill' : 'kill',
        processName: process?.name || 'Unknown',
        pid,
        port: process?.ports[0]?.localPort,
        success: result.success,
        message: result.message,
      });
      
      // Refresh processes after kill
      if (result.success) {
        setTimeout(() => get().fetchProcesses(), 500);
      }
      
      return result;
    } catch (err) {
      const error = err as AppError;
      
      // Add failure to history
      get().addHistoryEntry({
        action: force ? 'force_kill' : 'kill',
        processName: process?.name || 'Unknown',
        pid,
        port: process?.ports[0]?.localPort,
        success: false,
        message: error.message || 'Failed to kill process',
      });
      
      return {
        success: false,
        message: error.message || 'Failed to kill process',
        requiredElevation: false,
      };
    }
  },
  
  containerAction: async (containerId: string, action: ContainerAction) => {
    // Find process info for history
    const process = get().processes.find(p => p.container?.id === containerId);
    
    try {
      const result = await invoke<KillResult>('container_action', { containerId, action });
      
      // Add to history
      get().addHistoryEntry({
        action: action === 'stop' ? 'container_stop' : 'container_kill',
        processName: process?.container?.name || containerId.slice(0, 12),
        pid: process?.pid || 0,
        port: process?.ports[0]?.localPort,
        success: result.success,
        message: result.message,
      });
      
      // Refresh processes after action
      if (result.success) {
        setTimeout(() => get().fetchProcesses(), 1000);
      }
      
      return result;
    } catch (err) {
      const error = err as AppError;
      
      // Add failure to history
      get().addHistoryEntry({
        action: action === 'stop' ? 'container_stop' : 'container_kill',
        processName: process?.container?.name || containerId.slice(0, 12),
        pid: process?.pid || 0,
        port: process?.ports[0]?.localPort,
        success: false,
        message: error.message || 'Failed to execute container action',
      });
      
      return {
        success: false,
        message: error.message || 'Failed to execute container action',
        requiredElevation: false,
      };
    }
  },
  
  setSelectedPid: (pid) => set({ selectedPid: pid }),
  
  toggleSelectedPid: (pid) => set((state) => {
    const newSelected = new Set(state.selectedPids);
    if (newSelected.has(pid)) {
      newSelected.delete(pid);
    } else {
      newSelected.add(pid);
    }
    return { selectedPids: newSelected };
  }),
  
  selectAllPids: () => set((state) => ({
    selectedPids: new Set(state.processes.map(p => p.pid))
  })),
  
  clearSelectedPids: () => set({ selectedPids: new Set() }),
  
  setFilterOptions: (options) => set((state) => ({
    filterOptions: { ...state.filterOptions, ...options },
  })),
  
  setSortOptions: (options) => set((state) => ({
    sortOptions: { ...state.sortOptions, ...options },
  })),
  
  startPolling: () => {
    const { isPolling, pollingInterval, fetchProcesses } = get();
    
    if (isPolling) return;
    
    set({ isPolling: true });
    
    const poll = async () => {
      if (get().isPolling) {
        await fetchProcesses();
        setTimeout(poll, pollingInterval);
      }
    };
    
    poll();
  },
  
  stopPolling: () => {
    set({ isPolling: false });
  },
  
  setPollingInterval: (ms) => set({ pollingInterval: ms }),
  
  // Favorites
  addFavoritePort: (port) => {
    set((state) => {
      const newFavorites = [...state.favoritePorts, port];
      localStorage.setItem('favoritePorts', JSON.stringify(newFavorites));
      return { favoritePorts: newFavorites };
    });
  },
  
  removeFavoritePort: (port) => {
    set((state) => {
      const newFavorites = state.favoritePorts.filter(p => p !== port);
      localStorage.setItem('favoritePorts', JSON.stringify(newFavorites));
      return { favoritePorts: newFavorites };
    });
  },
  
  toggleFavoritePort: (port) => {
    const { favoritePorts, addFavoritePort, removeFavoritePort } = get();
    if (favoritePorts.includes(port)) {
      removeFavoritePort(port);
    } else {
      addFavoritePort(port);
    }
  },
  
  // History
  addHistoryEntry: (entry) => {
    set((state) => ({
      history: [{
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      }, ...state.history].slice(0, 100) // Keep last 100 entries
    }));
  },
  
  clearHistory: () => set({ history: [] }),
  
  // Panels
  setShowDetailsPanel: (show) => set({ showDetailsPanel: show }),
}));
