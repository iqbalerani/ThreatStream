
import React from 'react';
import { SecurityEvent, Severity } from '../types';

interface TopSourcesProps {
  events: SecurityEvent[];
}

const TopSources: React.FC<TopSourcesProps> = ({ events }) => {
  // Group and sort logic
  const sourceGroups = events.reduce((acc: any, curr) => {
    if (!acc[curr.sourceIp]) {
      acc[curr.sourceIp] = { ip: curr.sourceIp, country: curr.country, count: 0, severity: curr.severity };
    }
    acc[curr.sourceIp].count += 1;
    if (curr.severity === Severity.CRITICAL) acc[curr.sourceIp].severity = Severity.CRITICAL;
    return acc;
  }, {});

  const sorted = Object.values(sourceGroups)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="w-full">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-800/50">
            <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Origin Vector</th>
            <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Vol</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((src: any, i) => (
            <tr key={i} className="group border-b border-slate-800/30 last:border-0 hover:bg-slate-800/20 transition-all">
              <td className="py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${src.severity === Severity.CRITICAL ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-black mono text-slate-200 group-hover:text-indigo-400 transition-colors">{src.ip}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-3.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{src.country} ZONE</span>
                  </div>
                </div>
              </td>
              <td className="py-4 text-right">
                <div className="flex flex-col items-end">
                   <span className="text-xs mono font-black text-white">{src.count}</span>
                   <div className="h-1 w-12 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                     <div 
                      className={`h-full transition-all duration-1000 ${src.severity === Severity.CRITICAL ? 'bg-red-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${Math.min(100, (src.count / 10) * 100)}%` }} 
                     />
                   </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopSources;
