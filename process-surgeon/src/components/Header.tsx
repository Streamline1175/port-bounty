import { useState, useRef } from 'react';
import { 
  Search, 
  RefreshCw, 
  Filter, 
  ArrowUpDown,
  Pause,
  Play,
  Box,
  Clock,
  Star,
  Download,
  Keyboard,
  Settings,
  Hash
} from 'lucide-react';
import { cn } from '../utils';
import { useStore } from '../store';

interface HeaderProps {
  onOpenPortSearch: () => void;
  onOpenHistory: () => void;
  onOpenFavorites: () => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function Header({ 
  onOpenPortSearch, 
  onOpenHistory, 
  onOpenFavorites, 
  onOpenExport,
  onOpenShortcuts,
  searchInputRef
}: HeaderProps) {
  const {
    totalConnections,
    listeningPorts,
    dockerAvailable,
    lastUpdated,
    isLoading,
    isPolling,
    pollingInterval,
    filterOptions,
    sortOptions,
    history,
    fetchProcesses,
    setFilterOptions,
    setSortOptions,
    startPolling,
    stopPolling,
    setPollingInterval,
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const localSearchRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localSearchRef;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Main Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PS</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Process Surgeon
            </h1>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 ml-6 text-sm text-gray-500">
            <span>
              <strong className="text-gray-900 dark:text-white">{listeningPorts}</strong> listening
            </span>
            <span>
              <strong className="text-gray-900 dark:text-white">{totalConnections}</strong> total
            </span>
            {dockerAvailable && (
              <span className="flex items-center gap-1 text-blue-500">
                <Box className="w-4 h-4" />
                Docker
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Port Search */}
          <button
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={onOpenPortSearch}
            title="Search by port (Press /)"
          >
            <Hash className="w-4 h-4" />
          </button>

          {/* History */}
          <button
            className={cn(
              'p-2 rounded-lg transition-colors relative',
              history.length > 0
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
            onClick={onOpenHistory}
            title="Action history"
          >
            <Clock className="w-4 h-4" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {history.length > 9 ? '9+' : history.length}
              </span>
            )}
          </button>

          {/* Favorites */}
          <button
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={onOpenFavorites}
            title="Favorite ports"
          >
            <Star className="w-4 h-4" />
          </button>

          {/* Export */}
          <button
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={onOpenExport}
            title="Export processes"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Polling Toggle */}
          <button
            className={cn(
              'p-2 rounded-lg transition-colors',
              isPolling 
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
            onClick={() => isPolling ? stopPolling() : startPolling()}
            title={isPolling ? 'Stop auto-refresh' : 'Start auto-refresh'}
          >
            {isPolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Manual Refresh */}
          <button
            className={cn(
              'p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700',
              isLoading && 'animate-spin'
            )}
            onClick={fetchProcesses}
            disabled={isLoading}
            title="Refresh now (⌘R)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Filter Toggle */}
          <button
            className={cn(
              'p-2 rounded-lg transition-colors',
              showFilters || filterOptions.searchQuery || filterOptions.selectedProtocol !== 'all' || filterOptions.selectedState !== 'all'
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters (⌘F)"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            className={cn(
              'p-2 rounded-lg transition-colors',
              showSettings
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Keyboard Shortcuts */}
          <button
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Bar */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Refresh interval:</span>
            <select
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
            >
              <option value={1000}>1 second</option>
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
          </label>
        </div>
      )}

      {/* Filter Bar */}
      {showFilters && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name, port, PID, or user..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterOptions.searchQuery}
              onChange={(e) => setFilterOptions({ searchQuery: e.target.value })}
            />
          </div>

          {/* Protocol Filter */}
          <select
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterOptions.selectedProtocol}
            onChange={(e) => setFilterOptions({ selectedProtocol: e.target.value as any })}
          >
            <option value="all">All Protocols</option>
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
          </select>

          {/* State Filter */}
          <select
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterOptions.selectedState}
            onChange={(e) => setFilterOptions({ selectedState: e.target.value as any })}
          >
            <option value="all">All States</option>
            <option value="LISTENING">Listening</option>
            <option value="ESTABLISHED">Established</option>
            <option value="TIME_WAIT">Time Wait</option>
            <option value="CLOSE_WAIT">Close Wait</option>
          </select>

          {/* Show All Toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={filterOptions.showAllConnections}
              onChange={(e) => setFilterOptions({ showAllConnections: e.target.checked })}
            />
            Show all connections
          </label>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={`${sortOptions.field}-${sortOptions.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortOptions({ field: field as any, direction: direction as any });
              }}
            >
              <option value="port-asc">Port (Low to High)</option>
              <option value="port-desc">Port (High to Low)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="pid-asc">PID (Low to High)</option>
              <option value="pid-desc">PID (High to Low)</option>
              <option value="memory-desc">Memory (High to Low)</option>
              <option value="cpu-desc">CPU (High to Low)</option>
            </select>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="px-4 py-1 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <span className="text-gray-300">Press <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> for shortcuts</span>
        </div>
      )}
    </header>
  );
}
