import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { cn } from '../utils';
import { useStore } from '../store';
import type { ProcessNode } from '../types';

interface PortSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortSearchDialog({ isOpen, onClose }: PortSearchDialogProps) {
  const [port, setPort] = useState('');
  const [results, setResults] = useState<ProcessNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { findPort, setSelectedPid } = useStore();

  useEffect(() => {
    if (isOpen) {
      setPort('');
      setResults([]);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async () => {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setError('Please enter a valid port number (1-65535)');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const found = await findPort(portNum);
      setResults(found);
      if (found.length === 0) {
        setError(`No processes found using port ${portNum}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectProcess = (pid: number) => {
    setSelectedPid(pid);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter port number (e.g., 3000, 8080)"
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400"
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSearch}
            disabled={isSearching || !port}
            className={cn(
              'w-full py-2 px-4 rounded-lg font-medium transition-colors',
              'bg-blue-500 text-white hover:bg-blue-600',
              'disabled:bg-gray-300 disabled:cursor-not-allowed'
            )}
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </span>
            ) : (
              'Find Port Users'
            )}
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-auto">
          {error && (
            <div className="p-4 text-center text-gray-500">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((process) => (
                <button
                  key={process.id}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSelectProcess(process.pid)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {process.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        PID: {process.pid} • User: {process.user}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-blue-500">
                        :{port}
                      </p>
                      <p className="text-xs text-gray-400">
                        {process.ports.length} port{process.ports.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-400 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to search • 
          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded ml-1">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
