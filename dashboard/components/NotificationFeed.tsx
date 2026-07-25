'use client';

import { useAppStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { ChevronDown, TerminalSquare } from 'lucide-react';

export function NotificationFeed() {
  const { notifications, searchQuery, selectedDevice } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = notifications.filter(n => {
    if (selectedDevice && n.deviceId !== selectedDevice) return false;
    if (!searchQuery) return true;
    return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           n.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           n.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-y-auto p-2 scroll-smooth bg-black">
      <AnimatePresence initial={false}>
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#00FF41]/50 text-sm font-mono animate-pulse">
            {">"} WAITING_FOR_DATA_PACKETS...
          </div>
        ) : (
          filtered.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              className={`mb-3 border transition-colors ${
                notif.status === 'uploaded' ? 'border-[#00FF41]/30 bg-black' : 'border-[#00FF41] bg-[#00FF41]/5 shadow-[0_0_10px_rgba(0,255,65,0.1)]'
              }`}
            >
              <div 
                className="p-3 cursor-pointer flex gap-3 items-start"
                onClick={() => setExpandedId(expandedId === notif.id ? null : notif.id)}
              >
                <div className="mt-1 bg-black p-1.5 border border-[#00FF41] text-[#00FF41]">
                  <TerminalSquare className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-black font-bold truncate px-1.5 py-0.5 bg-[#00FF41]">
                      {notif.packageName}
                    </span>
                    <span className="text-[10px] text-[#00FF41]/70 font-mono">
                      [T-MINUS {formatDistanceToNow(notif.postTime)}]
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-bold text-white truncate drop-shadow-[0_0_2px_#00FF41]">
                    {notif.title || 'NO_TITLE_DETECTED'}
                  </h3>
                  
                  <p className="text-xs text-[#00FF41]/80 truncate mt-1">
                    {notif.text || '< EMPTY_PAYLOAD >'}
                  </p>
                </div>
                
                <ChevronDown className={`w-4 h-4 text-[#00FF41] mt-2 transition-transform ${expandedId === notif.id ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {expandedId === notif.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 border-t border-[#00FF41]/50 bg-black">
                      <div className="text-[10px] text-[#00FF41] font-mono mt-2 mb-1 opacity-70">{"// RAW_PACKET_DUMP"}</div>
                      <pre className="text-[10px] text-[#00FF41] p-3 border border-[#00FF41]/30 bg-[#00FF41]/5 overflow-x-auto font-mono">
                        {JSON.stringify(notif, null, 2)}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
