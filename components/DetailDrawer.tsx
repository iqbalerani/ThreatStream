
import React, { useState } from 'react';
import { SecurityEvent, AIReasoning, EventStatus, Severity, ForensicReport } from '../types';
import { generateForensicReport } from '../geminiService';

interface DetailDrawerProps {
  event: SecurityEvent;
  aiReasoning: AIReasoning;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ event, onClose, aiReasoning }) => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);
  const [isGeneratingForensics, setIsGeneratingForensics] = useState(false);

  const handleBlock = () => {
    setIsBlocking(true);
    setTimeout(() => {
      setIsBlocking(false);
      setIsDone(true);
      setTimeout(onClose, 1000);
    }, 2000);
  };

  const handleGenerateForensics = async () => {
    setIsGeneratingForensics(true);
    try {
      const report = await generateForensicReport(event);
      setForensicReport(report);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingForensics(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity" onClick={onClose} />
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-[#0b0f1a] border-l border-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-white tracking-tighter">Incident Forensic Deep-Dive</h2>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                event.severity === Severity.CRITICAL ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-slate-700'
              }`}>
                {event.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] text-indigo-500 mono uppercase tracking-[0.3em] font-black">LOG_ID: {event.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-4 hover:bg-slate-800 rounded-2xl text-slate-500 transition-all hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          {/* Core Telemetry */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] relative group">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-3 tracking-widest">Origin Vector</p>
              <p className="text-xl mono text-white font-black group-hover:text-indigo-400 transition-colors">{event.sourceIp}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-300 font-black uppercase tracking-tight bg-slate-800 px-2 py-0.5 rounded">{event.country} Segment</span>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] relative group">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-3 tracking-widest">Target Subject</p>
              <p className="text-xl mono text-white font-black group-hover:text-indigo-400 transition-colors">{event.userId}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded ${event.status === EventStatus.SUSPICIOUS ? 'text-red-400 bg-red-400/10' : 'text-slate-400 bg-slate-800'}`}>
                  STATUS: {event.status}
                </span>
              </div>
            </div>
          </div>

          {/* AI Intelligence Block */}
          <section className="bg-indigo-500/5 border border-indigo-500/20 p-8 rounded-[2.5rem] relative overflow-hidden">
             <div className="flex items-center gap-4 mb-8">
               <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
               </div>
               <div>
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">Advanced Pattern Analysis</h3>
                 <p className="text-[10px] text-indigo-400 font-bold mono">Model: Gemini-3-Pro-Forensics</p>
               </div>
             </div>

             <div className="space-y-8">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">MITRE Technique</h4>
                    <p className="text-sm font-black text-white">{aiReasoning.mitreAttack || 'TBD'}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Confidence Score</h4>
                    <p className={`text-sm font-black ${aiReasoning.confidence === 'High' ? 'text-emerald-400' : 'text-amber-400'}`}>{aiReasoning.confidence}</p>
                  </div>
               </div>

               <div>
                 <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Investigative Summary</h4>
                 <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50">
                   "{aiReasoning.explanation}"
                 </p>
               </div>
             </div>

             <div className="mt-8 flex justify-center">
                {!forensicReport && !isGeneratingForensics && (
                  <button 
                    onClick={handleGenerateForensics}
                    className="group bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:scale-105"
                  >
                    Generate Full Forensic Report
                    <svg className="group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                )}
                {isGeneratingForensics && (
                  <div className="flex items-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                    <div className="h-4 w-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    Synthesizing Evidence...
                  </div>
                )}
             </div>
          </section>

          {/* Forensic Results */}
          {forensicReport && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="border-l-4 border-indigo-500 pl-6">
                <h4 className="text-[10px] font-black text-indigo-500 uppercase mb-4 tracking-widest">Technical Investigation Findings</h4>
                <div className="space-y-6">
                   <div className="prose prose-invert prose-sm">
                      <p className="text-slate-300 leading-relaxed">{forensicReport.technicalDetails}</p>
                   </div>
                   
                   <div>
                     <h5 className="text-[9px] font-black text-slate-500 uppercase mb-3">Threat Timeline</h5>
                     <div className="space-y-2">
                       {forensicReport.timeline.map((item, i) => (
                         <div key={i} className="flex gap-4 items-start text-[11px]">
                           <span className="mono text-indigo-400 font-bold shrink-0">Step {i+1}</span>
                           <span className="text-slate-300 font-medium">{item}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                   <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl">
                     <h5 className="text-[9px] font-black text-red-500 uppercase mb-2 tracking-widest">Risk Assessment</h5>
                     <p className="text-xs text-red-200/80 font-medium leading-relaxed">{forensicReport.riskAssessment}</p>
                   </div>
                </div>
              </div>
            </section>
          )}

          {/* Action Checklist */}
          <section>
            <h4 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-widest">Response Strategy</h4>
            <div className="space-y-4">
              {aiReasoning.recommendedActions.map((action, i) => (
                <div key={i} className="group flex items-center justify-between p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all hover:bg-slate-900">
                  <div className="flex items-center gap-5">
                    <div className="h-3 w-3 rounded-full bg-indigo-500/50 group-hover:bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all" />
                    <span className="text-xs text-slate-200 font-bold tracking-tight">{action}</span>
                  </div>
                  <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Deploy</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Action Bar */}
        <div className="p-8 border-t border-slate-800 bg-slate-900/60 flex gap-4 backdrop-blur-md">
           <button 
             onClick={handleBlock}
             disabled={isBlocking || isDone}
             className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 ${
               isDone ? 'bg-emerald-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
             }`}
           >
             {isBlocking ? (
               <span className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
             ) : isDone ? (
               <>INCIDENT QUARANTINED <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></>
             ) : (
               'Immediate Isolation'
             )}
           </button>
           <button 
             onClick={onClose}
             className="px-10 py-5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default DetailDrawer;
