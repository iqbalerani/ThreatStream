
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
  const [scenarioId, setScenarioId] = useState<number>(Date.now()); // Scenario epoch for state-aware streaming
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
  const lastAnalyzedLevelRef = useRef<ThreatLevel>(ThreatLevel.NORMAL);
  const wsRef = useRef(getWebSocketService());

  // WebSocket connection and message handling
  useEffect(() => {
    const ws = wsRef.current;

    // Connect to backend WebSocket
    ws.connect();

    // Handle WebSocket status changes
    const unsubscribeStatus = ws.onStatus((status) => {
      console.log('WebSocket status:', status);
      setIsStreaming(status === 'connected');

      // Send handshake with current scenario epoch when connection established
      if (status === 'connected') {
        ws.sendHandshake(scenarioId);
      }
    });

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
            const backendRisk = message.data.risk_index.value;

            // If in normal scenario and backend has stale high risk, reset to baseline
            const currentRisk = (scenario === 'normal' && backendRisk > 10) ? 5 : backendRisk;

            setRiskScore(currentRisk);

            // Initialize timeline with current risk (30 points for smooth chart)
            const now = new Date();
            const initialTimeline = Array.from({ length: 30 }, (_, i) => {
              const time = new Date(now.getTime() - (29 - i) * 1000);
              return {
                time: `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`,
                risk: currentRisk
              };
            });
            setTimeline(initialTimeline);

            console.debug('[Timeline Init] Scenario:', scenario, 'Backend risk:', backendRisk, 'Initialized at:', currentRisk);
          }
          break;

        case 'new_threat':
          // Add new threat to event stream (with deduplication)
          const newEvent = mapBackendThreatToSecurityEvent(message.data);
          setEvents(prev => {
            // Deduplicate: only add if event ID doesn't already exist
            if (prev.some(e => e.id === newEvent.id)) {
              return prev;
            }
            return [newEvent, ...prev].slice(0, 50);
          });

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

        case 'risk_timeline_update':
          // Real-time timeline update from Kafka stream
          // This provides smooth, time-based visualization of risk propagation
          setTimeline(prev =>
            [...prev, {
              time: message.data.time,
              risk: message.data.risk
            }].slice(-30)  // Keep last 30 points (sliding window ~1-5 min history)
          );
          console.debug('[Timeline Update] Kafka stream:', message.data.time, 'Risk:', message.data.risk);
          break;
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      ws.disconnect();
    };
  }, []); // Empty dependency - WebSocket connection stays stable

  // Send new handshake when scenario changes (without reconnecting WebSocket)
  useEffect(() => {
    const ws = wsRef.current;
    if (ws.getStatus() === 'connected') {
      ws.sendHandshake(scenarioId);
    }
  }, [scenarioId]);

  // Generate new scenario ID when scenario changes (state-aware streaming epoch)
  useEffect(() => {
    const newScenarioId = Date.now();
    setScenarioId(newScenarioId);

    // Clear old events when switching to normal for clean UX transition
    if (scenario === 'normal') {
      setEvents(prev => prev.slice(0, 3)); // Keep last 3 events for visual transition
    }

    console.log(`📌 Scenario changed to: ${scenario}, new epoch: ${newScenarioId}`);
  }, [scenario]);

  // Scenario simulation - send events to backend when scenario changes
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(async () => {
      try {
        const eventData = createSimulationEvent(scenario, scenarioId);
        await BackendService.simulateEvent(eventData);
      } catch (error) {
        console.error('Error simulating event:', error);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isStreaming, scenario, scenarioId]);

  // Update threat level based on risk score
  useEffect(() => {
    if (riskScore > 65) setThreatLevel(ThreatLevel.CRITICAL);
    else if (riskScore > 35) setThreatLevel(ThreatLevel.SUSPICIOUS);
    else setThreatLevel(ThreatLevel.NORMAL);
  }, [riskScore]);

  // Timeline updates now come from Kafka via WebSocket (risk_timeline_update messages)
  // This ensures timeline reflects real Kafka stream, not derived frontend state

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastAnalysis = now - lastAnalysisRef.current;
    const cooldownRemaining = Math.max(0, 120000 - timeSinceLastAnalysis);

    console.debug('[AI Trigger] Effect fired:', {
      threatLevel,
      lastAnalyzedLevel: lastAnalyzedLevelRef.current,
      isAnalyzing,
      timeSinceLastAnalysis: Math.round(timeSinceLastAnalysis / 1000) + 's',
      cooldownRemaining: Math.round(cooldownRemaining / 1000) + 's',
      eventCount: events.length
    });

    if (threatLevel !== ThreatLevel.NORMAL && !isAnalyzing) {
      const highPriorityEvents = events.filter(e =>
        e.severity === Severity.CRITICAL || e.severity === Severity.HIGH
      ).slice(0, 5);

      console.debug('[AI Trigger] High priority events found:', highPriorityEvents.length);

      if (highPriorityEvents.length > 0) {
        const levelChanged = threatLevel !== lastAnalyzedLevelRef.current;
        const cooldownExpired = timeSinceLastAnalysis > 120000;
        const isCritical = threatLevel === ThreatLevel.CRITICAL;

        console.debug('[AI Trigger] Analysis conditions:', {
          levelChanged,
          cooldownExpired,
          isCritical,
          lastAnalyzedLevel: lastAnalyzedLevelRef.current,
          currentLevel: threatLevel
        });

        // Analyze if:
        // 1. Threat level changed (NORMAL → SUSPICIOUS or SUSPICIOUS → CRITICAL)
        // 2. At SUSPICIOUS: cooldown expired (120s)
        // 3. At CRITICAL: level just changed to CRITICAL
        const shouldAnalyze = levelChanged || (cooldownExpired && !isCritical);

        console.debug('[AI Trigger] Should analyze:', shouldAnalyze);

        if (shouldAnalyze) {
          console.debug('[AI Trigger] 🧠 Starting AI analysis at level:', threatLevel);
          lastAnalysisRef.current = now;
          lastAnalyzedLevelRef.current = threatLevel;
          setIsAnalyzing(true);
          analyzeThreat(highPriorityEvents).then((res) => {
            console.debug('[AI Trigger] ✅ AI analysis complete');
            setAiReasoning(res);
            setIsAnalyzing(false);
          }).catch((err) => {
            console.error('[AI Trigger] ❌ AI analysis failed:', err);
            setIsAnalyzing(false);
          });
        }
      }
    } else if (threatLevel === ThreatLevel.NORMAL) {
      if (aiReasoning.summary !== INITIAL_REASONING.summary) {
        console.debug('[AI Trigger] 🔄 Resetting to normal state');
        setAiReasoning(INITIAL_REASONING);
        setMitigationActive(false);
        lastAnalyzedLevelRef.current = ThreatLevel.NORMAL;
      }
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
    lastAnalysisRef.current = 0;
    lastAnalyzedLevelRef.current = ThreatLevel.NORMAL;

    console.debug('[AI Trigger] 🔄 System reset');

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

      <main className={`flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full transition-all duration-300 ${scenario !== 'normal' ? 'pb-56' : 'pb-40'}`}>
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
