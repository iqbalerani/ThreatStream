
import React from 'react';
import { DashboardStats } from '../types';

interface StatsBarProps {
  stats: DashboardStats;
}

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  const width = 100;
  const height = 20;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group hover:border-slate-700 transition-colors">
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Signals</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white mono">{stats.processed.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-500 font-bold">↑ +47/s</span>
          </div>
        </div>
        <div className="opacity-20 group-hover:opacity-100 transition-opacity">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
      </div>
      
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group hover:border-slate-700 transition-colors">
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Blocked IPs</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white mono">{stats.blocked.toLocaleString()}</span>
            <span className="text-[10px] text-blue-500 font-bold">99.9%</span>
          </div>
        </div>
        <div className="opacity-20 group-hover:opacity-100 transition-opacity">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group hover:border-slate-700 transition-colors">
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Avg Detection</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white mono">{stats.avgDetectTime}ms</span>
            <span className="text-[10px] text-emerald-500 font-bold">↓ -12ms</span>
          </div>
        </div>
        <div className="pt-2">
           <Sparkline data={stats.latencyHistory} />
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group hover:border-slate-700 transition-colors">
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Active Alarms</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black mono ${stats.critical > 0 ? 'text-red-500' : 'text-white'}`}>{stats.critical}</span>
            {stats.critical > 0 && <span className="text-[10px] text-red-500 font-black animate-pulse">● CRITICAL</span>}
          </div>
        </div>
        <div className={`transition-opacity ${stats.critical > 0 ? 'opacity-100' : 'opacity-20'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
