# Feature: Attack Scenario Simulation

**Component:** `DemoControls.tsx`
**Backend Endpoint:** `POST /api/simulate/event`
**Purpose:** Test threat detection with simulated attacks

---

## Overview

The Attack Simulation feature allows users to trigger realistic security events to test the threat detection system. Multiple attack scenarios are available (Brute Force, SQL Injection, DDoS, Ransomware), each generating events that flow through the entire processing pipeline as if they were real threats.

---

## UI Component

### Component: `DemoControls`

**Location:** `components/DemoControls.tsx`

**Features:**
- Floating draggable control panel
- Scenario selector (dropdown)
- Stream controls (pause/resume)
- System reset button
- Attack duration timer
- Minimizable interface

**Available Scenarios:**
1. **HEALTHY FLOW** - Normal operation (no threats)
2. **BRUTE FORCE** - Credential stuffing attacks
3. **SQL ATTACK** - SQL injection attempts
4. **DDOS BURST** - Distributed denial of service
5. **RANSOMWARE** - File encryption signals

---

## Required Backend Endpoint

### Simulate Security Event

#### **Endpoint:** `POST /api/simulate/event`

**Purpose:** Simulate a security event for testing

**Request Body:**
```json
{
  "event_id": "SIM-1766854407",
  "timestamp": "2025-12-27T16:53:27.000000Z",
  "event_type": "brute_force",
  "source_ip": "185.234.72.91",
  "destination_ip": "10.0.0.100",
  "destination_port": 22,
  "protocol": "TCP",
  "payload": {
    "attempts": 150,
    "usernames": ["admin", "root", "user"],
    "duration_seconds": 300
  },
  "metadata": {
    "scenario": "brute_force",
    "test": true
  }
}
```

**Example Response:**
```json
{
  "status": "success",
  "threat": {
    "id": "THR-8B00500B",
    "event_id": "SIM-1766854407",
    "severity": "CRITICAL",
    "risk_score": 78,
    "description": "Event detected: brute_force"
  },
  "message": "Event processed successfully"
}
```

---

## Event Templates

### File: `typeMappers.ts`

```typescript
export function createSimulationEvent(scenario: string): any {
  const timestamp = new Date().toISOString();
  const eventId = `SIM-${Date.now()}`;

  const scenarios: Record<string, any> = {
    brute_force: {
      event_id: eventId,
      timestamp,
      event_type: 'brute_force',
      source_ip: randomIP(),
      destination_ip: '10.0.0.100',
      destination_port: 22,
      protocol: 'TCP',
      payload: { attempts: randomInt(50, 200) },
      metadata: { scenario: 'brute_force' }
    },
    sql_injection: {
      event_id: eventId,
      timestamp,
      event_type: 'sql_injection',
      source_ip: randomIP(),
      destination_ip: '10.0.0.200',
      destination_port: 443,
      protocol: 'HTTPS',
      payload: { query: "' OR '1'='1' --" },
      metadata: { scenario: 'sql_injection' }
    },
    ddos: {
      event_id: eventId,
      timestamp,
      event_type: 'ddos',
      source_ip: randomIP(),
      destination_ip: '10.0.0.1',
      destination_port: 80,
      protocol: 'UDP',
      payload: { packets_per_sec: randomInt(5000, 15000) },
      metadata: { scenario: 'ddos' }
    },
    ransomware: {
      event_id: eventId,
      timestamp,
      event_type: 'ransomware',
      source_ip: `10.0.0.${randomInt(1, 255)}`,
      destination_ip: '10.0.0.250',
      destination_port: 445,
      protocol: 'SMB',
      payload: { encrypted_files: randomInt(100, 1000) },
      metadata: { scenario: 'ransomware' }
    }
  };

  return scenarios[scenario] || scenarios.normal;
}
```

---

## Frontend Implementation

### Simulation Loop

**File:** `App.tsx` (lines 129-142)

```typescript
// Scenario simulation - send events to backend when scenario changes
useEffect(() => {
  if (!isStreaming || scenario === 'normal') return;

  const interval = setInterval(async () => {
    try {
      const eventData = createSimulationEvent(scenario);
      await BackendService.simulateEvent(eventData);
    } catch (error) {
      console.error('Error simulating event:', error);
    }
  }, 400);  // Send event every 400ms (2.5 EPS)

  return () => clearInterval(interval);
}, [isStreaming, scenario]);
```

**Event Rate:** 2.5 events per second (configurable via interval)

---

## Backend Processing

### Expected Behavior

The backend should treat simulated events identically to real events:

1. **Receive event** via `POST /api/simulate/event`
2. **Process event** through threat detection pipeline:
   - Geo-enrichment (IP → country)
   - Risk scoring
   - AI analysis (optional)
   - Alert generation (if CRITICAL/HIGH)
3. **Store threat** in database/memory
4. **Broadcast** via WebSocket:
   - `new_threat` message
   - `metrics_update` message
   - `risk_update` message (optional)
5. **Return response** to client

---

## Scenario Configurations

### Attack Profiles

**File:** `components/DemoControls.tsx` (lines 13-18)

```typescript
const ATTACKS: AttackConfig[] = [
  {
    id: 'brute_force',
    label: 'BRUTE FORCE',
    icon: '🔐',
    severity: 'HIGH',
    description: 'Simulated credential stuffing'
  },
  {
    id: 'sql_injection',
    label: 'SQL ATTACK',
    icon: '💉',
    severity: 'CRITICAL',
    description: 'Pattern-based injection'
  },
  {
    id: 'ddos',
    label: 'DDOS BURST',
    icon: '🌊',
    severity: 'CRITICAL',
    description: 'Massive UDP flood'
  },
  {
    id: 'ransomware',
    label: 'RANSOMWARE',
    icon: '💀',
    severity: 'CRITICAL',
    description: 'File encryption signal'
  }
];
```

---

## UI Behavior

### Scenario Selection

1. User clicks "TRIGGER ATTACK" button
2. Dropdown appears with attack options
3. User selects attack scenario
4. Button turns red and shows scenario name
5. Timer starts counting duration

### Event Generation

- Events generated every 400ms (2.5 EPS)
- Random source IPs for realistic distribution
- Continues until user selects "HEALTHY FLOW"

### System Reset

Click "RESET_SYS" to:
- Stop simulation
- Clear events
- Reset risk score to baseline
- Reconnect WebSocket (refresh state)

---

## Data Types

### Request Type

**File:** `backendTypes.ts`

```typescript
export interface BackendSimulateEventRequest {
  event_id: string;
  timestamp: string;
  event_type: string;
  source_ip: string;
  destination_ip: string;
  destination_port: number;
  protocol: string;
  payload: Record<string, any>;
  metadata: Record<string, any>;
}
```

### Response Type

```typescript
export interface BackendSimulateEventResponse {
  status: 'success' | 'error';
  threat?: BackendThreat;
  message: string;
}
```

---

## Testing

### Manual Testing

1. Start backend
2. Open frontend
3. Click "TRIGGER ATTACK" → Select "BRUTE FORCE"
4. Verify:
   - Events appear in stream every ~400ms
   - Risk score increases
   - Threat map shows attack arcs
   - AI analysis triggers (if enabled)
   - Stats update

### Performance Testing

1. Run simulation for 5 minutes
2. Monitor:
   - Event processing latency
   - Memory usage
   - WebSocket connection stability
   - Frontend responsiveness

---

## Backend Requirements

### Must Implement

1. ✅ **POST endpoint:** `/api/simulate/event`
2. ✅ **Event processing:** Treat simulated events as real
3. ✅ **WebSocket broadcast:** Send updates to connected clients
4. ✅ **Validation:** Reject malformed events

### Optional Enhancements

1. **Rate limiting:** Prevent simulation abuse
2. **Simulation flag:** Mark events as `test: true` in metadata
3. **Batch simulation:** Accept array of events

---

## Related Features

- [FEATURE_THREAT_STREAM.md](./FEATURE_THREAT_STREAM.md) - Displays simulated events
- [FEATURE_RISK_ANALYSIS.md](./FEATURE_RISK_ANALYSIS.md) - Risk score changes
- [API_REFERENCE.md](./API_REFERENCE.md) - API specification

---

**Last Updated:** December 27, 2025
