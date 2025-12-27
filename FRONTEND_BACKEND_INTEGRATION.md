# ThreatStream Frontend-Backend Integration Guide

## 🎯 Overview

This document describes how the ThreatStream React frontend integrates with the FastAPI backend for real-time threat detection and analysis.

---

## 📋 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   App.tsx    │  │ Components   │  │   Services   │     │
│  │              │  │              │  │              │     │
│  │ - WebSocket  │  │ - Dashboard  │  │ - backend    │     │
│  │ - State Mgmt │  │ - EventStream│  │ - websocket  │     │
│  │ - Scenarios  │  │ - ThreatMap  │  │ - gemini     │     │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘     │
│         │                                    │             │
└─────────┼────────────────────────────────────┼─────────────┘
          │                                    │
          │ WebSocket                          │ REST API
          │ (Real-time)                        │ (HTTP)
          │                                    │
┌─────────┼────────────────────────────────────┼─────────────┐
│         ▼                                    ▼             │
│  ┌──────────────┐         BACKEND (FastAPI)               │
│  │  WebSocket   │  ┌──────────────┐  ┌──────────────┐    │
│  │   Manager    │  │   Services   │  │   API Routes │    │
│  │              │  │              │  │              │    │
│  │ - broadcast  │  │ - threats    │  │ /api/threats │    │
│  │ - heartbeat  │  │ - alerts     │  │ /api/alerts  │    │
│  │              │  │ - analytics  │  │ /api/analytics│   │
│  └──────────────┘  │ - playbooks  │  │ /api/playbooks│   │
│                    │ - gemini AI  │  └──────────────┘    │
│                    └──────────────┘                       │
│                           ▲                               │
│                           │                               │
│                    ┌──────┴───────┐                       │
│                    │ Kafka/Gemini │                       │
│                    └──────────────┘                       │
└───────────────────────────────────────────────────────────┘
```

---

## 🔌 Integration Components

### 1. Environment Configuration

**File:** `.env.local`

```bash
# Gemini AI API Key (optional - backend also has Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# Backend URLs
VITE_BACKEND_API_URL=http://localhost:8000
VITE_BACKEND_WS_URL=ws://localhost:8000/ws/live

# Environment
VITE_ENVIRONMENT=development
```

### 2. Type System

#### Backend Types (`backendTypes.ts`)
- Matches Python Pydantic models exactly
- Enums: `BackendSeverityLevel`, `BackendThreatType`, `BackendIPZone`
- Models: `BackendThreat`, `BackendAlert`, `BackendDashboardStats`
- WebSocket message types

#### Type Mappers (`typeMappers.ts`)
- `mapBackendThreatToSecurityEvent()` - Convert backend Threat → frontend SecurityEvent
- `mapBackendDashboardStatsToFrontend()` - Convert stats
- `createSimulationEvent()` - Generate test events for scenarios

### 3. Service Layer

#### WebSocket Service (`services/websocketService.ts`)

**Features:**
- Automatic connection management
- Auto-reconnection with exponential backoff
- Message routing and parsing
- Status change notifications

**Usage:**
```typescript
import { getWebSocketService } from './services/websocketService';

const ws = getWebSocketService();

// Connect
ws.connect();

// Subscribe to messages
ws.onMessage((message) => {
  switch (message.type) {
    case 'new_threat':
      // Handle new threat
      break;
    case 'new_alert':
      // Handle new alert
      break;
  }
});

// Subscribe to status changes
ws.onStatus((status) => {
  console.log('WebSocket status:', status);
});

// Disconnect
ws.disconnect();
```

#### Backend API Service (`services/backendService.ts`)

**Available Methods:**

**Health:**
- `getHealth()` - System health check

**Threats:**
- `getRecentThreats(limit, severity?)` - Get recent threats
- `getThreatById(id)` - Get specific threat
- `getThreatStats()` - Get threat statistics

**Alerts:**
- `getActiveAlerts(limit)` - Get active alerts
- `acknowledgeAlert(id, analystId, notes?)` - Acknowledge alert
- `resolveAlert(id, analystId, resolution, notes?)` - Resolve alert

**Analytics:**
- `getDashboardMetrics()` - Get dashboard stats
- `getRiskIndex()` - Get current risk index
- `getRiskTimeline()` - Get risk timeline
- `getAnalyticsSummary()` - Get complete analytics

**Playbooks:**
- `getPlaybooks()` - List playbooks
- `executePlaybook(playbookId, threatId)` - Execute playbook
- `getPlaybookHistory(limit)` - Get execution history

**Simulation:**
- `simulateEvent(eventData)` - Simulate a security event

**Usage:**
```typescript
import { BackendService } from './services/backendService';

// Get recent threats
const response = await BackendService.getRecentThreats(50, 'CRITICAL');

// Simulate an event
await BackendService.simulateEvent({
  event_id: 'test-001',
  timestamp: new Date().toISOString(),
  event_type: 'brute_force',
  source_ip: '185.234.72.91',
  destination_ip: '10.0.0.100',
  destination_port: 22,
  protocol: 'TCP',
  payload: { attempts: 150 },
  metadata: {}
});
```

---

## 🔄 Data Flow

### 1. Initial Load

```
Frontend                        Backend
   │                               │
   │──── WebSocket.connect() ─────▶│
   │                               │
   │◀─── initial_state message ────│
   │                               │
   │  Parse threats/alerts/stats   │
   │  Update UI state              │
   │                               │
```

### 2. Real-time Threat Detection

```
Backend                         Frontend
   │                               │
   │  Event → Processor → AI       │
   │  Analysis → Risk Score        │
   │                               │
   │──── new_threat message ──────▶│
   │                               │
   │                          Map to SecurityEvent
   │                          Add to event stream
   │                          Update risk score
   │                          Update UI
```

### 3. Scenario Simulation

```
Frontend                        Backend
   │                               │
   │  User selects scenario        │
   │  (brute_force/ddos/etc)       │
   │                               │
   │──── POST /api/simulate/event ▶│
   │                               │
   │                          Process event
   │                          Generate threat
   │                          Broadcast via WS
   │                               │
   │◀─── new_threat message ───────│
   │                               │
   │  Display in UI                │
```

---

## 🚀 Running the Integrated System

### Step 1: Start Backend

```bash
cd backend
uvicorn app.main:app --reload
```

**Expected output:**
```
🚀 Starting ThreatStream Backend...
✅ ThreatStream Backend started successfully
📡 Kafka: security.raw.logs
🧠 AI Engine: gemini-1.5-flash
🌍 Environment: development
🔌 WebSocket Manager: Active
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 2: Configure Frontend

Edit `.env.local`:
```bash
GEMINI_API_KEY=your_key_here
VITE_BACKEND_API_URL=http://localhost:8000
VITE_BACKEND_WS_URL=ws://localhost:8000/ws/live
```

### Step 3: Start Frontend

```bash
npm run dev
```

**Expected output:**
```
VITE v6.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://0.0.0.0:3000/
```

### Step 4: Verify Connection

Open browser console and look for:
```
Connecting to WebSocket: ws://localhost:8000/ws/live
WebSocket connected successfully
Received initial state from backend
```

---

## 🧪 Testing the Integration

### 1. Health Check

```bash
curl http://localhost:8000/api/health
```

Expected:
```json
{
  "status": "healthy",
  "version": "3.2.0",
  "environment": "development",
  "services": {
    "kafka": "configured",
    "gemini": "configured",
    "firestore": "configured"
  }
}
```

### 2. Test Event Simulation

In the frontend:
1. Click the Demo Controls panel (bottom right)
2. Select a scenario (Brute Force, SQL Injection, DDoS, Ransomware)
3. Watch events appear in real-time
4. Observe risk score changes
5. See AI analysis in the reasoning panel

### 3. Verify WebSocket Messages

In browser console:
```javascript
// All WebSocket messages are logged
// Look for:
// - new_threat
// - new_alert
// - metrics_update
// - risk_update
```

### 4. Test REST API

```bash
# Get recent threats
curl http://localhost:8000/api/threats/recent?limit=10

# Get analytics dashboard
curl http://localhost:8000/api/analytics/dashboard

# Simulate an event
curl -X POST http://localhost:8000/api/simulate/event \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "manual-test-001",
    "timestamp": "2025-12-27T20:00:00Z",
    "event_type": "brute_force",
    "source_ip": "185.234.72.91",
    "destination_ip": "10.0.0.100",
    "destination_port": 22,
    "protocol": "TCP",
    "payload": {"attempts": 150},
    "metadata": {}
  }'
```

---

## 🔍 Key Integration Points in App.tsx

### WebSocket Connection

```typescript
// Initialize WebSocket
const wsRef = useRef(getWebSocketService());

useEffect(() => {
  const ws = wsRef.current;
  ws.connect();

  // Handle messages
  const unsubscribeMessages = ws.onMessage((message) => {
    switch (message.type) {
      case 'initial_state':
        // Load initial data
        break;
      case 'new_threat':
        // Add new threat
        break;
      case 'metrics_update':
        // Update stats
        break;
    }
  });

  // Handle status
  const unsubscribeStatus = ws.onStatus((status) => {
    setIsStreaming(status === 'connected');
  });

  return () => {
    unsubscribeMessages();
    unsubscribeStatus();
    ws.disconnect();
  };
}, []);
```

### Scenario Simulation

```typescript
useEffect(() => {
  if (!isStreaming || scenario === 'normal') return;

  const interval = setInterval(async () => {
    try {
      const eventData = createSimulationEvent(scenario);
      await BackendService.simulateEvent(eventData);
    } catch (error) {
      console.error('Error simulating event:', error);
    }
  }, 400);

  return () => clearInterval(interval);
}, [isStreaming, scenario]);
```

---

## 📊 WebSocket Message Types

### 1. Initial State
```json
{
  "type": "initial_state",
  "data": {
    "threats": [...],
    "alerts": [...],
    "risk_index": { "value": 25, "level": "LOW", "trend": "STABLE" },
    "stats": { "processed": 100, "blocked": 5, ... }
  }
}
```

### 2. New Threat
```json
{
  "type": "new_threat",
  "data": {
    "id": "THR-ABC123",
    "severity": "CRITICAL",
    "threat_type": "BRUTE_FORCE",
    "source_ip": "185.234.72.91",
    "risk_score": 85,
    ...
  }
}
```

### 3. New Alert
```json
{
  "type": "new_alert",
  "data": {
    "id": "ALT-123",
    "threat_id": "THR-ABC123",
    "severity": "CRITICAL",
    "priority": "P1",
    ...
  }
}
```

### 4. Metrics Update
```json
{
  "type": "metrics_update",
  "data": {
    "processed": 105,
    "blocked": 6,
    "critical": 2,
    "avg_detect_time": 125,
    ...
  }
}
```

### 5. Risk Update
```json
{
  "type": "risk_update",
  "data": {
    "value": 75,
    "level": "HIGH",
    "trend": "RISING"
  }
}
```

---

## 🐛 Troubleshooting

### Frontend Can't Connect to Backend

**Symptoms:**
- "WebSocket error" in console
- Events not appearing
- Connection status stuck on "connecting"

**Solutions:**
1. Verify backend is running: `curl http://localhost:8000/api/health`
2. Check `.env.local` has correct URLs
3. Check browser console for CORS errors
4. Restart both frontend and backend

### No Events Appearing

**Symptoms:**
- Connected but no events in stream
- Risk score not updating

**Solutions:**
1. Check scenario is set (not "normal")
2. Verify `/api/simulate/event` returns success
3. Check browser console for WebSocket messages
4. Restart backend to clear in-memory state

### Type Errors

**Symptoms:**
- TypeScript errors about mismatched types
- Data not displaying correctly

**Solutions:**
1. Ensure `backendTypes.ts` matches backend models
2. Check `typeMappers.ts` conversions
3. Verify backend API response format

### Performance Issues

**Symptoms:**
- UI lag
- High memory usage
- Slow rendering

**Solutions:**
1. Reduce event simulation frequency (increase interval)
2. Limit event stream to 50 items (already done)
3. Check browser DevTools Performance tab
4. Consider implementing virtual scrolling for event list

---

## 📝 Development Notes

### Frontend-Only Mode
To run frontend without backend (fallback mode):
- Comment out WebSocket connection in App.tsx
- Uncomment old simulation code
- Frontend will generate mock events locally

### Backend-Only Testing
```bash
# Test backend directly
curl -X POST http://localhost:8000/api/simulate/event -H "Content-Type: application/json" -d @test-event.json

# Monitor WebSocket in terminal
websocat ws://localhost:8000/ws/live
```

### Adding New Features

**To add a new backend endpoint:**
1. Create route in `backend/app/api/routes/`
2. Add function in `services/backendService.ts`
3. Use in components via `BackendService.yourFunction()`

**To add a new WebSocket message type:**
1. Add type to `BackendWebSocketMessage` union in `backendTypes.ts`
2. Handle in `App.tsx` WebSocket message switch
3. Update components to display new data

---

## ✅ Integration Checklist

- [x] Backend running on http://localhost:8000
- [x] Frontend running on http://localhost:3000
- [x] `.env.local` configured with backend URLs
- [x] WebSocket connection established
- [x] Initial state loading correctly
- [x] Real-time threats appearing in stream
- [x] Risk score updating from backend
- [x] Dashboard stats from backend
- [x] Scenario simulation working
- [x] AI analysis displaying (backend or frontend)
- [x] ThreatMap showing attack vectors
- [x] Alerts system functional

---

## 🎓 Key Concepts

### Why WebSocket?
- **Real-time updates**: Threats appear instantly
- **Efficient**: One connection for all updates
- **Bi-directional**: Frontend can request state

### Why REST API?
- **CRUD operations**: Alert acknowledgment, playbook execution
- **Historical data**: Get past threats, analytics
- **Stateless**: Easy to test and debug

### Type Safety
- Backend uses Pydantic (Python type validation)
- Frontend uses TypeScript (compile-time type checking)
- `backendTypes.ts` bridges the gap
- `typeMappers.ts` ensures compatibility

---

## 🚀 Production Considerations

For production deployment:

1. **Update URLs** in `.env.local`:
   ```bash
   VITE_BACKEND_API_URL=https://api.threatstream.com
   VITE_BACKEND_WS_URL=wss://api.threatstream.com/ws/live
   ```

2. **Enable HTTPS/WSS** (required for production)

3. **Add Authentication**:
   - JWT tokens for API requests
   - Token-based WebSocket auth

4. **Configure CORS** properly in backend

5. **Add Error Boundaries** in React

6. **Implement Logging**:
   - Frontend: Sentry, LogRocket
   - Backend: Cloud Logging

7. **Performance Monitoring**:
   - Frontend: Web Vitals
   - Backend: Prometheus metrics

---

## 📚 Additional Resources

- **Backend API Docs**: http://localhost:8000/docs (Swagger UI)
- **Backend ReDoc**: http://localhost:8000/redoc
- **Backend Completion Status**: See `backend/COMPLETION_STATUS.md`
- **Frontend Types**: See `types.ts`
- **Backend Types**: See `backend/app/models/*.py`

---

**Last Updated:** 2025-12-27
**Version:** 1.0.0
**Integration Status:** ✅ Complete
