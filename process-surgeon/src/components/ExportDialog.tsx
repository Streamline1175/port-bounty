import { X, Download, FileJson, FileSpreadsheet, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils';
import type { ProcessNode } from '../types';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  processes: ProcessNode[];
}

export function ExportDialog({ isOpen, onClose, processes }: ExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  if (!isOpen) return null;

  const generateJSON = () => {
    const data = processes.map(p => ({
      pid: p.pid,
      name: p.name,
      user: p.user,
      commandLine: p.commandLine,
      memoryUsage: p.memoryUsage,
      cpuUsage: p.cpuUsage,
      ports: p.ports.map(port => ({
        port: port.localPort,
        protocol: port.protocol,
        state: port.state,
        address: port.localAddress,
      })),
      container: p.container ? {
        name: p.container.name,
        image: p.container.image,
        id: p.container.id,
      } : null,
    }));
    return JSON.stringify(data, null, 2);
  };

  const generateCSV = () => {
    const headers = ['PID', 'Name', 'User', 'Port', 'Protocol', 'State', 'Memory (bytes)', 'CPU %', 'Container'];
    const rows = processes.flatMap(p => {
      if (p.ports.length === 0) {
        return [[
          p.pid,
          p.name,
          p.user,
          '',
          '',
          '',
          p.memoryUsage,
          p.cpuUsage.toFixed(1),
          p.container?.name || '',
        ]];
      }
      return p.ports.map(port => [
        p.pid,
        p.name,
        p.user,
        port.localPort,
        port.protocol.toUpperCase(),
        port.state,
        p.memoryUsage,
        p.cpuUsage.toFixed(1),
        p.container?.name || '',
      ]);
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const getContent = () => format === 'json' ? generateJSON() : generateCSV();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const content = getContent();
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const extension = format === 'json' ? 'json' : 'csv';
    const filename = `process-surgeon-export-${new Date().toISOString().split('T')[0]}.${extension}`;
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Export Processes</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('json')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                format === 'json'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
              )}
            >
              <FileJson className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => setFormat('csv')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                format === 'csv'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
              )}
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {processes.length} process{processes.length !== 1 ? 'es' : ''} will be exported
          </p>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[300px] whitespace-pre-wrap">
            {getContent().slice(0, 2000)}
            {getContent().length > 2000 && '\n... (truncated preview)'}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
