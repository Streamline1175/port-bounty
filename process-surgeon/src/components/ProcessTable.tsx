import { useMemo, useRef, useState, useCallback } from 'react';
import { ProcessRow } from './ProcessRow';
import { useStore } from '../store';

export function ProcessTable() {
  const { processes, filterOptions, sortOptions, favoritePorts } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedPids, setExpandedPids] = useState<Set<number>>(new Set());

  const toggleExpanded = useCallback((pid: number) => {
    setExpandedPids(prev => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  }, []);

  // Filter processes
  const filteredProcesses = useMemo(() => {
    let result = [...processes];

    // Search filter
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.pid.toString().includes(query) ||
        p.user.toLowerCase().includes(query) ||
        p.commandLine?.toLowerCase().includes(query) ||
        p.container?.name.toLowerCase().includes(query) ||
        p.ports.some(port => port.localPort.toString().includes(query))
      );
    }

    // Protocol filter
    if (filterOptions.selectedProtocol !== 'all') {
      result = result.filter(p => 
        p.ports.some(port => port.protocol === filterOptions.selectedProtocol)
      );
    }

    // State filter
    if (filterOptions.selectedState !== 'all') {
      result = result.filter(p => 
        p.ports.some(port => port.state === filterOptions.selectedState)
      );
    }

    return result;
  }, [processes, filterOptions]);

  // Sort processes (favorites pinned to top)
  const sortedProcesses = useMemo(() => {
    const sorted = [...filteredProcesses];

    // Helper to check if process has a favorite port
    const hasFavoritePort = (p: typeof sorted[0]) => 
      p.ports.some(port => favoritePorts.includes(port.localPort));

    sorted.sort((a, b) => {
      // First, sort by favorite status (favorites first)
      const aFav = hasFavoritePort(a);
      const bFav = hasFavoritePort(b);
      if (aFav !== bFav) {
        return aFav ? -1 : 1;
      }

      // Then sort by the selected field
      let comparison = 0;

      switch (sortOptions.field) {
        case 'pid':
          comparison = a.pid - b.pid;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'port':
          const aPort = a.ports[0]?.localPort ?? 0;
          const bPort = b.ports[0]?.localPort ?? 0;
          comparison = aPort - bPort;
          break;
        case 'memory':
          comparison = a.memoryUsage - b.memoryUsage;
          break;
        case 'cpu':
          comparison = a.cpuUsage - b.cpuUsage;
          break;
        case 'user':
          comparison = a.user.localeCompare(b.user);
          break;
      }

      return sortOptions.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredProcesses, sortOptions, favoritePorts]);

  if (sortedProcesses.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg">No processes found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1.25rem_1fr_8rem_5rem_4rem_6rem_6rem] gap-4 items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div></div>
        <div></div>
        <div>Process</div>
        <div>Port</div>
        <div className="hidden md:block">Memory</div>
        <div className="hidden md:block">CPU</div>
        <div className="hidden md:block">User</div>
        <div>Actions</div>
      </div>

      {/* Scrollable List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        {sortedProcesses.map((process) => (
          <ProcessRow
            key={process.id}
            process={process}
            expanded={expandedPids.has(process.pid)}
            onToggleExpand={() => toggleExpanded(process.pid)}
            isFavorite={process.ports.some(port => favoritePorts.includes(port.localPort))}
          />
        ))}
      </div>
    </div>
  );
}
