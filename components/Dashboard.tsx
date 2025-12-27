
import React from 'react';
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
  return (
    <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* LEFT COLUMN: Intelligence Ingest */}
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

      {/* RIGHT COLUMN: Real-time Analytics & AI */}
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

      {/* BOTTOM ROW: The Intelligence Matrix (Expanded) */}
      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 h-[480px]">
        {/* Global Vectors (Larger Map) */}
        <div className="md:col-span-6 bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800/50 mb-2 flex justify-between items-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-500"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Global Attack Surface
            </h2>
            <div className="flex gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Synchronized Live</span>
            </div>
          </div>
          <div className="flex-1 rounded-[1.5rem] overflow-hidden">
            <ThreatMap events={events} />
          </div>
        </div>

        {/* Historical Risk */}
        <div className="md:col-span-3 bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
          <div className="mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Risk Trajectory</h2>
            <p className="text-[8px] font-bold text-slate-600 uppercase">30-Minute Telemetry Window</p>
          </div>
          <div className="flex-1">
            <Timeline data={timeline} />
          </div>
        </div>

        {/* Origin Distribution */}
        <div className="md:col-span-3 bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Ingress Origins</h2>
              <p className="text-[8px] font-bold text-slate-600 uppercase">Top Malicious Sources</p>
            </div>
            <span className="text-[18px] font-black text-white mono opacity-10">#01</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <TopSources events={events} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
