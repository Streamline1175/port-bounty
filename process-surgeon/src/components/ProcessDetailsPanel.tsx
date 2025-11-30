import { X, Copy, Terminal, Clock, HardDrive, Cpu, User, Network } from 'lucide-react';
import { cn, formatBytes, formatCpu, formatRelativeTime } from '../utils';
import { PortIndicator } from './PortIndicator';
import type { ProcessNode } from '../types';

interface ProcessDetailsPanelProps {
  process: ProcessNode | null;
  onClose: () => void;
  onKill: (force: boolean) => void;
}

export function ProcessDetailsPanel({ process, onClose, onKill }: ProcessDetailsPanelProps) {
  if (!process) return null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white truncate">
          {process.name}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Basic Info */}
        <section>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Process Info
          </h3>
          <div className="space-y-2">
            <InfoRow 
              icon={Terminal} 
              label="PID" 
              value={process.pid.toString()}
              onCopy={() => copyToClipboard(process.pid.toString())}
            />
            <InfoRow 
              icon={User} 
              label="User" 
              value={process.user}
              onCopy={() => copyToClipboard(process.user)}
            />
            <InfoRow 
              icon={HardDrive} 
              label="Memory" 
              value={formatBytes(process.memoryUsage)}
            />
            <InfoRow 
              icon={Cpu} 
              label="CPU" 
              value={formatCpu(process.cpuUsage)}
            />
            {process.startTime && (
              <InfoRow 
                icon={Clock} 
                label="Started" 
                value={formatRelativeTime(process.startTime)}
              />
            )}
          </div>
        </section>

        {/* Command Line */}
        {process.commandLine && (
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Command Line
            </h3>
            <div className="relative group">
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                {process.commandLine}
              </pre>
              <button
                onClick={() => copyToClipboard(process.commandLine || '')}
                className="absolute top-2 right-2 p-1 rounded bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy command"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </section>
        )}

        {/* Executable Path */}
        {process.exePath && (
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Executable Path
            </h3>
            <div className="relative group">
              <p className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg break-all">
                {process.exePath}
              </p>
              <button
                onClick={() => copyToClipboard(process.exePath || '')}
                className="absolute top-2 right-2 p-1 rounded bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy path"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </section>
        )}

        {/* Ports */}
        <section>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Network className="w-4 h-4" />
            Ports ({process.ports.length})
          </h3>
          {process.ports.length > 0 ? (
            <div className="space-y-2">
              {process.ports.map((port, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <PortIndicator
                    port={port.localPort}
                    protocol={port.protocol}
                    state={port.state}
                  />
                  <span className="text-xs text-gray-500">
                    {port.localAddress}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No ports</p>
          )}
        </section>

        {/* Container Info */}
        {process.container && (
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Container
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{process.container.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Image</span>
                <span className="font-mono text-xs truncate max-w-[150px]" title={process.container.image}>
                  {process.container.image}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  process.container.state === 'running' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                )}>
                  {process.container.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-xs">{process.container.id.slice(0, 12)}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={() => onKill(false)}
          disabled={process.isProtected}
          className={cn(
            'w-full py-2 px-4 rounded-lg font-medium transition-colors',
            process.isProtected
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          )}
        >
          Graceful Stop (SIGTERM)
        </button>
        <button
          onClick={() => onKill(true)}
          disabled={process.isProtected}
          className={cn(
            'w-full py-2 px-4 rounded-lg font-medium transition-colors',
            process.isProtected
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          )}
        >
          Force Kill (SIGKILL)
        </button>
        {process.isProtected && (
          <p className="text-xs text-center text-red-500">
            This is a protected system process
          </p>
        )}
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onCopy?: () => void;
}

function InfoRow({ icon: Icon, label, value, onCopy }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-opacity"
            title="Copy"
          >
            <Copy className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
