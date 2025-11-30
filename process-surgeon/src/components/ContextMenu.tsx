import { useState } from 'react';
import { 
  Copy, 
  Square, 
  Skull, 
  Terminal, 
  Star, 
  StarOff,
  FileJson,
  ClipboardCopy,
  LucideIcon
} from 'lucide-react';
import { cn } from '../utils';
import type { ProcessNode } from '../types';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  action: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

interface ContextMenuProps {
  process: ProcessNode;
  position: { x: number; y: number };
  onClose: () => void;
  onKill: (force: boolean) => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export function ContextMenu({ 
  process, 
  position, 
  onClose, 
  onKill,
  onToggleFavorite,
  isFavorite 
}: ContextMenuProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const menuItems: MenuGroup[] = [
    {
      group: 'copy',
      items: [
        {
          icon: Copy,
          label: 'Copy PID',
          action: () => copyToClipboard(process.pid.toString(), 'PID'),
        },
        {
          icon: Copy,
          label: 'Copy Port',
          action: () => copyToClipboard(
            process.ports.map(p => p.localPort).join(', '), 
            'Port'
          ),
          disabled: process.ports.length === 0,
        },
        {
          icon: ClipboardCopy,
          label: 'Copy Command Line',
          action: () => copyToClipboard(process.commandLine || process.name, 'Command'),
        },
        {
          icon: Terminal,
          label: 'Copy Kill Command',
          action: () => copyToClipboard(`kill -9 ${process.pid}`, 'Kill Command'),
        },
      ],
    },
    {
      group: 'actions',
      items: [
        {
          icon: Square,
          label: 'Graceful Stop (SIGTERM)',
          action: () => { onKill(false); onClose(); },
          disabled: process.isProtected,
          className: 'text-yellow-600',
        },
        {
          icon: Skull,
          label: 'Force Kill (SIGKILL)',
          action: () => { onKill(true); onClose(); },
          disabled: process.isProtected,
          className: 'text-red-600',
        },
      ],
    },
    {
      group: 'favorites',
      items: [
        {
          icon: isFavorite ? StarOff : Star,
          label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
          action: () => { onToggleFavorite(); onClose(); },
          className: isFavorite ? 'text-yellow-500' : '',
        },
      ],
    },
    {
      group: 'export',
      items: [
        {
          icon: FileJson,
          label: 'Copy as JSON',
          action: () => copyToClipboard(JSON.stringify(process, null, 2), 'JSON'),
        },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <div 
        className="fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px]"
        style={{ 
          left: Math.min(position.x, window.innerWidth - 220),
          top: Math.min(position.y, window.innerHeight - 300),
        }}
      >
        {menuItems.map((group, groupIdx) => (
          <div key={group.group}>
            {groupIdx > 0 && (
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
            )}
            {group.items.map((item) => (
              <button
                key={item.label}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  item.className
                )}
                onClick={item.action}
                disabled={item.disabled}
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {copiedItem === item.label.split(' ').pop() && (
                  <span className="text-xs text-green-500">Copied!</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
