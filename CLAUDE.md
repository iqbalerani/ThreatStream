# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThreatStream is a real-time AI-powered cybersecurity threat detection and analysis platform consisting of a React frontend and FastAPI backend. The platform operates as a Security Operations Center (SOC) dashboard that ingests security events via Kafka, analyzes them using Google Gemini AI, stores results in Firestore, and provides real-time visualizations.

**Frontend Tech Stack**: React 19, TypeScript, Vite, Google Gemini AI (client-side), Three.js (react-globe.gl), Recharts, Tailwind CSS

**Backend Tech Stack**: Python 3.11+, FastAPI, Confluent Kafka, Google Gemini AI, Firestore, WebSocket, Uvicorn

## Repository Structure

```
ThreatStream/
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/         # API routes & WebSocket handlers
│   │   ├── core/        # Kafka, Gemini, infrastructure
│   │   ├── services/    # Business logic services
│   │   ├── models/      # Pydantic data models
│   │   ├── utils/       # Helper functions
│   │   ├── config.py    # Configuration management
│   │   └── main.py      # FastAPI application
│   ├── simulator/       # Attack simulation engine
│   ├── tests/           # Test suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
├── (frontend files)     # React frontend (root level)
├── components/
├── index.tsx
├── App.tsx
├── types.ts
├── geminiService.ts
└── CLAUDE.md           # This file
```

## Development Commands

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
cp .env.example .env
# Edit .env with your API keys and configuration

# Run backend server (http://localhost:8000)
uvicorn app.main:app --reload

# Run with Docker
docker-compose up --build

# Run tests
pytest tests/ -v
```

## Environment Configuration

### Frontend (.env.local in root)

```bash
# Gemini AI API Key (optional - backend also has Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Backend API Configuration
VITE_BACKEND_API_URL=http://localhost:8000
VITE_BACKEND_WS_URL=ws://localhost:8000/ws/live

# Environment
VITE_ENVIRONMENT=development
```

The Vite config exposes these as `process.env.*` and `import.meta.env.VITE_*` to the application.

### Backend (backend/.env)

```bash
# Application
ENVIRONMENT=development
DEBUG=true
API_HOST=0.0.0.0
API_PORT=8000

# Confluent Cloud (Kafka)
CONFLUENT_BOOTSTRAP_SERVERS=your-kafka-server:9092
CONFLUENT_API_KEY=your-api-key
CONFLUENT_API_SECRET=your-api-secret
KAFKA_RAW_TOPIC=security.raw.logs
KAFKA_ANALYZED_TOPIC=security.analyzed.threats

# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash

# CORS
CORS_ORIGINS=http://localhost:3000

# See backend/.env.example for complete configuration
```

## Project Architecture

### Entry Point & Main Application

- **index.html**: Application shell with Tailwind CDN, import maps for ESM modules, and initial loader
- **index.tsx**: React app mount point
- **App.tsx**: Main application logic containing:
  - Event stream simulation with configurable attack scenarios
  - Risk scoring algorithm that updates based on event severity
  - AI analysis triggers (every 15s when threat level is elevated)
  - Mitigation playbook execution
  - State management for all dashboard components

### Type System

**types.ts** defines the core domain models:
- `SecurityEvent`: Individual security events with IP, user, severity, country, coordinates, MITRE ATT&CK mapping
- `AIReasoning`: AI-generated threat analysis with explanation, confidence, MITRE mapping, and recommended actions
- `ForensicReport`: Detailed investigation reports for specific incidents
- `ThreatLevel`: NORMAL | SUSPICIOUS | CRITICAL
- `ScenarioType`: Attack simulation modes (normal, brute_force, sql_injection, ddos, ransomware)

### AI Integration

**geminiService.ts** provides two main functions:
- `analyzeThreat(events)`: Analyzes security events using Gemini 3 Flash with structured JSON output, MITRE ATT&CK mapping, and automatic retry logic for rate limits
- `generateForensicReport(event)`: Deep analysis using Gemini 3 Pro with extended thinking budget for comprehensive incident reports

### Component Structure

All components are in `/components`:

**Layout & Orchestration:**
- `Header.tsx`: Top navigation with threat level indicator and streaming status
- `Dashboard.tsx`: Main layout orchestrator - arranges all dashboard panels and handles fullscreen map mode
- `DemoControls.tsx`: Floating command center for controlling simulations (draggable, minimizable, scenario selector)

**Event & Data Display:**
- `EventStream.tsx`: Real-time scrolling list of security events with color-coded severity
- `LiveKafkaStream.tsx`: Modal overlay showing raw event data stream (simulates Kafka ingestion)
- `KafkaMetrics.tsx`: Events-per-second (EPS) display with stream viewer trigger
- `StatsBar.tsx`: Top-level metrics bar (processed events, blocked, critical count, detection latency)

**Analysis & Visualization:**
- `AIExplanation.tsx`: Displays Gemini AI reasoning, MITRE techniques, and mitigation controls
- `RiskMeter.tsx`: Circular risk gauge with animated needle (0-100 scale)
- `Timeline.tsx`: 30-minute risk score history chart using Recharts
- `ThreatMap.tsx`: 3D globe visualization of attack origins using react-globe.gl
- `TopSources.tsx`: Ranked list of malicious source IPs/countries

**Details:**
- `DetailDrawer.tsx`: Slide-in panel showing full forensic details for selected events

### State Management Pattern

App.tsx uses React hooks for centralized state:
- Event generation happens in `useEffect` with interval based on `isStreaming` and `scenario`
- Risk score auto-escalates during attack scenarios, decreases during mitigation
- AI analysis triggers automatically when `threatLevel !== NORMAL` (with 15s cooldown)
- Timeline data maintains last 30 data points for historical visualization

### Attack Simulation System

**DemoControls.tsx** exposes 5 scenarios defined in `ATTACKS` array:
1. **normal**: Baseline traffic (US, DE, GB, IN, BR sources)
2. **brute_force**: MITRE T1110 - Authentication failures from RU, CN, KP, IR
3. **sql_injection**: MITRE T1190 - WAF alerts with SQL patterns
4. **ddos**: MITRE T1498 - UDP flood from distributed sources
5. **ransomware**: MITRE T1486 - File encryption signals

When an attack scenario is active:
- Event generation rate increases (400ms vs 1200ms interval)
- Events originate from adversarial countries (Russia, China, North Korea, Iran)
- Risk score escalates rapidly
- AI analysis triggers to explain the attack pattern

### Path Aliases

`tsconfig.json` and `vite.config.ts` define:
```
"@/*" → project root
```

Use `import { foo } from '@/types'` instead of relative paths.

### Styling Conventions

- Tailwind classes via CDN (configured in index.html)
- Dark theme: Primary bg `#020617` (slate-950), card bg `#0f172a` (slate-900)
- Color scheme: Indigo for primary UI, Red for critical threats, Emerald for healthy state
- Custom fonts: Inter (UI), JetBrains Mono (code/data)
- Custom scrollbar styling defined in index.html

### Key Development Patterns

1. **Event Coordinates**: `COUNTRY_COORDS` object in App.tsx maps country codes to lat/lng for globe visualization
2. **MITRE Mapping**: Events include optional `mitre` field (e.g., "T1110") that AI service expands into full technique descriptions
3. **Mitigation Playbook**: `handleExecuteMitigation()` in App.tsx simulates automated response with sequential steps
4. **Responsive Fullscreen**: ThreatMap supports fullscreen mode that hides sidebar and shows tactical overlay
5. **Drag & Drop**: DemoControls panel is draggable using mouse events

## Common Workflows

**Adding a new attack scenario:**
1. Add scenario type to `ScenarioType` in types.ts
2. Add configuration to `ATTACKS` array in DemoControls.tsx
3. Add event generation logic in App.tsx `useEffect` switch statement
4. Assign appropriate MITRE technique code

**Modifying AI analysis:**
- Edit prompts and schema in `geminiService.ts`
- Adjust trigger conditions in App.tsx (currently: threat level + 15s cooldown)
- Change analysis frequency by modifying `lastAnalysisRef` comparison

**Customizing visualizations:**
- Timeline: Modify Recharts config in Timeline.tsx
- Globe: Adjust Three.js settings in ThreatMap.tsx (altitude, arc colors, point sizes)
- Risk Meter: Change thresholds and colors in RiskMeter.tsx

---

# Backend Architecture

## Core Components

### Configuration (`backend/app/config.py`)
- Pydantic Settings for type-safe configuration
- Environment variable loading with validation
- Kafka and Google Cloud connection builders
- CORS origins parser

### Data Models (`backend/app/models/`)
- **threat.py**: SecurityEvent, Threat, GeminiAnalysis, SeverityLevel, ThreatType, RiskLevel enums
- **alert.py**: Alert, AlertStatus, AlertPriority enums
- **analytics.py**: DashboardStats, TimelineData, TopSource models
- **simulation.py**: ScenarioType, SimulationConfig, AttackPattern
- **playbook.py**: Playbook, PlaybookExecution, PlaybookAction

### Utilities (`backend/app/utils/`)
- **logger.py**: Structured logging configuration
- **mitre_mapping.py**: MITRE ATT&CK technique database and lookup functions
- **ip_utils.py**: IP validation, zone classification, risk multipliers

### Core Infrastructure (`backend/app/core/`)
- **kafka_consumer.py**: Confluent Kafka consumer wrapper with handler registration
- **kafka_producer.py**: Kafka producer for publishing analyzed threats
- **gemini_analyzer.py**: Google Gemini AI integration for threat analysis with fallback logic

## Backend Data Flow

1. **Event Ingestion**: Kafka consumer polls `security.raw.logs` topic
2. **Geo Enrichment**: IP → Country → Coordinates → Zone classification
3. **AI Analysis**: Gemini analyzer classifies threat with MITRE mapping
4. **Risk Scoring**: Multi-factor algorithm (severity + confidence + type + context)
5. **Storage**: Threat persisted to Firestore
6. **Alert Generation**: CRITICAL/HIGH threats create alerts
7. **Broadcasting**: WebSocket pushes to connected clients
8. **Kafka Publication**: Analyzed threat published to `security.analyzed.threats`

## Backend Development Patterns

### Adding API Endpoints
1. Create route file in `backend/app/api/routes/`
2. Define route with FastAPI decorators and Pydantic models
3. Include router in `backend/app/main.py`
4. Document with OpenAPI docstrings

### Implementing Services
1. Create service file in `backend/app/services/`
2. Inject dependencies (database, Kafka, etc.)
3. Implement business logic with proper error handling
4. Return Pydantic models for type safety

### Attack Simulation
1. Create scenario in `backend/simulator/scenarios/`
2. Define event patterns with MITRE mappings
3. Configure generation rates and source countries
4. Register in simulation service

## Backend API Overview

- `GET /api/health` - System health check
- `GET /api/threats/recent` - Recent threat list
- `GET /api/analytics/dashboard` - Dashboard metrics
- `POST /api/simulation/start` - Start attack simulation
- `POST /api/playbooks/execute` - Execute response playbook
- `WS /ws/live` - Real-time threat stream (WebSocket)

## Testing Backend

```bash
cd backend
pytest tests/ -v --cov=app
```

## Deployment Notes

- Backend requires Confluent Cloud (Kafka) account
- Google Cloud Platform project for Gemini & Firestore
- Environment variables must be configured in `.env`
- Docker Compose available for local development
- Production deployment via Cloud Run or Kubernetes

---

# Frontend-Backend Integration

## Overview

The ThreatStream frontend now integrates with the FastAPI backend for **real-time threat detection** and analysis. The integration replaces simulated event generation with live data from the backend via WebSocket and REST API.

## Integration Architecture

### Service Layer (`services/`)

**backendService.ts** - REST API client:
- Health checks
- Threat retrieval (recent, by ID, stats)
- Alert management (active, acknowledge, resolve)
- Analytics (dashboard metrics, risk index, timeline)
- Playbook operations (list, execute, history)
- Event simulation for testing

**websocketService.ts** - WebSocket manager:
- Auto-connection with reconnection logic
- Message routing and parsing
- Status change notifications
- Bi-directional communication

### Type System

**backendTypes.ts** - Backend API types:
- Matches Python Pydantic models exactly
- Enums: `BackendSeverityLevel`, `BackendThreatType`, `BackendIPZone`, etc.
- Models: `BackendThreat`, `BackendAlert`, `BackendDashboardStats`
- WebSocket message types: `initial_state`, `new_threat`, `new_alert`, `metrics_update`, `risk_update`

**typeMappers.ts** - Type conversions:
- `mapBackendThreatToSecurityEvent()` - Convert backend Threat → frontend SecurityEvent
- `mapBackendDashboardStatsToFrontend()` - Convert stats
- `createSimulationEvent()` - Generate test events for scenarios

### Modified Components

**App.tsx** - Main integration point:
- WebSocket connection on mount via `getWebSocketService()`
- Message handler for `initial_state`, `new_threat`, `new_alert`, `metrics_update`, `risk_update`
- Scenario simulation sends events to `/api/simulate/event` endpoint
- Real-time event stream updates from WebSocket messages
- Stats and risk score updates from backend

## Data Flow

### 1. Initial Load
```
Frontend → WebSocket.connect() → Backend
Frontend ← initial_state message ← Backend
Frontend parses threats/alerts/stats and updates UI
```

### 2. Real-time Threat Detection
```
Backend: Event → Processor → AI Analysis → Risk Score
Backend → new_threat message → Frontend
Frontend: Map to SecurityEvent → Add to stream → Update UI
```

### 3. Scenario Simulation
```
Frontend: User selects scenario
Frontend → POST /api/simulate/event → Backend
Backend: Process event → Generate threat → Broadcast
Backend → new_threat message → Frontend
Frontend: Display in UI
```

## Running the Integrated System

### Start Backend First
```bash
cd backend
uvicorn app.main:app --reload
# Backend runs on http://localhost:8000
# WebSocket at ws://localhost:8000/ws/live
```

### Start Frontend
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### Verify Integration
Open browser console and look for:
```
Connecting to WebSocket: ws://localhost:8000/ws/live
WebSocket connected successfully
Received initial state from backend
```

## Testing Integration

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Simulate Event
Use the Demo Controls panel in the UI to select a scenario (Brute Force, SQL Injection, DDoS, Ransomware), and events will be sent to the backend for processing.

### View Backend API Docs
```
http://localhost:8000/docs (Swagger UI)
http://localhost:8000/redoc (ReDoc)
```

## WebSocket Message Types

**initial_state**: Initial data load (threats, alerts, risk index, stats)
**new_threat**: New threat detected and analyzed
**new_alert**: Critical/high severity alert created
**metrics_update**: Dashboard stats update
**risk_update**: Risk index change
**heartbeat**: Keep-alive ping (ignored by frontend)

## Key Files

**Integration Files:**
- `.env.local` - Frontend environment configuration
- `backendTypes.ts` - Backend type definitions
- `typeMappers.ts` - Type conversion utilities
- `services/backendService.ts` - REST API client
- `services/websocketService.ts` - WebSocket manager
- `FRONTEND_BACKEND_INTEGRATION.md` - Complete integration guide

**Modified Files:**
- `App.tsx` - WebSocket connection and message handling
- `vite.config.ts` - Backend URL environment variables

## Common Integration Tasks

**Adding a new backend endpoint:**
1. Create route in `backend/app/api/routes/`
2. Add function in `services/backendService.ts`
3. Use in components via `BackendService.yourFunction()`

**Adding a new WebSocket message type:**
1. Add to `BackendWebSocketMessage` union in `backendTypes.ts`
2. Handle in `App.tsx` WebSocket message switch
3. Update components to display new data

**Debugging connection issues:**
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Verify `.env.local` URLs are correct
3. Check browser console for WebSocket errors
4. Restart both frontend and backend

## Documentation

**Full Integration Guide**: See `FRONTEND_BACKEND_INTEGRATION.md` for comprehensive documentation including:
- Architecture diagrams
- Complete API reference
- Message type specifications
- Troubleshooting guide
- Production deployment notes

**Backend Documentation**: See `backend/COMPLETION_STATUS.md` for backend implementation status and testing guide
