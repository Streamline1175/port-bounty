import { X, Trash2, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../utils';

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: 'kill' | 'force_kill' | 'container_stop' | 'container_kill';
  processName: string;
  pid: number;
  port?: number;
  success: boolean;
  message: string;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
}

export function HistoryPanel({ isOpen, onClose, history, onClearHistory }: HistoryPanelProps) {
  if (!isOpen) return null;

  const actionLabels: Record<HistoryEntry['action'], string> = {
    kill: 'Graceful Stop',
    force_kill: 'Force Kill',
    container_stop: 'Container Stop',
    container_kill: 'Container Kill',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Action History</h2>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No actions recorded yet</p>
              <p className="text-sm mt-1">Kill actions will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{entry.processName}</span>
                        <span className="text-xs text-gray-500">PID: {entry.pid}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          entry.action.includes('force') || entry.action.includes('kill')
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        )}>
                          {actionLabels[entry.action]}
                        </span>
                        {entry.port && (
                          <span className="text-xs text-gray-500">Port: {entry.port}</span>
                        )}
                      </div>
                      {!entry.success && (
                        <p className="text-xs text-red-500 mt-1">{entry.message}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
          {history.length} action{history.length !== 1 ? 's' : ''} recorded this session
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
