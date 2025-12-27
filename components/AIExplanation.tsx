
import React from 'react';
import { AIReasoning } from '../types';

interface AIExplanationProps {
  reasoning: AIReasoning;
  onMitigate: () => void;
  mitigationActive: boolean;
}

const AIExplanation: React.FC<AIExplanationProps> = ({ reasoning, onMitigate, mitigationActive }) => {
  return (
    <div className="p-5 flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
           <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${
             reasoning.confidence === 'High' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 
             reasoning.confidence === 'Medium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-red-500/30 text-red-400 bg-red-500/5'
           }`}>
             CONFIDENCE: {reasoning.confidence.toUpperCase()}
           </span>
           <span className="text-[9px] font-bold text-slate-500 mono uppercase tracking-widest">Audit Ref: Gemini-Pro-Engine</span>
        </div>
        <p className="text-sm font-black text-white leading-snug tracking-tight">
          "{reasoning.summary}"
        </p>
      </div>

      <div className="mb-5 bg-slate-800/30 p-4 rounded-xl border border-slate-800/50">
        <h4 className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Contextual Analysis</h4>
        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
          {reasoning.explanation}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <h4 className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Contributing Signals</h4>
          <div className="flex flex-wrap gap-2">
            {reasoning.factors.map((factor, i) => (
              <span key={i} className="text-[9px] text-slate-400 bg-slate-800 border border-slate-700/50 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">
                {factor}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Automated Mitigation Path</h4>
          <ul className="space-y-1.5">
            {reasoning.recommendedActions.map((action, i) => (
              <li key={i} className="flex items-center gap-3 text-[10px] text-slate-300 font-bold bg-slate-800/40 p-2 rounded-lg border border-slate-800/50">
                <div className="h-3 w-3 rounded-full border border-indigo-500/50 flex items-center justify-center flex-shrink-0">
                  <div className={`h-1.5 w-1.5 rounded-full ${mitigationActive ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                </div>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto pt-4 flex gap-3">
         <button 
           onClick={onMitigate}
           disabled={mitigationActive}
           className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
             mitigationActive 
              ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 cursor-default' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-95'
           }`}
         >
           {mitigationActive ? (
             <>PLAYBOOK EXECUTED <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></>
           ) : (
             <>EXECUTE MITIGATIONS <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></>
           )}
         </button>
         <button className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
         </button>
      </div>
    </div>
  );
};

export default AIExplanation;
