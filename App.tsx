
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DetailDrawer from './components/DetailDrawer';
import DemoControls from './components/DemoControls';
import StatsBar from './components/StatsBar';
import LiveKafkaStream from './components/LiveKafkaStream';
import { SecurityEvent, EventStatus, EventType, ThreatLevel, AIReasoning, TimelineData, Severity, DashboardStats, ScenarioType } from './types';
import { analyzeThreat } from './geminiService';
import { getWebSocketService } from './services/websocketService';
import { BackendService } from './services/backendService';
import { mapBackendThreatToSecurityEvent, mapBackendDashboardStatsToFrontend, createSimulationEvent } from './typeMappers';
import { BackendWebSocketMessage } from './backendTypes';

const COUNTRY_COORDS: Record<string, [number, number]> = {
  'US': [37.0902, -95.7129],
  'CN': [35.8617, 104.1954],
  'RU': [61.5240, 105.3188],
  'DE': [51.1657, 10.4515],
  'GB': [55.3781, -3.4360],
  'IN': [20.5937, 78.9629],
  'BR': [-14.2350, -51.9253],
  'KP': [40.3399, 127.5101],
  'IR': [32.4279, 53.6880]
};

const INITIAL_REASONING: AIReasoning = {
  explanation: "System telemetry indicates healthy operation. No significant deviations from established behavioral baselines detected in the current stream window.",
  factors: ["Normal packet frequency", "Authorized endpoint access", "Known geo-distribution"],
  confidence: 'High',
  summary: "Infrastructure operating within normal parameters.",
  mitreAttack: "N/A - Healthy Baseline",
  recommendedActions: ["Maintain monitoring", "Run routine log rotation"]
};

const App: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [riskScore, setRiskScore] = useState(12);
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(ThreatLevel.NORMAL);
  const [isStreaming, setIsStreaming] = useState(true);
  const [eps, setEps] = useState(0);
  const [aiReasoning, setAiReasoning] = useState<AIReasoning>(INITIAL_REASONING);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [showLiveStream, setShowLiveStream] = useState(false);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [scenario, setScenario] = useState<ScenarioType>('normal');
  const [mitigationActive, setMitigationActive] = useState(false);
  const [playbookStep, setPlaybookStep] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    processed: 12847,
    blocked: 234,
    critical: 0,
    avgDetectTime: 127,
    latencyHistory: [130, 125, 128, 122, 127, 120, 115, 118, 110, 105]
  });

  const eventIdCounter = useRef(0);
  const lastAnalysisRef = useRef(0);
  const wsRef = useRef(getWebSocketService());

  // WebSocket connection and message handling
  useEffect(() => {
    const ws = wsRef.current;

    // Connect to backend WebSocket
    ws.connect();

    // Handle WebSocket messages
    const unsubscribeMessages = ws.onMessage((message: BackendWebSocketMessage) => {
      switch (message.type) {
        case 'initial_state':
          // Load initial state from backend
          console.log('Received initial state from backend');
          const initialEvents = message.data.threats.map(mapBackendThreatToSecurityEvent);
          setEvents(initialEvents.slice(0, 50));
          if (message.data.stats) {
            setStats(mapBackendDashboardStatsToFrontend(message.data.stats));
          }
          if (message.data.risk_index) {
            setRiskScore(message.data.risk_index.value);
          }
          break;

        case 'new_threat':
          // Add new threat to event stream
          const newEvent = mapBackendThreatToSecurityEvent(message.data);
          setEvents(prev => [newEvent, ...prev].slice(0, 50));

          // Update risk score based on threat severity
          if (message.data.risk_score) {
            setRiskScore(message.data.risk_score);
          }
          break;

        case 'new_alert':
          // Handle new alert (could show notification)
          console.log('New alert:', message.data);
          break;

        case 'metrics_update':
          // Update dashboard stats
          setStats(mapBackendDashboardStatsToFrontend(message.data));
          break;

        case 'risk_update':
          // Update risk score
          setRiskScore(message.data.value);
          break;
      }
    });

    // Handle WebSocket status changes
    const unsubscribeStatus = ws.onStatus((status) => {
      console.log('WebSocket status:', status);
      setIsStreaming(status === 'connected');
    });

    // Cleanup on unmount
    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      ws.disconnect();
    };
  }, []);

  // Scenario simulation - send events to backend when scenario changes
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(async () => {
      try {
        const eventData = createSimulationEvent(scenario);
        await BackendService.simulateEvent(eventData);
      } catch (error) {
        console.error('Error simulating event:', error);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isStreaming, scenario]);

  useEffect(() => {
    if (riskScore > 65) setThreatLevel(ThreatLevel.CRITICAL);
    else if (riskScore > 35) setThreatLevel(ThreatLevel.SUSPICIOUS);
    else setThreatLevel(ThreatLevel.NORMAL);

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    setTimeline(prev => [...prev, { time: timeStr, risk: riskScore }].slice(-30));
  }, [riskScore]);

  useEffect(() => {
    if (threatLevel !== ThreatLevel.NORMAL && (Date.now() - lastAnalysisRef.current > 15000) && !isAnalyzing) {
      lastAnalysisRef.current = Date.now();
      const criticalEvents = events.filter(e => e.severity === Severity.CRITICAL).slice(0, 5);
      if (criticalEvents.length > 0) {
        setIsAnalyzing(true);
        analyzeThreat(criticalEvents).then((res) => {
          setAiReasoning(res);
          setIsAnalyzing(false);
        }).catch(() => setIsAnalyzing(false));
      }
    } else if (threatLevel === ThreatLevel.NORMAL && aiReasoning.summary !== INITIAL_REASONING.summary) {
      setAiReasoning(INITIAL_REASONING);
      setMitigationActive(false);
    }
  }, [threatLevel, events, aiReasoning.summary, isAnalyzing]);

  const resetSystem = () => {
    setEvents([]);
    setRiskScore(12);
    setThreatLevel(ThreatLevel.NORMAL);
    setScenario('normal');
    setAiReasoning(INITIAL_REASONING);
    setMitigationActive(false);
    setPlaybookStep(null);

    // Reconnect to WebSocket to get fresh state
    const ws = wsRef.current;
    ws.disconnect();
    setTimeout(() => {
      ws.connect();
    }, 500);
  };

  const handleExecuteMitigation = async () => {
    setMitigationActive(true);
    const steps = ["ISOLATING_TARGET_SEGMENTS", "ENACTING_ACL_OVERRIDE", "RESETTING_SESSION_HANDSHAKES", "DEPLOYING_IP_QUARANTINE"];
    for (const step of steps) {
      setPlaybookStep(step);
      await new Promise(r => setTimeout(r, 1200));
    }
    setPlaybookStep("PROTECTION_VERIFIED");
    setTimeout(() => setPlaybookStep(null), 3000);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-1000 ${threatLevel === ThreatLevel.CRITICAL ? 'bg-red-950/20' : 'bg-[#060b18]'}`}>
      <Header threatLevel={threatLevel} isStreaming={isStreaming} eps={eps} />
      
      <div className="px-6 py-4">
        <StatsBar stats={stats} />
      </div>

      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full pb-40">
        <Dashboard 
          events={events}
          riskScore={riskScore}
          threatLevel={threatLevel}
          aiReasoning={aiReasoning}
          isAnalyzing={isAnalyzing}
          timeline={timeline}
          onEventClick={setSelectedEvent}
          onMitigate={handleExecuteMitigation}
          mitigationActive={mitigationActive}
          eps={eps}
          onOpenStream={() => setShowLiveStream(true)}
        />
      </main>

      <DemoControls 
        isStreaming={isStreaming} setIsStreaming={setIsStreaming}
        scenario={scenario} setScenario={setScenario}
        onReset={resetSystem}
      />

      {selectedEvent && (
        <DetailDrawer 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
          aiReasoning={aiReasoning}
        />
      )}

      {showLiveStream && (
        <LiveKafkaStream 
          events={events} 
          eps={eps} 
          onClose={() => setShowLiveStream(false)} 
        />
      )}

      {playbookStep && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top duration-300">
           <div className="bg-slate-900 border border-indigo-500/50 px-8 py-4 rounded-full shadow-[0_0_50px_rgba(99,102,241,0.3)] flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">AI Playbook Active</span>
             </div>
             <div className="h-4 w-px bg-slate-800" />
             <span className="mono text-xs font-bold text-white tracking-widest">{playbookStep}</span>
             {playbookStep === "PROTECTION_VERIFIED" ? (
                <svg className="text-emerald-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
             ) : (
                <div className="h-4 w-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
             )}
           </div>
        </div>
      )}

      {threatLevel === ThreatLevel.CRITICAL && (
        <div className="fixed inset-0 border-[12px] border-red-600/20 animate-pulse pointer-events-none z-[60]" />
      )}
    </div>
  );
};

export default App;
