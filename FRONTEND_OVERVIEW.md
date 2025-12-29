# ThreatStream Frontend - Architecture Overview

**Version:** 3.2.0
**Framework:** React 19 + TypeScript + Vite
**Real-time Protocol:** WebSocket
**API Protocol:** REST (JSON)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Features Summary](#features-summary)
5. [Backend Integration](#backend-integration)
6. [Data Flow](#data-flow)
7. [Component Hierarchy](#component-hierarchy)

---

## Architecture Overview

ThreatStream is a real-time AI-powered cybersecurity threat detection platform with a React-based frontend that connects to a Python FastAPI backend.

### Key Architectural Principles

- **Real-time First**: WebSocket-driven architecture for sub-second threat updates
- **Type-Safe**: Full TypeScript coverage with backend type mappings
- **Component-Based**: Modular React components with clear responsibilities
- **Declarative State**: React hooks for state management
- **Graceful Degradation**: Fallback UI for offline/error states

---

## Technology Stack

### Core Framework
- **React 19** - UI framework
- **TypeScript 5.x** - Type safety
- **Vite** - Build tool and dev server

### Visualization
- **react-globe.gl** - 3D globe visualization for threat mapping
- **D3.js** - Charts and data visualization
- **Tailwind CSS** - Styling framework

### Real-time Communication
- **WebSocket API** - Native WebSocket for backend connection
- **Singleton Pattern** - WebSocket service instance management

### AI Integration
- **Google Gemini AI** - Client-side threat analysis (optional)
- **Backend AI Engine** - Server-side threat analysis (primary)

---

## Project Structure

```
ThreatStream/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard layout
│   ├── EventStream.tsx  # Real-time event feed
│   ├── ThreatMap.tsx    # 3D globe visualization
│   ├── RiskMeter.tsx    # Risk score gauge
│   ├── AIExplanation.tsx # AI reasoning display
│   ├── Timeline.tsx     # Risk timeline chart
│   ├── TopSources.tsx   # Top threat sources
│   ├── StatsBar.tsx     # Dashboard stats bar
│   ├── DetailDrawer.tsx # Event detail drawer
│   ├── DemoControls.tsx # Scenario simulation controls
│   ├── Header.tsx       # App header
│   ├── KafkaMetrics.tsx # Kafka/event metrics
│   └── LiveKafkaStream.tsx # Live stream modal
│
├── services/            # Service layer
│   ├── backendService.ts    # REST API client
│   └── websocketService.ts  # WebSocket client
│
├── types.ts             # Frontend type definitions
├── backendTypes.ts      # Backend API type definitions
├── typeMappers.ts       # Type conversion utilities
├── geminiService.ts     # Gemini AI client
├── constants.tsx        # App constants
├── App.tsx             # Root component
└── index.tsx           # Entry point
```

---

## Features Summary

### 1. **Real-time Threat Stream**
- Live event feed via WebSocket
- Filter by severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)
- Click to view detailed threat information
- Auto-scroll with newest threats

### 2. **Dashboard Statistics**
- Total events processed
- Blocked events count
- Critical threats count
- Average detection time
- Processing latency history

### 3. **Risk Analysis**
- Real-time risk score (0-100)
- Threat level classification (Normal, Suspicious, Critical)
- 30-minute risk timeline graph
- Automatic risk calculations

### 4. **AI-Powered Reasoning**
- Contextual threat analysis
- MITRE ATT&CK framework mapping
- Recommended mitigation actions
- Confidence scoring
- Automated playbook execution

### 5. **3D Threat Map**
- Global threat visualization on 3D globe
- Real-time attack vector arcs
- Source geolocation
- Interactive globe controls
- Fullscreen tactical view

### 6. **Alert Management**
- Active alert monitoring
- Alert acknowledgment
- Alert resolution workflow
- Priority-based filtering

### 7. **Automated Playbooks**
- Pre-configured response playbooks
- Automated mitigation execution
- Playbook execution history
- Step-by-step progress tracking

### 8. **Attack Simulation**
- Scenario-based attack simulation
- Multiple attack vectors (Brute Force, SQL Injection, DDoS, Ransomware)
- Configurable event rate
- System reset capabilities

### 9. **Analytics & Reporting**
- Top threat sources by IP/country
- Threat distribution analysis
- Historical trend analysis
- Kafka/event stream metrics

---

## Backend Integration

### REST API Endpoints

The frontend communicates with the backend via REST API for:
- Initial data loading
- Historical data queries
- Alert management
- Playbook execution
- Attack simulation

**Base URL:** `http://localhost:8000` (configurable via `VITE_BACKEND_API_URL`)

See [API_REFERENCE.md](./API_REFERENCE.md) for complete endpoint documentation.

### WebSocket Connection

Real-time updates are delivered via WebSocket:

**WebSocket URL:** `ws://localhost:8000/ws/live` (configurable via `VITE_BACKEND_WS_URL`)

See [WEBSOCKET_PROTOCOL.md](./WEBSOCKET_PROTOCOL.md) for message format specification.

---

## Data Flow

### Application Startup

```
1. User loads frontend (index.html)
   ↓
2. React app initializes (App.tsx)
   ↓
3. WebSocket connects to backend
   ↓
4. Backend sends initial_state message
   ↓
5. Frontend renders dashboard with initial data
```

### Real-time Threat Detection

```
1. Security event occurs (real or simulated)
   ↓
2. Backend processes event → creates threat
   ↓
3. Backend broadcasts new_threat via WebSocket
   ↓
4. Frontend receives message
   ↓
5. Frontend updates:
   - Event stream (new threat added)
   - Risk score (recalculated)
   - Dashboard stats (incremented)
   - Threat map (new attack arc)
   ↓
6. If CRITICAL/HIGH severity:
   - AI analysis triggered (optional)
   - Alert generated
   - new_alert broadcast
```

### Attack Simulation

```
1. User selects attack scenario (DemoControls)
   ↓
2. Frontend creates simulation event (typeMappers.ts)
   ↓
3. POST /api/simulate/event → backend
   ↓
4. Backend processes simulation as real threat
   ↓
5. WebSocket broadcasts new_threat
   ↓
6. Frontend updates in real-time
```

---

## Component Hierarchy

```
App.tsx
├── Header
│   ├── Threat Level Indicator
│   ├── Streaming Status
│   └── EPS (Events Per Second)
│
├── StatsBar
│   ├── Processed Count
│   ├── Blocked Count
│   ├── Critical Count
│   └── Avg Detection Time
│
├── Dashboard
│   ├── EventStream (Left Column)
│   │   ├── Severity Filter
│   │   └── Event List
│   │
│   ├── RiskMeter (Top Right)
│   │   └── Risk Score Gauge
│   │
│   ├── AIExplanation (Top Right)
│   │   ├── AI Analysis
│   │   ├── MITRE Mapping
│   │   └── Mitigation Button
│   │
│   ├── ThreatMap (Bottom Left)
│   │   ├── 3D Globe
│   │   ├── Attack Arcs
│   │   └── Fullscreen Toggle
│   │
│   ├── Timeline (Bottom Left)
│   │   └── Risk History Chart
│   │
│   └── TopSources (Bottom Right)
│       └── Source IP Rankings
│
├── DemoControls (Floating Bottom)
│   ├── Scenario Selector
│   ├── Stream Controls
│   └── System Reset
│
├── DetailDrawer (Conditional)
│   └── Event Details
│
└── LiveKafkaStream (Conditional)
    └── Full Event Stream
```

---

## State Management

### Global State (App.tsx)

```typescript
// Security Events
const [events, setEvents] = useState<SecurityEvent[]>([]);

// Risk Analysis
const [riskScore, setRiskScore] = useState(12);
const [threatLevel, setThreatLevel] = useState<ThreatLevel>(ThreatLevel.NORMAL);
const [timeline, setTimeline] = useState<TimelineData[]>([]);

// AI Reasoning
const [aiReasoning, setAiReasoning] = useState<AIReasoning>(INITIAL_REASONING);
const [isAnalyzing, setIsAnalyzing] = useState(false);

// Dashboard Stats
const [stats, setStats] = useState<DashboardStats>({ ... });

// Stream Controls
const [isStreaming, setIsStreaming] = useState(true);
const [eps, setEps] = useState(0);

// Simulation
const [scenario, setScenario] = useState<ScenarioType>('normal');
const [mitigationActive, setMitigationActive] = useState(false);
const [playbookStep, setPlaybookStep] = useState<string | null>(null);

// UI State
const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
const [showLiveStream, setShowLiveStream] = useState(false);
```

---

## Type System

### Frontend Types (`types.ts`)

Core domain models for UI layer:
- `SecurityEvent` - Threat event data
- `AIReasoning` - AI analysis results
- `DashboardStats` - Dashboard metrics
- `TimelineData` - Risk history points
- Enums: `EventType`, `Severity`, `ThreatLevel`, `EventStatus`

### Backend Types (`backendTypes.ts`)

API contract types matching backend Pydantic models:
- `BackendThreat` - Backend threat model
- `BackendAlert` - Backend alert model
- `BackendDashboardStats` - Backend metrics model
- `BackendWebSocketMessage` - WebSocket message union type

### Type Mappers (`typeMappers.ts`)

Conversion functions between backend and frontend types:
- `mapBackendThreatToSecurityEvent()` - Threat conversion
- `mapBackendDashboardStatsToFrontend()` - Stats conversion
- `createSimulationEvent()` - Event creation for simulation

---

## Environment Configuration

### Required Environment Variables

```bash
# Backend API URL
VITE_BACKEND_API_URL=http://localhost:8000

# Backend WebSocket URL
VITE_BACKEND_WS_URL=ws://localhost:8000/ws/live

# Environment
VITE_ENVIRONMENT=development

# Optional: Gemini API Key (for client-side AI)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## Build & Development

### Development Server

```bash
npm run dev
```

Starts Vite dev server on `http://localhost:3000`

### Production Build

```bash
npm run build
```

Creates optimized production build in `dist/`

### Type Checking

```bash
npm run type-check
```

Runs TypeScript compiler in check mode

---

## Performance Considerations

### WebSocket Connection
- Single persistent connection
- Automatic reconnection with exponential backoff
- Message batching for high-throughput scenarios

### Event Stream
- Limited to 50 most recent events
- Virtual scrolling for large lists
- Debounced filter updates

### 3D Globe
- Lazy loading (dynamic import)
- Fallback to 2D grid if WebGL unavailable
- Limited to 15 simultaneous attack arcs
- Auto-rotation disabled during interaction

### AI Analysis
- Rate-limited to once every 15 seconds
- Triggered only when threat level is SUSPICIOUS or CRITICAL
- Analyzes max 5 most recent critical events

---

## Error Handling

### WebSocket Errors
- Automatic reconnection (max 5 attempts)
- User notification via streaming status indicator
- Graceful fallback to REST API polling (not implemented)

### API Errors
- Try-catch wrapping all API calls
- Console error logging
- User-friendly error messages

### Rendering Errors
- React Error Boundaries (recommended to add)
- Component-level error states
- Fallback UI for critical failures

---

## Next Steps

For detailed feature documentation, see:

1. [FEATURE_THREAT_STREAM.md](./FEATURE_THREAT_STREAM.md) - Event stream implementation
2. [FEATURE_DASHBOARD_STATS.md](./FEATURE_DASHBOARD_STATS.md) - Dashboard metrics
3. [FEATURE_RISK_ANALYSIS.md](./FEATURE_RISK_ANALYSIS.md) - Risk scoring and timeline
4. [FEATURE_AI_REASONING.md](./FEATURE_AI_REASONING.md) - AI-powered analysis
5. [FEATURE_THREAT_MAP.md](./FEATURE_THREAT_MAP.md) - 3D visualization
6. [FEATURE_ALERTS.md](./FEATURE_ALERTS.md) - Alert management
7. [FEATURE_PLAYBOOKS.md](./FEATURE_PLAYBOOKS.md) - Automated response
8. [FEATURE_SIMULATION.md](./FEATURE_SIMULATION.md) - Attack scenarios
9. [FEATURE_ANALYTICS.md](./FEATURE_ANALYTICS.md) - Analytics and reporting
10. [WEBSOCKET_PROTOCOL.md](./WEBSOCKET_PROTOCOL.md) - WebSocket specification
11. [API_REFERENCE.md](./API_REFERENCE.md) - Complete API reference

---

**Last Updated:** December 27, 2025
**Maintained By:** ThreatStream Development Team
