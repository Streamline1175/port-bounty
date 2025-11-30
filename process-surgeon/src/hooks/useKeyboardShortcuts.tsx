import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onPortSearch: () => void;
  onRefresh: () => void;
  onKillSelected: () => void;
  onFocusSearch: () => void;
  onToggleDetails: () => void;
  onEscape: () => void;
  onSelectAll: () => void;
  onExport: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onPortSearch,
  onRefresh,
  onKillSelected,
  onFocusSearch,
  onToggleDetails,
  onEscape,
  onSelectAll,
  onExport,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Always handle Escape
    if (e.key === 'Escape') {
      onEscape();
      return;
    }

    // Skip other shortcuts if in input (except with modifier)
    if (isInput && !e.metaKey && !e.ctrlKey) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Cmd/Ctrl + K - Kill selected process
    if (cmdKey && e.key === 'k') {
      e.preventDefault();
      onKillSelected();
      return;
    }

    // Cmd/Ctrl + F - Focus search
    if (cmdKey && e.key === 'f') {
      e.preventDefault();
      onFocusSearch();
      return;
    }

    // Cmd/Ctrl + R - Refresh
    if (cmdKey && e.key === 'r') {
      e.preventDefault();
      onRefresh();
      return;
    }

    // Cmd/Ctrl + A - Select all
    if (cmdKey && e.key === 'a' && !isInput) {
      e.preventDefault();
      onSelectAll();
      return;
    }

    // Cmd/Ctrl + E - Export
    if (cmdKey && e.key === 'e') {
      e.preventDefault();
      onExport();
      return;
    }

    // Cmd/Ctrl + I or Cmd/Ctrl + D - Toggle details panel
    if (cmdKey && (e.key === 'i' || e.key === 'd')) {
      e.preventDefault();
      onToggleDetails();
      return;
    }

    // / (slash) - Quick port search
    if (e.key === '/' && !isInput) {
      e.preventDefault();
      onPortSearch();
      return;
    }

    // P - Port search (alternative)
    if (e.key === 'p' && !isInput && !cmdKey) {
      e.preventDefault();
      onPortSearch();
      return;
    }
  }, [onPortSearch, onRefresh, onKillSelected, onFocusSearch, onToggleDetails, onEscape, onSelectAll, onExport]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Component to display keyboard shortcuts help
export function KeyboardShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: [cmdKey, 'K'], description: 'Kill selected process' },
    { keys: [cmdKey, 'F'], description: 'Focus search' },
    { keys: [cmdKey, 'R'], description: 'Refresh process list' },
    { keys: [cmdKey, 'A'], description: 'Select all processes' },
    { keys: [cmdKey, 'E'], description: 'Export process list' },
    { keys: [cmdKey, 'I'], description: 'Toggle details panel' },
    { keys: ['/'], description: 'Quick port search' },
    { keys: ['Esc'], description: 'Close dialogs / Deselect' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <span key={keyIdx}>
                    <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                      {key}
                    </kbd>
                    {keyIdx < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-gray-400">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
