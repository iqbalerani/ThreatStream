
import React, { useState } from 'react';
import { SecurityEvent, EventStatus, Severity } from '../types';

interface EventStreamProps {
  events: SecurityEvent[];
  onEventClick: (event: SecurityEvent) => void;
}

const EventStream: React.FC<EventStreamProps> = ({ events, onEventClick }) => {
  const [filter, setFilter] = useState<Severity | 'ALL'>('ALL');

  const filteredEvents = filter === 'ALL' 
    ? events 
    : events.filter(e => e.severity === filter);

  const getSeverityStyles = (sev: Severity) => {
    switch (sev) {
      case Severity.CRITICAL: return 'bg-red-500 text-white';
      case Severity.HIGH: return 'bg-orange-500 text-white';
      case Severity.MEDIUM: return 'bg-amber-400 text-slate-900';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-800 flex gap-2 overflow-x-auto">
        {['ALL', Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.INFO].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase transition-all whitespace-nowrap ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-600 text-xs">No matching events in stream buffer.</div>
        ) : (
          filteredEvents.map((event) => (
            <div 
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`group p-4 border-b border-slate-800 hover:bg-slate-800/60 cursor-pointer transition-all relative ${event.severity === Severity.CRITICAL ? 'bg-red-500/5' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${getSeverityStyles(event.severity)}`}>
                    {event.severity}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                    {event.type}
                  </span>
                </div>
                <span className="mono text-[10px] text-slate-600 font-bold">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="mono text-xs text-slate-200 group-hover:text-indigo-400 transition-colors font-bold">
                    {event.sourceIp}
                  </span>
                  <p className="text-[10px] text-slate-500 truncate w-48 mt-1">
                    {event.description}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-slate-400">{event.country}</span>
                   {event.mitre && <span className="text-[9px] text-red-400 font-bold mt-1">MITRE: {event.mitre}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventStream;
