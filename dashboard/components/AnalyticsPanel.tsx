'use client';

import { useAppStore } from '@/store';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, Area, AreaChart } from 'recharts';
import { useMemo } from 'react';

export function AnalyticsPanel() {
  const notifications = useAppStore(state => state.notifications);

  // Derive mock time-series data based on current feed length
  const chartData = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      name: i,
      value: Math.floor(Math.random() * 50) + (notifications.length > i ? 10 : 0)
    }));
  }, [notifications.length]);

  const topApps = useMemo(() => {
    const counts = notifications.reduce((acc, n) => {
      acc[n.packageName] = (acc[n.packageName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [notifications]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Total Counter */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           {/* Cyber accent decoration */}
           <svg width="40" height="40" viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,100 Z" fill="#10b981"/></svg>
        </div>
        <h3 className="text-xs text-zinc-500 font-bold uppercase mb-1">Total Intercepts</h3>
        <div className="text-4xl font-black text-emerald-400 tracking-tighter">
          {notifications.length.toLocaleString()}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex-1 min-h-[200px]">
        <h3 className="text-xs text-zinc-500 font-bold uppercase mb-4">Traffic / Minute</h3>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', fontSize: '12px' }}
              itemStyle={{ color: '#22d3ee' }}
            />
            <Area type="monotone" dataKey="value" stroke="#22d3ee" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Packages */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex-1">
        <h3 className="text-xs text-zinc-500 font-bold uppercase mb-4">Top Vectors</h3>
        <div className="space-y-3">
          {topApps.length > 0 ? topApps.map(([pkg, count]) => (
            <div key={pkg} className="flex justify-between items-center text-sm">
              <span className="text-zinc-300 truncate pr-4 text-xs">{pkg}</span>
              <span className="text-purple-400 font-mono text-xs bg-purple-950/30 px-2 py-0.5 rounded">
                {count}
              </span>
            </div>
          )) : (
            <div className="text-xs text-zinc-600 italic">Waiting for data...</div>
          )}
        </div>
      </div>
    </div>
  );
}
