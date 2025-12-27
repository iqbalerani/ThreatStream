
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
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const scenarios: { id: ScenarioType, label: string }[] = [
    { id: 'normal', label: 'Healthy Flow' },
    { id: 'brute_force', label: 'Brute Force' },
    { id: 'sql_injection', label: 'SQL Attack' },
    { id: 'ddos', label: 'DDoS Burst' },
    { id: 'ransomware', label: 'Ransomware' }
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
        bottom: '24px', 
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)` 
      }}
    >
      <div 
        onMouseDown={handleMouseDown}
        className={`bg-slate-900/90 backdrop-blur-2xl border border-slate-700/40 p-1.5 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex items-center gap-1 pointer-events-auto transition-all duration-300 ${
          isDragging ? 'shadow-[0_20px_60px_rgba(0,0,0,0.8)] cursor-grabbing scale-[1.02]' : 'cursor-default'
        }`}
      >
        {/* DRAG HANDLE */}
        <div 
          className="px-4 border-r border-slate-800 mr-1 flex flex-col cursor-grab active:cursor-grabbing hover:bg-slate-800/30 rounded-l-full py-1 transition-colors"
          title="Drag to reposition"
        >
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-500 opacity-50"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.2em]">SOC CMND</span>
          </div>
          <span className="text-[7px] font-bold text-slate-500 uppercase">PRESETS</span>
        </div>

        {/* MINIMIZABLE PRESETS SECTION */}
        <div className="flex items-center">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className={`p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-all ${isMinimized ? 'rotate-180 text-indigo-400 bg-indigo-500/10' : ''}`}
            title={isMinimized ? "Show Scenarios" : "Hide Scenarios"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div className={`flex items-center transition-all duration-500 overflow-hidden ${isMinimized ? 'max-w-0 opacity-0' : 'max-w-2xl opacity-100 px-1'}`}>
            <div className="flex gap-1 shrink-0">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScenario(s.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                    scenario === s.id 
                    ? (s.id === 'normal' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-pulse') 
                    : 'bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1.5 shrink-0" />

        {/* PERMANENT ACTION BUTTONS */}
        <div className="flex gap-1 shrink-0 pr-1">
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
              isStreaming ? 'bg-slate-800/50 text-slate-400 hover:text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {isStreaming ? 'Stop Feed' : 'Start Feed'}
          </button>

          <button 
            onClick={onReset}
            className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
          >
            RESET
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.4em] opacity-60 text-center mt-2 transition-opacity duration-500">
          Simulation Console v2.4 • Drag handle to move
        </p>
      )}
    </div>
  );
};

export default DemoControls;
