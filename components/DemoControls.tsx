
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScenarioType } from '../types';

interface AttackConfig {
  id: ScenarioType;
  label: string;
  icon: string;
  severity: 'NORMAL' | 'HIGH' | 'CRITICAL';
  description: string;
}

const ATTACKS: AttackConfig[] = [
  { id: 'brute_force', label: 'BRUTE FORCE', icon: '🔐', severity: 'HIGH', description: 'Simulated credential stuffing' },
  { id: 'sql_injection', label: 'SQL ATTACK', icon: '💉', severity: 'CRITICAL', description: 'Pattern-based injection' },
  { id: 'ddos', label: 'DDOS BURST', icon: '🌊', severity: 'CRITICAL', description: 'Massive UDP flood' },
  { id: 'ransomware', label: 'RANSOMWARE', icon: '💀', severity: 'CRITICAL', description: 'File encryption signal' }
];

interface DemoControlsProps {
  isStreaming: boolean;
  setIsStreaming: (s: boolean) => void;
  scenario: ScenarioType;
  setScenario: (s: ScenarioType) => void;
  onReset: () => void;
}

const DemoControls: React.FC<DemoControlsProps> = ({ isStreaming, setIsStreaming, scenario, setScenario, onReset }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [timer, setTimer] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simulation Timer logic
  useEffect(() => {
    let interval: any;
    if (scenario !== 'normal') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [scenario]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...position };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: initialPos.current.x + (e.clientX - dragStart.current.x),
      y: initialPos.current.y + (e.clientY - dragStart.current.y)
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const currentAttack = ATTACKS.find(a => a.id === scenario);

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <div className="bg-indigo-600/90 backdrop-blur-xl px-6 py-3 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.4)] border border-indigo-400/50 flex items-center gap-3 animate-bounce">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Restore CMND</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed z-[100] w-full max-w-fit px-4 pointer-events-none"
      style={{ left: '50%', bottom: '32px', transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)` }}
    >
      <div 
        onMouseDown={handleMouseDown}
        className={`bg-[#0f172a]/95 backdrop-blur-3xl border border-slate-700/40 px-6 py-4 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex items-center gap-5 pointer-events-auto transition-all ${isDragging ? 'cursor-grabbing scale-[1.01]' : 'cursor-default'}`}
      >
        {/* LOGO & MINIMIZE */}
        <div className="flex items-center gap-3 pr-5 border-r border-slate-800">
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12h16"/></svg>
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] leading-none mb-1">SOC_CMND</span>
            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest leading-none">V3.2.0</span>
          </div>
        </div>

        {/* CORE SCENARIOS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (scenario === 'normal') return; // Already normal
              setScenario('normal');
              setShowDropdown(false);
            }}
            disabled={scenario !== 'normal'}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              scenario === 'normal'
                ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] border-emerald-400'
                : 'bg-slate-800/20 text-slate-600 border-slate-800/50 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" />
              HEALTHY FLOW
            </div>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-3 ${
                scenario !== 'normal' 
                  ? 'bg-red-600 text-white shadow-[0_0_25px_rgba(220,38,38,0.4)] border-red-500 animate-pulse' 
                  : 'bg-slate-800/40 text-slate-500 border-transparent hover:border-slate-700'
              }`}
            >
              <span>{currentAttack ? `${currentAttack.icon} ${currentAttack.label}` : '🚨 TRIGGER ATTACK'}</span>
              <svg className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {showDropdown && (
              <div className="absolute bottom-full left-0 mb-4 w-64 bg-slate-900 border border-slate-700 rounded-3xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="px-3 py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-2">Select Attack Vector</div>
                {ATTACKS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setScenario(a.id); setShowDropdown(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all hover:bg-slate-800 group ${scenario === a.id ? 'bg-slate-800' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{a.icon}</span>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{a.label}</p>
                        <p className="text-[8px] text-slate-500 font-bold">{a.description}</p>
                      </div>
                    </div>
                    <div className={`h-1.5 w-1.5 rounded-full ${a.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STOP SIMULATE ATTACK BUTTON */}
          {scenario !== 'normal' && (
            <button
              onClick={() => {
                setScenario('normal');
                setShowDropdown(false);
                setTimer(0);
              }}
              className="px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-orange-600 text-white border border-orange-500 shadow-[0_0_25px_rgba(234,88,12,0.4)] hover:bg-orange-500 transition-all animate-pulse flex items-center gap-2"
            >
              <span>⏹</span>
              STOP ATTACK
            </button>
          )}
        </div>

        {/* ATTACK TELEMETRY (Timer) */}
        {scenario !== 'normal' && (
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="flex flex-col items-center">
               <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">DURATION</span>
               <span className="mono text-xs font-black text-white bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">{formatTime(timer)}</span>
            </div>
          </div>
        )}

        <div className="h-10 w-px bg-slate-800" />

        {/* FEED CONTROLS */}
        <div className="flex gap-2">
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
              isStreaming 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-500'
            }`}
          >
             <span className={`h-1.5 w-1.5 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
             {isStreaming ? 'FEED_LIVE' : 'FEED_PAUSED'}
          </button>

          <button 
            onClick={() => { onReset(); setTimer(0); setShowDropdown(false); }}
            className="px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-800/40 text-slate-400 border border-transparent hover:border-slate-700 hover:text-white transition-all"
          >
            RESET_SYS
          </button>
        </div>
      </div>
      
      <p className="text-[7px] text-slate-700 font-black uppercase tracking-[0.5em] text-center mt-6 opacity-40">
        Advanced Command Interface • Tactical Overlay • Gemini Security Engine
      </p>
    </div>
  );
};

export default DemoControls;
