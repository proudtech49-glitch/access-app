'use client';

import { useAppStore } from '@/store';
import { WebSocketStatus } from './WebSocketStatus';
import { Terminal, Search, Download, CheckSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { exportToJson } from '@/lib/utils';

export function Header() {
  const { searchQuery, setSearchQuery, notifications, markAllRead } = useAppStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-14 border-b-2 border-[#00FF41] bg-black flex items-center justify-between px-4 sticky top-0 z-10 shadow-[0_0_15px_rgba(0,255,65,0.3)]">
      <div className="flex items-center gap-3">
        <Terminal className="text-[#00FF41] w-5 h-5 animate-pulse" />
        <h1 className="font-black tracking-widest text-[#00FF41] uppercase text-sm drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]">
          FocusGuard <span className="text-white opacity-70">SYS_CTRL</span>
        </h1>
        <WebSocketStatus />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-[#00FF41] group-focus-within:text-white transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search payload (Cmd+K)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black border border-[#00FF41] text-xs font-mono rounded-none pl-9 pr-4 py-1.5 focus:outline-none focus:border-white focus:ring-1 focus:ring-white w-64 transition-all placeholder:text-[#00FF41]/50 text-[#00FF41] shadow-[inset_0_0_5px_rgba(0,255,65,0.3)]"
          />
        </div>

        <button 
          onClick={markAllRead}
          className="p-1.5 text-[#00FF41] border border-transparent hover:border-[#00FF41] hover:bg-[#00FF41]/10 transition-colors group flex items-center gap-1"
          title="Mark all as read"
        >
          <CheckSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-xs uppercase font-bold hidden sm:inline-block">ACK_ALL</span>
        </button>

        <button 
          onClick={() => exportToJson(notifications, `harvest_${Date.now()}.json`)}
          className="p-1.5 text-[#00FF41] border border-transparent hover:border-[#00FF41] hover:bg-[#00FF41]/10 transition-colors group flex items-center gap-1"
          title="Export JSON"
        >
          <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-xs uppercase font-bold hidden sm:inline-block">DUMP_DATA</span>
        </button>
      </div>
    </header>
  );
}
