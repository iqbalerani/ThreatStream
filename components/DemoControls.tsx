
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScenarioType } from '../types';

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
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const scenarios: { id: ScenarioType, label: string }[] = [
    { id: 'normal', label: 'HEALTHY FLOW' },
    { id: 'brute_force', label: 'BRUTE FORCE' },
    { id: 'sql_injection', label: 'SQL ATTACK' },
    { id: 'ddos', label: 'DDOS BURST' },
    { id: 'ransomware', label: 'RANSOMWARE' }
  ];

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
        className={`bg-[#0f172a]/95 backdrop-blur-3xl border border-slate-700/30 px-6 py-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex items-center gap-6 pointer-events-auto transition-all duration-300 ${
          isDragging ? 'cursor-grabbing scale-[1.01] border-indigo-500/30' : 'cursor-default'
        }`}
      >
        {/* LOGO & BRANDING */}
        <div className="flex items-center gap-4 pr-6 border-r border-slate-800">
          <div className="flex flex-col items-center gap-0.5 opacity-60">
             <div className="grid grid-cols-2 gap-0.5">
               <div className="h-1 w-1 bg-indigo-400 rounded-full" />
               <div className="h-1 w-1 bg-indigo-400 rounded-full" />
               <div className="h-1 w-1 bg-indigo-400 rounded-full" />
               <div className="h-1 w-1 bg-indigo-400 rounded-full" />
             </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] leading-none mb-1">SOC CMND</span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">PRESETS</span>
          </div>
        </div>

        {/* SCENARIO SELECTOR */}
        <div className="flex items-center gap-4">
          <button className="text-slate-600 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          
          <div className="flex gap-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  scenario === s.id 
                  ? (s.id === 'normal' ? 'bg-[#10b981] text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse') 
                  : 'bg-slate-800/40 text-slate-500 border border-transparent hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-8 w-px bg-slate-800" />

        {/* SYSTEM ACTIONS */}
        <div className="flex gap-3 pl-2">
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800/40 text-slate-400 border border-transparent hover:border-slate-700 hover:text-white transition-all active:scale-95"
          >
            {isStreaming ? 'STOP FEED' : 'START FEED'}
          </button>

          <button 
            onClick={onReset}
            className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800/40 text-slate-400 border border-transparent hover:border-slate-700 hover:text-white transition-all active:scale-95"
          >
            RESET
          </button>
        </div>
      </div>
      
      <p className="text-[7px] text-slate-700 font-black uppercase tracking-[0.5em] text-center mt-3 opacity-40">
        Command Interface v3.1 • ThreatStream OS
      </p>
    </div>
  );
};

export default DemoControls;
