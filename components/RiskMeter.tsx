
import React from 'react';
import { ThreatLevel } from '../types';

interface RiskMeterProps {
  score: number;
  level: ThreatLevel;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level }) => {
  const rotation = (score / 100) * 180 - 90;
  
  const getColor = () => {
    if (score > 60) return '#ef4444';
    if (score > 30) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Gauge Background */}
      <div className="relative">
        <svg width="300" height="180" viewBox="0 0 240 140" className="drop-shadow-2xl">
          <path 
            d="M 20 120 A 100 100 0 0 1 220 120" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="12" 
            strokeLinecap="round"
          />
          {/* Active Gauge Arc */}
          <path 
            d="M 20 120 A 100 100 0 0 1 220 120" 
            fill="none" 
            stroke={getColor()} 
            strokeWidth="12" 
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 314} 314`}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Needle */}
          <g 
            transform={`translate(120, 120) rotate(${rotation})`}
            className="transition-transform duration-700 ease-in-out"
          >
            <line x1="0" y1="0" x2="0" y2="-90" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
            <circle cx="0" cy="0" r="10" fill="#f8fafc" />
          </g>
        </svg>

        {/* Center Text positioned relative to the gauge base */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[40px] text-center pointer-events-none">
          <div className="mono text-7xl font-black text-white tracking-tighter leading-none">
            {Math.round(score)}
          </div>
        </div>
      </div>

      {/* Status Labels with "Light up" logic */}
      <div className="flex w-full max-w-[320px] justify-between px-2 mt-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500">
        <span className={`transition-all duration-300 ${
          level === ThreatLevel.NORMAL 
            ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110' 
            : 'text-slate-700 opacity-40'
        }`}>
          Normal
        </span>
        <span className={`transition-all duration-300 ${
          level === ThreatLevel.SUSPICIOUS 
            ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-110' 
            : 'text-slate-700 opacity-40'
        }`}>
          Elevated
        </span>
        <span className={`transition-all duration-300 ${
          level === ThreatLevel.CRITICAL 
            ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110' 
            : 'text-slate-700 opacity-40'
        }`}>
          Critical
        </span>
      </div>
    </div>
  );
};

export default RiskMeter;
