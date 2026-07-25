'use client';

import { useAppStore } from '@/store';
import { Cpu, ShieldAlert, Zap, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';

export function DeviceList() {
  const { connectedDevices, selectedDevice, setSelectedDevice, deviceAliases, setDeviceAlias } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEditing = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(deviceAliases[id] || id);
  };

  const saveEdit = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim()) {
      setDeviceAlias(id, editName.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

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
                  {editingId === device.id ? (
                    <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-black border border-[#00FF41] text-[#00FF41] text-xs px-1 w-full outline-none focus:shadow-[0_0_5px_#00FF41]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(e, device.id);
                          if (e.key === 'Escape') cancelEdit(e);
                        }}
                      />
                      <button onClick={(e) => saveEdit(e, device.id)} className="text-[#00FF41] hover:text-white"><Check className="w-3 h-3" /></button>
                      <button onClick={cancelEdit} className="text-red-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group/edit">
                      <div className={`text-xs font-mono truncate ${isSelected ? 'text-white font-bold' : 'text-[#00FF41]'}`}>
                        {deviceAliases[device.id] || device.id}
                      </div>
                      <button 
                        onClick={(e) => startEditing(e, device.id)}
                        className="opacity-0 group-hover/edit:opacity-100 text-[#00FF41] hover:text-white transition-opacity p-1"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <div className={`text-[9px] ${device.isIntercepting ? 'text-red-500' : 'text-[#00FF41]/70'}`}>
                      {device.isIntercepting ? 'Status: INTERCEPTING' : 'Status: IDLE'}
                    </div>
                    {device.online && device.connectedAt && (
                      <div className="text-[8px] text-[#00FF41]/40 font-mono">
                        UP: {Math.floor((Date.now() - device.connectedAt) / 60000)}m
                      </div>
                    )}
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
