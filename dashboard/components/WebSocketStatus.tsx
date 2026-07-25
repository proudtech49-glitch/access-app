'use client';

import { useAppStore } from '@/store';
import { Activity } from 'lucide-react';
import { clsx } from 'clsx';

export function WebSocketStatus() {
  const status = useAppStore((state) => state.status);

  const colors = {
    connected: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
    connecting: 'bg-yellow-500 shadow-[0_0_8px_#eab308]',
    disconnected: 'bg-zinc-500',
    error: 'bg-red-500 shadow-[0_0_8px_#ef4444]'
  };

  return (
    <div className="flex items-center gap-2 ml-4 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-medium tracking-wider uppercase">
      <div className={clsx("w-2 h-2 rounded-full animate-pulse", colors[status])} />
      <span className={clsx(
        status === 'connected' && "text-emerald-500",
        status === 'connecting' && "text-yellow-500",
        status === 'error' && "text-red-500",
        status === 'disconnected' && "text-zinc-500",
      )}>
        {status}
      </span>
      {status === 'connected' && <Activity className="w-3 h-3 text-emerald-500 ml-1" />}
    </div>
  );
}
