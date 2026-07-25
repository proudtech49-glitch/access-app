'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { NotificationFeed } from '@/components/NotificationFeed';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { DeviceList } from '@/components/DeviceList';
import { wsManager } from '@/lib/websocket';
import { useAppStore } from '@/store';
import { Server, Activity } from 'lucide-react';

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { selectedDevice, setSelectedDevice, connectedDevices, deviceAliases } = useAppStore();

  useEffect(() => {
    wsManager.connect();
    return () => wsManager.disconnect();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      wsManager.disconnect();
      wsManager.connect();
      setIsRefreshing(false);
    }, 1500);
  };

  // Generate a fixed 10-node grid for the hacker aesthetic
  const allNodes = useMemo(() => {
    const nodes = [];
    for (let i = 0; i < 10; i++) {
      if (connectedDevices[i]) {
        nodes.push(connectedDevices[i]);
      } else {
        nodes.push({ id: `NODE_SEC_0${i+1}`, online: false, isIntercepting: false });
      }
    }
    return nodes;
  }, [connectedDevices]);

  const currentDevice = connectedDevices.find(d => d.id === selectedDevice);
  const isIntercepting = currentDevice?.isIntercepting || false;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-[#00FF41] font-mono selection:bg-[#00FF41] selection:text-black">
      <Header />
      
      {!selectedDevice ? (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          <div className="mb-8 border-b border-[#00FF41]/30 pb-4">
            <h2 className="text-2xl font-black text-white tracking-[0.3em] drop-shadow-[0_0_10px_#00FF41] animate-pulse">
              {">"} GLOBAL_NODE_NETWORK
            </h2>
            <p className="text-[#00FF41]/70 mt-2 tracking-widest text-sm">SELECT A TARGET NODE TO CONTROL DATA INTERCEPTION.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {allNodes.map((node, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDevice(node.id)}
                className={`relative p-6 border flex flex-col items-center justify-center gap-4 group transition-all duration-300 cursor-pointer ${
                  node.online 
                    ? node.isIntercepting 
                        ? 'border-red-500 bg-red-500/10 hover:bg-red-500/20 hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                        : 'border-[#00FF41] bg-[#00FF41]/5 hover:bg-[#00FF41]/20 hover:shadow-[0_0_25px_rgba(0,255,65,0.4)]' 
                    : node.isIntercepting
                        ? 'border-red-900 bg-red-950/30 hover:bg-red-900/50 hover:shadow-[0_0_15px_rgba(153,27,27,0.4)] opacity-80'
                        : 'border-red-900/50 bg-red-950/10 hover:bg-red-950/30 opacity-50 hover:opacity-100'
                }`}
              >
                {/* Hacker decorative corners */}
                <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${node.online ? (node.isIntercepting ? 'border-red-500' : 'border-[#00FF41]') : 'border-red-900'}`} />
                <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${node.online ? (node.isIntercepting ? 'border-red-500' : 'border-[#00FF41]') : 'border-red-900'}`} />
                <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${node.online ? (node.isIntercepting ? 'border-red-500' : 'border-[#00FF41]') : 'border-red-900'}`} />
                <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${node.online ? (node.isIntercepting ? 'border-red-500' : 'border-[#00FF41]') : 'border-red-900'}`} />

                <Server className={`w-12 h-12 ${node.online ? (node.isIntercepting ? 'text-white drop-shadow-[0_0_8px_red] animate-pulse' : 'text-white drop-shadow-[0_0_8px_#00FF41]') : 'text-red-900'}`} />
                <div className="text-center">
                  <div className={`font-bold tracking-wider ${node.online ? 'text-white' : 'text-red-700'}`}>{deviceAliases[node.id] || node.id}</div>
                  <div className={`text-[10px] mt-2 ${node.online ? (node.isIntercepting ? 'text-red-400' : 'text-[#00FF41]') : 'text-red-900'}`}>
                    {node.online ? (node.isIntercepting ? '[ STATUS: INTERCEPTING ]' : '[ STATUS: IDLE ]') : '[ STATUS: OFFLINE ]'}
                  </div>
                </div>
                {node.online && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Activity className={`w-3 h-3 ${node.isIntercepting ? 'text-red-500' : 'text-[#00FF41]'} animate-pulse`} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          <aside className="w-64 flex flex-col gap-4 hidden lg:flex">
            <DeviceList />
          </aside>

          <main className="flex-1 flex flex-col bg-black border border-[#00FF41] overflow-hidden shadow-[0_0_25px_rgba(0,255,65,0.15)] relative">
            <div className="p-3 border-b border-[#00FF41] bg-[#00FF41]/10 flex flex-wrap justify-between items-center gap-4 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedDevice(null)}
                  className="px-3 py-1.5 border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-black transition-colors text-xs font-bold flex items-center gap-2"
                >
                  {"<<"} BACK TO NODES
                </button>
                <h2 className="text-sm font-bold text-[#00FF41] tracking-[0.2em] uppercase flex items-center gap-2">
                  <span className="animate-pulse">_</span> {">"} TARGET: {selectedDevice ? (deviceAliases[selectedDevice] || selectedDevice) : ''}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2 border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-black font-bold uppercase tracking-widest transition-all text-xs"
                >
                  {isRefreshing ? '[ REFRESHING... ]' : '[ REFRESH ]'}
                </button>
                <button 
                  onClick={() => selectedDevice && wsManager.setIntercept(selectedDevice, !isIntercepting)}
                  className={`px-6 py-2 border font-bold uppercase tracking-widest transition-all ${
                    isIntercepting 
                      ? 'border-red-500 text-red-500 bg-red-900/20 hover:bg-red-500 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                      : 'border-[#00FF41] text-[#00FF41] bg-[#00FF41]/20 hover:bg-[#00FF41] hover:text-black shadow-[0_0_15px_rgba(0,255,65,0.5)]'
                  }`}
                >
                  {isIntercepting ? '[ TERMINATE_INTERCEPT ]' : '[ INITIALIZE_INTERCEPT ]'}
                </button>
              </div>
            </div>
            {isRefreshing ? (
               <div className="flex-1 flex flex-col items-center justify-center space-y-2 p-8">
                 <div className="text-[#00FF41] animate-pulse whitespace-pre text-center font-mono">
                   {">"} ISOLATING_NODE...\n{">"} BYPASSING_FIREWALL...\n{">"} DECRYPTING_NEW_PACKETS...
                 </div>
               </div>
            ) : (
              <NotificationFeed />
            )}
          </main>

          <aside className="w-96 flex flex-col gap-4 hidden xl:flex">
            <AnalyticsPanel />
          </aside>
        </div>
      )}
    </div>
  );
}
