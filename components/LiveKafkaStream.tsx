
import React, { useEffect, useState, useMemo } from 'react';
import { SecurityEvent, Severity } from '../types';

interface LiveKafkaStreamProps {
  events: SecurityEvent[];
  eps: number;
  onClose: () => void;
}

const LiveKafkaStream: React.FC<LiveKafkaStreamProps> = ({ events, eps, onClose }) => {
  // Ticker for the horizontal scrolling line animation
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  // Use a subset of recent events to display in the visualization
  const streamData = useMemo(() => {
    return events.slice(0, 8).map((e, i) => ({
      ...e,
      // Calculate a staggered horizontal position based on the index
      xPos: 75 - (i * 12)
    }));
  }, [events]);

  const getSeverityColor = (sev: Severity) => {
    switch (sev) {
      case Severity.CRITICAL: return 'text-red-500';
      case Severity.HIGH: return 'text-orange-500';
      case Severity.MEDIUM: return 'text-amber-400';
      default: return 'text-emerald-500';
    }
  };

  const getSeverityLabel = (sev: Severity) => sev.toUpperCase();

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-6xl border border-slate-700 rounded shadow-[0_0_80px_rgba(0,0,0,0.9)] bg-[#020617] flex flex-col overflow-hidden">
        
        {/* Terminal Header */}
        <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-red-500 animate-pulse text-lg leading-none">🔴</span>
            <h2 className="text-slate-200 font-bold tracking-widest text-sm uppercase">LIVE KAFKA STREAM</h2>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-baseline gap-2">
              <span className="text-indigo-400 font-black text-lg">{eps}</span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">events/sec</span>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-white border border-slate-800 hover:border-slate-600 px-3 py-1 rounded text-[10px] font-bold transition-all"
            >
              [ ESC ] CLOSE_BRIDGE
            </button>
          </div>
        </div>

        {/* Visualization Grid Area */}
        <div className="flex-1 p-8 space-y-2 overflow-x-hidden relative">
          
          {/* Track 1: Raw Security Logs */}
          <div className="relative border border-slate-800/60 rounded p-6 bg-slate-950/20">
            <div className="absolute -top-3 left-6 bg-[#020617] px-3 py-0.5 text-[10px] text-slate-500 font-bold border border-slate-800/60 rounded">
              ┌─ raw-security-logs ──────────────────────────────────────────────────┐
            </div>
            
            <div className="h-48 relative">
              {/* Horizontal Ingest Pipe */}
              <div className="absolute top-[20px] left-0 right-0 h-[2px] bg-slate-800/50 flex items-center overflow-hidden">
                <div 
                  className="whitespace-nowrap text-indigo-500/30 text-xs font-bold tracking-[0.2em]"
                  style={{ transform: `translateX(${-(ticker % 20)}px)` }}
                >
                  {"══○══════○══════○══════○══════○══════○══════○══════○══════○══════○══════○══════○═══▶ ".repeat(10)}
                </div>
              </div>

              {/* Falling JSON Nodes */}
              <div className="relative h-full pt-6">
                {streamData.map((event, i) => (
                  <div 
                    key={`raw-${event.id}`}
                    className="absolute top-0 transition-all duration-700 ease-out"
                    style={{ left: `${event.xPos}%` }}
                  >
                    <div className="w-[1px] h-12 bg-slate-800 mx-auto" />
                    <div className="bg-slate-900/90 border border-slate-800 p-2 rounded shadow-xl whitespace-nowrap">
                       <div className="text-[9px] text-slate-400 leading-tight">
                        <span className="text-indigo-400">└─</span> {"{"}"event":"<span className="text-emerald-400">{event.type.toLowerCase().split(' ')[0]}</span>","ip":"{event.sourceIp}"{"}"}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Processing Bridge Label */}
          <div className="flex flex-col items-center py-4 relative z-10">
            <div className="text-[10px] font-black text-indigo-500 tracking-[0.5em] mb-2 uppercase animate-pulse">
              ▼ GEMINI AI PROCESSING
            </div>
            <div className="w-[1px] h-8 bg-gradient-to-b from-indigo-500/50 to-transparent" />
          </div>

          {/* Track 2: Analyzed Threats */}
          <div className="relative border border-slate-800/60 rounded p-6 bg-slate-950/20">
            <div className="absolute -top-3 left-6 bg-[#020617] px-3 py-0.5 text-[10px] text-slate-500 font-bold border border-slate-800/60 rounded">
              ┌─ analyzed-threats ───────────────────────────────────────────────────┐
            </div>

            <div className="h-48 relative">
              {/* Horizontal Egress Pipe */}
              <div className="absolute top-[20px] left-0 right-0 h-[2px] bg-slate-800/50 flex items-center overflow-hidden">
                <div 
                  className="whitespace-nowrap text-white/10 text-xs font-bold tracking-[0.2em]"
                  style={{ transform: `translateX(${-(ticker % 20)}px)` }}
                >
                  {"══●══════●══════●══════●══════●══════●══════●══════●══════●══════●══════●══════●═══▶ ".repeat(10)}
                </div>
              </div>

              {/* Falling Analyzed Nodes */}
              <div className="relative h-full pt-6">
                {streamData.map((event, i) => (
                  <div 
                    key={`anal-${event.id}`}
                    className="absolute top-0 transition-all duration-1000 ease-out delay-150"
                    style={{ left: `${event.xPos}%` }}
                  >
                    <div className="w-[1px] h-12 bg-slate-800 mx-auto" />
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded shadow-2xl whitespace-nowrap">
                       <div className={`text-[10px] font-bold ${getSeverityColor(event.severity)} leading-tight`}>
                        <span className="opacity-50">└─</span> {getSeverityLabel(event.severity)}: {event.type} {event.mitre && <span className="text-white/40 ml-1">[{event.mitre}]</span>}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal Legend Footer */}
            <div className="mt-8 pt-4 border-t border-slate-800/40 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold text-slate-500 tracking-wider">
              <span className="text-slate-400">● = ANALYZED THREAT (COLOR BY SEVERITY):</span>
              <div className="flex gap-4">
                <span className="text-red-500">🔴 CRITICAL</span>
                <span className="text-orange-500">🟠 HIGH</span>
                <span className="text-amber-500">🟡 MEDIUM</span>
                <span className="text-emerald-500">🟢 LOW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="bg-slate-900/30 px-4 py-2 flex justify-between items-center text-[9px] text-slate-600 italic border-t border-slate-800">
          <div className="flex gap-4">
            <span>CLUSTER_ID: SOC-KAFKA-PROD-01</span>
            <span className="text-indigo-500/50">ENCRYPTION: AES-256-GCM</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> ENGINE_HEALTH: 100%</span>
            <span>SYSTEM_TIME: {new Date().toISOString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveKafkaStream;
