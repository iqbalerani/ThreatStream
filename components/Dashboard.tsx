
import React, { useState } from 'react';
import EventStream from './EventStream';
import RiskMeter from './RiskMeter';
import AIExplanation from './AIExplanation';
import Timeline from './Timeline';
import TopSources from './TopSources';
import KafkaMetrics from './KafkaMetrics';
import ThreatMap from './ThreatMap';
import { SecurityEvent, ThreatLevel, AIReasoning, TimelineData } from '../types';

interface DashboardProps {
  events: SecurityEvent[];
  riskScore: number;
  threatLevel: ThreatLevel;
  aiReasoning: AIReasoning;
  isAnalyzing: boolean;
  timeline: TimelineData[];
  onEventClick: (event: SecurityEvent) => void;
  onMitigate: () => void;
  mitigationActive: boolean;
  eps: number;
  onOpenStream: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ events, riskScore, threatLevel, aiReasoning, isAnalyzing, timeline, onEventClick, onMitigate, mitigationActive, eps, onOpenStream }) => {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  return (
    <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* TOP SECTION: Intelligence Ingest & Real-time AI */}
      <div className="lg:col-span-4 flex flex-col h-[700px]">
        <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] flex flex-col flex-1 overflow-hidden shadow-2xl relative backdrop-blur-3xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40 shrink-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Security Ingest
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] text-emerald-500 font-black uppercase">Active Stream</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <EventStream events={events} onEventClick={onEventClick} />
          </div>
          <div className="mt-auto border-t border-slate-800 p-6 bg-slate-950/60 shrink-0">
             <KafkaMetrics eps={eps} onOpenStream={onOpenStream} />
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6 flex flex-col h-[700px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
          {/* Main Risk Display */}
          <div className="md:col-span-5 bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-10 shadow-xl flex flex-col justify-center items-center relative overflow-hidden group">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 mb-12 w-full text-center shrink-0">Real-time Risk Index</h2>
            <div className="flex-1 flex items-center justify-center w-full">
              <RiskMeter score={riskScore} level={threatLevel} />
            </div>
          </div>

          {/* AI Reasoning Module */}
          <div className="md:col-span-7 bg-[#0f172a] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col border-t-indigo-500/50 relative">
            <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center shrink-0">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className={`${isAnalyzing ? 'animate-spin text-indigo-400' : 'text-indigo-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                </span>
                AI Reasoning Engine <span className="text-slate-600 text-[8px] tracking-normal font-bold">v3.0.PRO</span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-10 flex flex-col items-center justify-center gap-4">
                  <div className="h-12 w-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Deep Neural Processing...</span>
                </div>
              )}
              <AIExplanation reasoning={aiReasoning} onMitigate={onMitigate} mitigationActive={mitigationActive} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Intelligence Matrix */}
      <div className={`lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 pb-12 transition-all ${isMapFullscreen ? 'min-h-0' : 'min-h-[750px]'}`}>
        {/* Map Column */}
        <div className={`${isMapFullscreen ? 'col-span-12' : 'md:col-span-8'} flex flex-col gap-6 h-full`}>
          {/* Global Attack Surface Map Container */}
          <div className={`${isMapFullscreen ? 'fixed inset-0 z-[200] bg-[#020617] rounded-none p-0 overflow-hidden transform-gpu' : 'flex-[3] bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-4 shadow-2xl flex flex-col overflow-hidden'} relative transition-all duration-500`}>
            <div className={`px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-800/50 ${isMapFullscreen ? 'bg-slate-900/90 backdrop-blur-2xl z-20' : 'mb-2'}`}>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-500"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Global Attack Surface
              </h2>
              <div className="flex items-center gap-4">
                 <div className="flex gap-2 mr-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Synchronized Live</span>
                 </div>
                 
                 <button 
                  onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                  className={`p-2 rounded-xl transition-all shadow-xl ${isMapFullscreen ? 'bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-500/20' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  title={isMapFullscreen ? "Exit Tactical View" : "Enter Tactical View"}
                 >
                   {isMapFullscreen ? (
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5"/></svg>
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 3 6 6M9 21l-6-6M21 3l-6 6M3 21l6-6"/></svg>
                   )}
                 </button>
              </div>
            </div>
            
            <div className={`flex-1 relative ${isMapFullscreen ? 'h-[calc(100vh-68px)]' : 'rounded-[1.5rem] overflow-hidden'}`}>
              <ThreatMap events={events} />
            </div>

            {isMapFullscreen && (
              <div className="absolute bottom-10 left-10 z-[210] pointer-events-none animate-in slide-in-from-left duration-700">
                 <div className="bg-slate-900/90 backdrop-blur-2xl border border-indigo-500/30 p-8 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-l-4 border-l-indigo-500">
                    <h3 className="text-white font-black text-[10px] mb-1 tracking-[0.3em] uppercase opacity-70">Tactical Overlook</h3>
                    <p className="text-[12px] text-white font-black uppercase tracking-widest mb-6">Real-time Ingress Vectors</p>
                    <div className="flex gap-16">
                       <div className="flex flex-col">
                          <span className="text-[9px] text-indigo-400 font-black mb-1 uppercase tracking-widest">ACTIVE_THREATS</span>
                          <span className="text-3xl font-black text-white mono">{events.filter(e => e.severity === 'critical').length}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] text-indigo-400 font-black mb-1 uppercase tracking-widest">SOURCE_NODES</span>
                          <span className="text-3xl font-black text-white mono">{new Set(events.map(e => e.sourceIp)).size}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] text-indigo-400 font-black mb-1 uppercase tracking-widest">THREAT_LEVEL</span>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full mt-2 inline-block border ${threatLevel === 'Critical' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500'}`}>
                            {threatLevel.toUpperCase()}
                          </span>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Historical Risk - Only visible when not in fullscreen */}
          {!isMapFullscreen && (
            <div className="flex-[2] bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Risk Trajectory</h2>
                  <p className="text-[8px] font-bold text-slate-600 uppercase">30-Minute Telemetry Window</p>
                </div>
                <div className="bg-indigo-500/5 border border-indigo-500/10 px-3 py-1 rounded text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                  Real-time Propagation
                </div>
              </div>
              <div className="flex-1">
                <Timeline data={timeline} />
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR - Hide when Map is fullscreen to avoid overlap issues */}
        {!isMapFullscreen && (
          <div className="md:col-span-4 bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col h-full">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Ingress Origins</h2>
                <p className="text-[8px] font-bold text-slate-600 uppercase">Top Malicious Sources</p>
              </div>
              <span className="text-[24px] font-black text-white mono opacity-5">MATRIX-01</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <TopSources events={events} />
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800/50">
               <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Geo-Fence Status</span>
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-emerald-500" />
                     <span className="text-[10px] text-white font-bold mono">AUTO_BLOCK: ACTIVE</span>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
