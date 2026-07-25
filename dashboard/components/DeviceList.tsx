'use client';

import { useAppStore } from '@/store';
import { Cpu, ShieldAlert, Zap } from 'lucide-react';
import { useMemo } from 'react';

export function DeviceList() {
  const { connectedDevices, selectedDevice, setSelectedDevice } = useAppStore();

  return (
    <div className="bg-black border border-[#00FF41] h-full flex flex-col overflow-hidden shadow-[inset_0_0_10px_rgba(0,255,65,0.1)]">
      <div className="p-3 border-b border-[#00FF41] bg-[#00FF41]/10 flex justify-between items-center">
        <h2 className="text-xs font-bold text-[#00FF41] tracking-widest uppercase">{">"} ACTIVE_NODES</h2>
        <span className="bg-black border border-[#00FF41] text-[#00FF41] text-[10px] px-2 py-0.5 font-mono animate-pulse">
          {connectedDevices.length} ONLINE
        </span>
      </div>
      
      <div className="p-2 overflow-y-auto flex-1 space-y-2">
        {connectedDevices.length === 0 ? (
          <div className="text-xs text-[#00FF41]/50 italic p-2 text-center animate-pulse">Scanning for signals...</div>
        ) : (
          connectedDevices.map((device, i) => {
            const isSelected = selectedDevice === device.id;
            return (
              <button 
                key={i} 
                onClick={() => setSelectedDevice(device.id)}
                className={`w-full flex items-center gap-3 p-2 text-left transition-all border ${isSelected ? 'border-[#00FF41] bg-[#00FF41]/20 shadow-[0_0_10px_#00FF41]' : 'border-transparent hover:border-[#00FF41]/50 hover:bg-[#00FF41]/5'}`}
              >
                <Cpu className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#00FF41]'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-mono truncate ${isSelected ? 'text-white font-bold' : 'text-[#00FF41]'}`}>{device.id}</div>
                  <div className={`text-[10px] ${device.isIntercepting ? 'text-red-500' : 'text-[#00FF41]/70'}`}>
                    {device.isIntercepting ? 'Status: INTERCEPTING' : 'Status: IDLE'}
                  </div>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${device.isIntercepting ? 'bg-red-500 animate-pulse' : 'bg-[#00FF41]'}`} />
              </button>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-[#00FF41] bg-[#00FF41]/5 space-y-2">
         <div className="flex items-center text-xs text-[#00FF41] gap-2">
           <ShieldAlert className="w-4 h-4 text-white" /> ENCRYPTION_ACTIVE
         </div>
         <div className="flex items-center text-xs text-[#00FF41] gap-2">
           <Zap className="w-4 h-4 text-white animate-pulse" /> 0ms LATENCY
         </div>
      </div>
    </div>
  );
}
