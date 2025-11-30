import { useEffect, useState, useRef, useCallback } from "react";
import { 
  Header, 
  ProcessTable, 
  PortSearchDialog, 
  ProcessDetailsPanel,
  HistoryPanel,
  ExportDialog,
  FavoritesDialog
} from "./components";
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from "./hooks/useKeyboardShortcuts";
import { useStore } from "./store";
import "./App.css";

function App() {
  const { 
    fetchProcesses, 
    startPolling, 
    error,
    processes,
    selectedPid,
    setSelectedPid,
    killProcess,
    history,
    clearHistory,
    favoritePorts,
    addFavoritePort,
    removeFavoritePort,
    selectAllPids,
    showDetailsPanel,
    setShowDetailsPanel,
  } = useStore();

  // Dialog states
  const [showPortSearch, setShowPortSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected process for details panel
  const selectedProcess = selectedPid 
    ? processes.find(p => p.pid === selectedPid) || null 
    : null;

  // Handle kill from details panel
  const handleKillFromPanel = useCallback(async (force: boolean) => {
    if (selectedPid) {
      const result = await killProcess(selectedPid, force);
      if (result.success) {
        setSelectedPid(null);
      } else {
        alert(result.message);
      }
    }
  }, [selectedPid, killProcess, setSelectedPid]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPortSearch: () => setShowPortSearch(true),
    onRefresh: () => fetchProcesses(),
    onKillSelected: () => {
      if (selectedPid) {
        handleKillFromPanel(false);
      }
    },
    onFocusSearch: () => {
      searchInputRef.current?.focus();
    },
    onToggleDetails: () => {
      if (selectedPid) {
        setShowDetailsPanel(!showDetailsPanel);
      }
    },
    onEscape: () => {
      if (showPortSearch) setShowPortSearch(false);
      else if (showHistory) setShowHistory(false);
      else if (showExport) setShowExport(false);
      else if (showFavorites) setShowFavorites(false);
      else if (showShortcuts) setShowShortcuts(false);
      else if (showDetailsPanel) setShowDetailsPanel(false);
      else setSelectedPid(null);
    },
    onSelectAll: () => selectAllPids(),
    onExport: () => setShowExport(true),
  });

  // Also handle ? key for shortcuts
  useEffect(() => {
    const handleQuestionMark = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setShowShortcuts(true);
        }
      }
    };
    window.addEventListener('keydown', handleQuestionMark);
    return () => window.removeEventListener('keydown', handleQuestionMark);
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchProcesses();
    
    // Start polling after initial fetch
    const timer = setTimeout(() => {
      startPolling();
    }, 1000);

    return () => clearTimeout(timer);
  }, [fetchProcesses, startPolling]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-950">
      <Header 
        onOpenPortSearch={() => setShowPortSearch(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenFavorites={() => setShowFavorites(true)}
        onOpenExport={() => setShowExport(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        searchInputRef={searchInputRef}
      />
      
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <ProcessTable />
        </div>

        {/* Details Panel */}
        {showDetailsPanel && selectedProcess && (
          <ProcessDetailsPanel
            process={selectedProcess}
            onClose={() => setShowDetailsPanel(false)}
            onKill={handleKillFromPanel}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex items-center justify-between">
        <span>Process Surgeon v0.1.0</span>
        <div className="flex items-center gap-4">
          <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">/</kbd> to search ports</span>
          <span>Cross-platform port management utility</span>
        </div>
      </footer>

      {/* Dialogs */}
      <PortSearchDialog 
        isOpen={showPortSearch} 
        onClose={() => setShowPortSearch(false)} 
      />
      
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onClearHistory={clearHistory}
      />
      
      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        processes={processes}
      />
      
      <FavoritesDialog
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        favorites={favoritePorts}
        onAddFavorite={addFavoritePort}
        onRemoveFavorite={removeFavoritePort}
      />
      
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}

export default App;
