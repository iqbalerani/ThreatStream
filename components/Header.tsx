
import React from 'react';
import { ThreatLevel } from '../types';
import { ICONS } from '../constants';

interface HeaderProps {
  threatLevel: ThreatLevel;
  isStreaming: boolean;
  eps: number;
}

const Header: React.FC<HeaderProps> = ({ threatLevel, isStreaming, eps }) => {
  const getStatusColor = () => {
    switch (threatLevel) {
      case ThreatLevel.CRITICAL: return 'bg-red-500 text-white';
      case ThreatLevel.SUSPICIOUS: return 'bg-amber-500 text-slate-900';
      default: return 'bg-emerald-500 text-slate-900';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl shadow-lg ${getStatusColor()} transition-colors duration-500`}>
          {ICONS.SHIELD}
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-white leading-none">ThreatStream</h1>
          <div className="flex items-center gap-3 mt-1">
             <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
               <span className="h-1 w-1 rounded-full bg-orange-500" /> CONFLUENT KAFKA
             </span>
             <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
               <span className="h-1 w-1 rounded-full bg-blue-500" /> GOOGLE GEMINI
             </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Risk</span>
          <div className="flex items-center gap-2">
             <div className={`h-2.5 w-2.5 rounded-full ${threatLevel === ThreatLevel.CRITICAL ? 'bg-red-500 animate-ping' : threatLevel === ThreatLevel.SUSPICIOUS ? 'bg-amber-500' : 'bg-emerald-500'}`} />
             <span className={`text-sm font-black uppercase tracking-tight ${threatLevel === ThreatLevel.CRITICAL ? 'text-red-400' : threatLevel === ThreatLevel.SUSPICIOUS ? 'text-amber-400' : 'text-emerald-400'}`}>
               {threatLevel}
             </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stream Health</span>
          <div className="flex items-center gap-3">
            <span className="mono text-xs text-white font-bold">{eps} EPS</span>
            <span className={`text-[10px] px-2 py-0.5 rounded border font-black ${isStreaming ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-slate-700 text-slate-500 bg-slate-800'}`}>
              {isStreaming ? 'LIVE' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
