import { memo, useCallback, useState } from 'react';
import { 
  Square, 
  Skull, 
  Shield, 
  Box, 
  ChevronDown, 
  ChevronRight,
  Terminal,
  User,
  HardDrive,
  Cpu,
  Star,
  Info
} from 'lucide-react';
import { cn, formatBytes, formatCpu, truncate } from '../utils';
import { PortIndicator } from './PortIndicator';
import { ContextMenu } from './ContextMenu';
import { useStore } from '../store';
import type { ProcessNode } from '../types';

interface ProcessRowProps {
  process: ProcessNode;
  expanded: boolean;
  onToggleExpand: () => void;
  isFavorite?: boolean;
}

export const ProcessRow = memo(function ProcessRow({ process, expanded, onToggleExpand, isFavorite = false }: ProcessRowProps) {
  const [isKilling, setIsKilling] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const { 
    killProcess, 
    containerAction, 
    selectedPid, 
    setSelectedPid, 
    toggleFavoritePort,
    setShowDetailsPanel
  } = useStore();

  const handleKill = useCallback(async (force: boolean) => {
    setIsKilling(true);
    try {
      const result = await killProcess(process.pid, force);
      if (!result.success) {
        alert(result.message);
      }
    } finally {
      setIsKilling(false);
    }
  }, [process.pid, killProcess]);

  const handleContainerAction = useCallback(async (action: 'stop' | 'kill' | 'remove') => {
    if (!process.container) return;
    setIsKilling(true);
    try {
      const result = await containerAction(process.container.id, action);
      if (!result.success) {
        alert(result.message);
      }
    } finally {
      setIsKilling(false);
    }
  }, [process.container, containerAction]);

  const isSelected = selectedPid === process.pid;
  const hasMultiplePorts = process.ports.length > 1;
  const firstPort = process.ports[0];

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleToggleFavorite = () => {
    if (firstPort) {
      toggleFavoritePort(firstPort.localPort);
    }
  };

  const handleShowDetails = () => {
    setSelectedPid(process.pid);
    setShowDetailsPanel(true);
  };

  return (
    <div
      className={cn(
        'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20',
        isKilling && 'opacity-50',
        process.isProtected && 'bg-red-50/30 dark:bg-red-900/10'
      )}
      onClick={() => setSelectedPid(isSelected ? null : process.pid)}
      onContextMenu={handleContextMenu}
    >
      {/* Main Row - Grid Layout matching header */}
      <div className="grid grid-cols-[2rem_1.25rem_1fr_8rem_5rem_4rem_6rem_6rem] gap-4 items-center px-4 py-3">
        {/* Expand Button */}
        <button
          className={cn(
            'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
            !hasMultiplePorts && 'invisible'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Icon */}
        <div className="flex-shrink-0 relative">
          {isFavorite && (
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 absolute -top-1 -right-1" />
          )}
          {process.isDockerProxy || process.container ? (
            <Box className="w-5 h-5 text-blue-500" />
          ) : process.isProtected ? (
            <Shield className="w-5 h-5 text-red-500" />
          ) : (
            <Terminal className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {/* Process Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white truncate">
              {process.container?.name || process.name}
            </span>
            <span className="text-xs text-gray-500 font-mono flex-shrink-0">
              PID: {process.pid}
            </span>
            {process.isProtected && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex-shrink-0">
                Protected
              </span>
            )}
            {process.container && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">
                Container
              </span>
            )}
          </div>
          
          {process.commandLine && (
            <p className="text-xs text-gray-500 truncate mt-0.5" title={process.commandLine}>
              {truncate(process.commandLine, 60)}
            </p>
          )}
        </div>

        {/* Port Badge */}
        <div className="flex items-center gap-1">
          {firstPort && (
            <PortIndicator
              port={firstPort.localPort}
              protocol={firstPort.protocol}
              state={firstPort.state}
            />
          )}
          {hasMultiplePorts && (
            <span className="text-xs text-gray-500">
              +{process.ports.length - 1}
            </span>
          )}
        </div>

        {/* Memory */}
        <div className="hidden md:flex items-center gap-1 text-xs text-gray-500" title="Memory">
          <HardDrive className="w-3 h-3" />
          {formatBytes(process.memoryUsage)}
        </div>

        {/* CPU */}
        <div className="hidden md:flex items-center gap-1 text-xs text-gray-500" title="CPU">
          <Cpu className="w-3 h-3" />
          {formatCpu(process.cpuUsage)}
        </div>

        {/* User */}
        <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 truncate" title="User">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{truncate(process.user, 8)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Info Button */}
          <button
            className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleShowDetails();
            }}
            title="Show Details"
          >
            <Info className="w-4 h-4" />
          </button>
          
          {process.container ? (
            <>
              <button
                className="p-1.5 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContainerAction('stop');
                }}
                disabled={isKilling}
                title="Stop Container"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContainerAction('kill');
                }}
                disabled={isKilling}
                title="Force Kill Container"
              >
                <Skull className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                className={cn(
                  'p-1.5 rounded transition-colors disabled:opacity-50',
                  process.isProtected 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleKill(false);
                }}
                disabled={isKilling || process.isProtected}
                title={process.isProtected ? 'Cannot terminate protected process' : 'Graceful Stop (SIGTERM)'}
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                className={cn(
                  'p-1.5 rounded transition-colors disabled:opacity-50',
                  process.isProtected 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleKill(true);
                }}
                disabled={isKilling || process.isProtected}
                title={process.isProtected ? 'Cannot terminate protected process' : 'Force Kill (SIGKILL)'}
              >
                <Skull className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded Details - Pushes content below */}
      {expanded && hasMultiplePorts && (
        <div className="px-4 pb-3 ml-[calc(2rem+1.25rem+2rem)] border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          <p className="text-xs text-gray-500 font-medium pt-2 pb-1">All Ports:</p>
          <div className="flex flex-wrap gap-2">
            {process.ports.map((port, idx) => (
              <PortIndicator
                key={idx}
                port={port.localPort}
                protocol={port.protocol}
                state={port.state}
                size="sm"
              />
            ))}
          </div>
          
          {process.container && (
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <p><span className="font-medium">Image:</span> {process.container.image}</p>
              <p><span className="font-medium">Status:</span> {process.container.status}</p>
              <p><span className="font-medium">Container ID:</span> {truncate(process.container.id, 12)}</p>
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          process={process}
          position={contextMenu}
          onClose={closeContextMenu}
          onKill={handleKill}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
        />
      )}
    </div>
  );
});
