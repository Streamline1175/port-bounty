import { cn, getStateColor } from '../utils';
import type { SocketState, Protocol } from '../types';

interface PortIndicatorProps {
  port: number;
  protocol: Protocol;
  state: SocketState;
  size?: 'sm' | 'md' | 'lg';
}

export function PortIndicator({ port, protocol, state, size = 'md' }: PortIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center rounded font-mono font-medium',
          'bg-gray-800 text-white',
          sizeClasses[size]
        )}
      >
        {port}
      </span>
      <span
        className={cn(
          'inline-flex items-center rounded-full uppercase text-[10px] font-bold px-1.5 py-0.5',
          protocol === 'tcp' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        )}
      >
        {protocol}
      </span>
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          getStateColor(state)
        )}
        title={state}
      />
    </div>
  );
}
