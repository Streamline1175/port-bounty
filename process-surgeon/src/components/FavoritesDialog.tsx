import { X, Star, Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils';

interface FavoritesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: number[];
  onAddFavorite: (port: number) => void;
  onRemoveFavorite: (port: number) => void;
}

const COMMON_PORTS = [
  { port: 80, name: 'HTTP' },
  { port: 443, name: 'HTTPS' },
  { port: 3000, name: 'Dev Server' },
  { port: 3001, name: 'Alt Dev' },
  { port: 4200, name: 'Angular' },
  { port: 5000, name: 'Flask/API' },
  { port: 5173, name: 'Vite' },
  { port: 5432, name: 'PostgreSQL' },
  { port: 6379, name: 'Redis' },
  { port: 8000, name: 'Django' },
  { port: 8080, name: 'Alt HTTP' },
  { port: 8888, name: 'Jupyter' },
  { port: 9000, name: 'PHP-FPM' },
  { port: 27017, name: 'MongoDB' },
];

export function FavoritesDialog({ 
  isOpen, 
  onClose, 
  favorites, 
  onAddFavorite, 
  onRemoveFavorite 
}: FavoritesDialogProps) {
  const [customPort, setCustomPort] = useState('');

  if (!isOpen) return null;

  const handleAddCustom = () => {
    const port = parseInt(customPort, 10);
    if (port >= 1 && port <= 65535 && !favorites.includes(port)) {
      onAddFavorite(port);
      setCustomPort('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Favorite Ports</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Add Custom Port */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Add Custom Port
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Port number"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customPort}
              onChange={(e) => setCustomPort(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            />
            <button
              onClick={handleAddCustom}
              disabled={!customPort || parseInt(customPort) < 1 || parseInt(customPort) > 65535}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Favorites */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Your Favorites ({favorites.length})
          </label>
          {favorites.length === 0 ? (
            <p className="text-sm text-gray-500">No favorites yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favorites.map((port) => (
                <span
                  key={port}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                >
                  <Star className="w-3 h-3" />
                  {port}
                  <button
                    onClick={() => onRemoveFavorite(port)}
                    className="ml-1 p-0.5 hover:bg-yellow-200 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add Common Ports */}
        <div className="flex-1 overflow-auto p-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Quick Add Common Ports
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COMMON_PORTS.map(({ port, name }) => {
              const isFavorite = favorites.includes(port);
              return (
                <button
                  key={port}
                  onClick={() => isFavorite ? onRemoveFavorite(port) : onAddFavorite(port)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    isFavorite
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  )}
                >
                  <span className="font-mono">{port}</span>
                  <span className="text-xs text-gray-500">{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
          Favorite ports will be pinned to the top of the list
        </div>
      </div>
    </div>
  );
}
