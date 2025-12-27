
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScenarioType } from '../types';

interface ScenarioConfig {
  id: ScenarioType;
  label: string;
  icon: string;
  severity: 'NORMAL' | 'HIGH' | 'CRITICAL';
  description: string;
}

const SCENARIOS: ScenarioConfig[] = [
  { 
    id: 'normal', 
    label: 'HEALTHY FLOW', 
    icon: '🟢', 
    severity: 'NORMAL',
    description: 'Baseline operations and authorized traffic.'
  },
  { 
    id: 'brute_force', 
    label: 'BRUTE FORCE', 
    icon: '🔐', 
    severity: 'HIGH',
    description: 'Simulated credential stuffing on auth endpoints.'
  },
  { 
    id: 'sql_injection', 
    label: 'SQL ATTACK', 
    icon: '💉', 
    severity: 'CRITICAL',
    description: 'Pattern-based injection targeting database layer.'
  },
  { 
    id: 'ddos', 
    label: 'DDOS BURST', 
    icon: '🌊', 
    severity: 'CRITICAL',
    description: 'Massive UDP flood from distributed sources.'
  },
  { 
    id: 'ransomware', 
    label: 'RANSOMWARE', 
    icon: '💀', 
    severity: 'CRITICAL',
    description: 'Bulk file encryption and lateral movement flags.'
  }
];

interface DemoControlsProps {
  isStreaming: boolean;
  setIsStreaming: (s: boolean) => void;
  scenario: ScenarioType;
  setScenario: (s: ScenarioType) => void;
  onReset: () => void;
}

const DemoControls: React.FC<DemoControlsProps> = ({ isStreaming, setIsStreaming, scenario, setScenario, onReset }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  // Progress bar simulation for attacks
  useEffect(() => {
    if (scenario === 'normal') {
      setProgress(0);
      return;
    }
    
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => (prev < 100 ? prev + 1 : 0));
    }, 200);
    
    return () => clearInterval(interval);
  }, [scenario]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...position };
    e.preventDefault(); 
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: initialPos.current.x + dx,
      y: initialPos.current.y + dy
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getButtonStyles = (s: ScenarioConfig) => {
    const isActive = scenario === s.id;
    if (!isActive) return 'bg-slate-800/40 text-slate-500 border-transparent hover:border-slate-700 hover:text-slate-300';
    
    switch (s.severity) {
      case 'NORMAL': 
        return 'bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] border-emerald-400/50';
      case 'HIGH': 
        return 'bg-orange-500 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] border-orange-400/50 animate-pulse';
      case 'CRITICAL': 
        return 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] border-red-400/50 animate-pulse';
      default: 
        return 'bg-indigo-600 text-white';
    }
  };

  return (
    <div 
      className="fixed z-[100] w-full max-w-fit px-4 pointer-events-none"
      style={{ 
        left: '50%', 
        bottom: '32px', 
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)` 
      }}
    >
      <div 
        onMouseDown={handleMouseDown}
        className={`bg-[#0f172a]/95 backdrop-blur-3xl border border-slate-700/30 px-6 py-4 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex items-center gap-6 pointer-events-auto transition-all duration-300 ${
          isDragging ? 'cursor-grabbing scale-[1.01] border-indigo-500/30' : 'cursor-default'
        }`}
      >
        {/* LOGO & BRANDING */}
        <div className="flex items-center gap-4 pr-6 border-r border-slate-800 shrink-0">
          <div className="flex flex-col items-center gap-0.5 opacity-60">
             <div className="grid grid-cols-2 gap-1">
               <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
               <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
               <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
               <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
             </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.2em] leading-none mb-1">SOC CMND</span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">PRESETS</span>
          </div>
        </div>

        {/* SCENARIO SELECTOR */}
        <div className="flex items-center gap-3">
          {SCENARIOS.map((s) => (
            <div key={s.id} className="relative group">
              <button
                onClick={() => setScenario(s.id)}
                title={s.description}
                className={`relative px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex flex-col items-center border ${getButtonStyles(s)}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{s.icon}</span>
                  <span>{s.label}</span>
                </div>
                
                {scenario === s.id && s.id !== 'normal' && (
                  <div className="absolute -bottom-1 left-4 right-4 h-1 bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-200" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                )}
              </button>
              
              {/* Tooltip hint on hover (visual only) */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-2 group-hover:translate-y-0">
                <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl shadow-2xl min-w-[150px] text-center">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{s.severity} SEVERITY</p>
                  <p className="text-[10px] text-white font-medium whitespace-nowrap">{s.description}</p>
                </div>
                <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1" />
              </div>

              {scenario === s.id && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                   <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${s.id === 'normal' ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>
                     ● ACTIVE_SIM
                   </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="h-10 w-px bg-slate-800" />

        {/* SYSTEM ACTIONS */}
        <div className="flex gap-3 pl-2">
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-2 ${
              isStreaming 
                ? 'bg-slate-800/40 text-white border-indigo-500/30' 
                : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-500'
            }`}
          >
            {isStreaming ? (
              <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> STOP FEED</>
            ) : (
              <><span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> START FEED</>
            )}
          </button>

          <button 
            onClick={onReset}
            className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800/40 text-slate-400 border border-transparent hover:border-slate-700 hover:text-white transition-all active:scale-95"
          >
            RESET
          </button>
        </div>
      </div>
      
      <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.5em] text-center mt-6 opacity-60">
        Advanced Command Interface v3.2 • Tactical Overlay • ThreatStream OS
      </p>
    </div>
  );
};

export default DemoControls;
