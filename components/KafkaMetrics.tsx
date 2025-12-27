
import React from 'react';

interface KafkaMetricsProps {
  eps: number;
  onOpenStream: () => void;
}

const KafkaMetrics: React.FC<KafkaMetricsProps> = ({ eps, onOpenStream }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-1">
         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Confluent Kafka Cluster</span>
         <button 
          onClick={onOpenStream}
          className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-400/20 hover:bg-indigo-500 hover:text-white transition-all"
         >
           VIEW LIVE STREAM
         </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
           <p className="text-[8px] text-slate-600 font-black uppercase">Ingest Topic</p>
           <p className="text-[10px] text-slate-300 mono truncate">security.raw.logs</p>
           <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xs font-black text-white">{eps}</span>
              <span className="text-[8px] text-slate-500">msg/sec</span>
           </div>
        </div>
        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
           <p className="text-[8px] text-slate-600 font-black uppercase">Consumer Lag</p>
           <p className="text-[10px] text-slate-300 mono">0ms</p>
           <div className="mt-1 flex items-center gap-1">
              <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[5%] shadow-[0_0_5px_rgba(99,102,241,1)]" />
              </div>
           </div>
        </div>
      </div>

      <div className="flex gap-2">
         {['p0', 'p1', 'p2'].map(p => (
           <div key={p} className="flex-1 flex items-center justify-center gap-1.5 p-1 bg-slate-900/50 border border-slate-800 rounded text-[8px] font-black text-slate-500 uppercase">
             <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
             Partition {p}
           </div>
         ))}
      </div>
    </div>
  );
};

export default KafkaMetrics;
