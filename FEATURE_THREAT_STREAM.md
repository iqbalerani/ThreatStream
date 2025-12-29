# Feature: Real-time Threat Stream

**Component:** `EventStream.tsx`
**Primary Communication:** WebSocket + REST API
**Update Frequency:** Real-time (< 1s latency)

---

## Overview

The Threat Stream is the core feature of ThreatStream, displaying a real-time feed of security events and threats as they are detected. Events are delivered via WebSocket for immediate display and can be filtered by severity level.

---

## UI Components

### Main Component: `EventStream`

**Location:** `components/EventStream.tsx`

**Props:**
```typescript
interface EventStreamProps {
  events: SecurityEvent[];  // Array of security events
  onEventClick: (event: SecurityEvent) => void;  // Click handler
}
```

**Features:**
- Real-time event feed (auto-updates via WebSocket)
- Severity filtering (ALL, CRITICAL, HIGH, MEDIUM, INFO)
- Event details on click
- Scrollable list (most recent at top)
- Visual indicators for CRITICAL severity

---

## Required Backend Endpoints

### 1. WebSocket Connection

#### **Endpoint:** `ws://localhost:8000/ws/live`

**Purpose:** Real-time threat delivery

**Message Types Received:**

#### `initial_state` - Initial data load
```json
{
  "type": "initial_state",
  "data": {
    "threats": [
      {
        "id": "THR-8B00500B",
        "event_id": "test-bf-1766854407",
        "timestamp": "2025-12-27T16:53:27.326181+00:00",
        "severity": "CRITICAL",
        "threat_type": "AUTHENTICATION",
        "risk_score": 78,
        "source_ip": "185.234.72.91",
        "source_country": "North Korea",
        "source_country_code": "KP",
        "source_zone": "HOSTILE_ZONE",
        "destination_ip": "10.0.0.100",
        "destination_port": 22,
        "confidence": 0.5,
        "description": "Event detected: brute_force",
        "contextual_analysis": "Fallback analysis - AI engine temporarily unavailable",
        "contributing_signals": ["185.234.72.91"],
        "mitre_attack_id": null,
        "mitre_attack_name": null,
        "recommended_actions": ["Review event manually", "Check related events"],
        "auto_blocked": false,
        "processing_time_ms": 1846,
        "analyzed_at": "2025-12-27T16:53:32.540332+00:00",
        "audit_ref": "FALLBACK-ENGINE"
      }
    ],
    "alerts": [],
    "risk_index": {
      "value": 85,
      "level": "SUSPICIOUS",
      "trend": "STABLE"
    },
    "stats": {
      "processed": 5,
      "blocked": 0,
      "critical": 5,
      "avg_detect_time": 689,
      "latency_history": [1846, 409, 397, 398, 398]
    }
  }
}
```

#### `new_threat` - New threat detected
```json
{
  "type": "new_threat",
  "data": {
    "id": "THR-D86E0BD7",
    "event_id": "test-sqli-1766854411",
    "timestamp": "2025-12-27T16:53:31.557615+00:00",
    "severity": "CRITICAL",
    "threat_type": "AUTHENTICATION",
    "risk_score": 73,
    "source_ip": "201.45.123.88",
    "source_country": "Iran",
    "source_country_code": "IR",
    "source_zone": "HOSTILE_ZONE",
    "destination_ip": "10.0.0.200",
    "destination_port": 443,
    "confidence": 0.5,
    "description": "Event detected: sql_injection",
    "contextual_analysis": "Fallback analysis - AI engine temporarily unavailable",
    "contributing_signals": ["201.45.123.88"],
    "mitre_attack_id": null,
    "mitre_attack_name": null,
    "recommended_actions": ["Review event manually", "Check related events"],
    "auto_blocked": false,
    "processing_time_ms": 409,
    "analyzed_at": "2025-12-27T16:53:32.951156+00:00",
    "audit_ref": "FALLBACK-ENGINE"
  }
}
```

---

### 2. REST API - Get Recent Threats

#### **Endpoint:** `GET /api/threats/recent`

**Purpose:** Fetch historical threats (fallback or initial load)

**Query Parameters:**
```typescript
{
  limit?: number;      // Max threats to return (default: 50)
  severity?: string;   // Filter by severity: CRITICAL, HIGH, MEDIUM, LOW, INFO
}
```

**Example Request:**
```http
GET /api/threats/recent?limit=50&severity=CRITICAL
Host: localhost:8000
```

**Example Response:**
```json
{
  "threats": [
    {
      "id": "THR-841CA944",
      "event_id": "test-malware-1766854418",
      "timestamp": "2025-12-27T16:53:38.013281+00:00",
      "severity": "CRITICAL",
      "threat_type": "AUTHENTICATION",
      "risk_score": 70,
      "source_ip": "10.0.3.15",
      "source_country": "Internal",
      "source_country_code": "XX",
      "source_zone": "INTERNAL_ZONE",
      "destination_ip": "185.234.72.91",
      "destination_port": 4444,
      "confidence": 0.5,
      "description": "Event detected: malware",
      "contextual_analysis": "Fallback analysis - AI engine temporarily unavailable",
      "contributing_signals": ["10.0.3.15"],
      "mitre_attack_id": null,
      "mitre_attack_name": null,
      "recommended_actions": ["Review event manually", "Check related events"],
      "auto_blocked": false,
      "processing_time_ms": 398,
      "analyzed_at": "2025-12-27T16:53:40.622200+00:00",
      "audit_ref": "FALLBACK-ENGINE"
    }
  ],
  "count": 1
}
```

---

## Frontend Implementation

### WebSocket Message Handling

**File:** `App.tsx` (lines 64-126)

```typescript
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
        setEvents(initialEvents.slice(0, 50));  // Limit to 50 events
        break;

      case 'new_threat':
        // Add new threat to event stream
        const newEvent = mapBackendThreatToSecurityEvent(message.data);
        setEvents(prev => [newEvent, ...prev].slice(0, 50));  // Add to front
        break;
    }
  });

  // Cleanup on unmount
  return () => {
    unsubscribeMessages();
    ws.disconnect();
  };
}, []);
```

### Type Mapping

**File:** `typeMappers.ts`

```typescript
/**
 * Convert backend Threat to frontend SecurityEvent
 */
export function mapBackendThreatToSecurityEvent(threat: BackendThreat): SecurityEvent {
  return {
    id: threat.id,
    timestamp: new Date(threat.timestamp),
    type: mapBackendThreatTypeToEventType(threat.threat_type),
    sourceIp: threat.source_ip,
    userId: `threat_${threat.id.slice(-8)}`,
    status: mapBackendThreatToEventStatus(threat),
    description: threat.description,
    severity: mapBackendSeverityToFrontend(threat.severity),
    country: threat.source_country_code || threat.source_country || 'Unknown',
    coordinates: getCoordinates(threat.source_country_code),
    mitre: threat.mitre_attack_id
  };
}
```

---

## Data Types

### Frontend Type: `SecurityEvent`

**File:** `types.ts`

```typescript
export interface SecurityEvent {
  id: string;                    // Threat ID (e.g., "THR-8B00500B")
  timestamp: Date;               // Event timestamp
  type: EventType;               // Event type enum
  sourceIp: string;              // Source IP address
  userId: string;                // Generated user ID
  status: EventStatus;           // Event status enum
  description: string;           // Threat description
  severity: Severity;            // Severity level
  country: string;               // Country name or code
  coordinates: [number, number]; // [lat, lng] for map
  mitre?: string;                // MITRE ATT&CK ID
}

export enum Severity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EventType {
  LOGIN = 'Login Attempt',
  API_REQ = 'API Request',
  FIREWALL = 'Firewall Event',
  AUTH = 'Authentication',
  FILE_ACCESS = 'File Access',
  SQL_INJ = 'SQL Injection',
  BRUTE_FORCE = 'Brute Force',
  DDOS = 'DDoS Attack',
  RANSOMWARE = 'Ransomware Signal'
}

export enum EventStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  SUSPICIOUS = 'suspicious',
  BLOCKED = 'blocked'
}
```

### Backend Type: `BackendThreat`

**File:** `backendTypes.ts`

```typescript
export interface BackendThreat {
  id: string;
  event_id: string;
  timestamp: string;              // ISO 8601
  severity: BackendSeverityLevel;
  threat_type: BackendThreatType;
  risk_score: number;             // 0-100
  source_ip: string;
  source_country?: string;
  source_country_code?: string;
  source_zone: BackendIPZone;
  destination_ip?: string;
  destination_port?: number;
  confidence: number;             // 0-1
  description: string;
  contextual_analysis: string;
  contributing_signals: string[];
  mitre_attack_id?: string;
  mitre_attack_name?: string;
  recommended_actions: string[];
  auto_blocked: boolean;
  processing_time_ms: number;
  analyzed_at: string;            // ISO 8601
  audit_ref: string;
}
```

---

## UI Behavior

### Filtering

Users can filter events by severity using buttons at the top of the stream:

- **ALL** - Show all events
- **CRITICAL** - Only CRITICAL severity
- **HIGH** - Only HIGH severity
- **MEDIUM** - Only MEDIUM severity
- **INFO** - Only INFO/LOW severity

### Event Display

Each event shows:
- **Severity badge** (color-coded)
- **Event type badge**
- **Timestamp**
- **Source IP** (clickable)
- **Description** (truncated)
- **Country/location**
- **MITRE ATT&CK ID** (if available)

### Click Behavior

Clicking an event opens the `DetailDrawer` component with full event details.

### Auto-Update

- New threats automatically appear at the top
- List limited to 50 most recent events
- Smooth scroll animation for new events
- CRITICAL events have red background highlight

---

## Performance Optimizations

1. **Event Limit:** Max 50 events in memory to prevent performance degradation
2. **Memoization:** Filter operation uses React state (not computed on every render)
3. **Virtual Scrolling:** Could be added for large event lists
4. **Debouncing:** Filter changes are immediate (no debounce needed for simple state update)

---

## Error Handling

### WebSocket Disconnection

If WebSocket disconnects:
1. Automatic reconnection attempts (max 5)
2. Header shows "DISCONNECTED" status
3. Events remain visible (cached data)
4. No new events until reconnection

### Empty State

If no events match filter:
```
"No matching events in stream buffer."
```

---

## Testing

### Manual Testing

1. **Start backend:** `uvicorn app.main:app --reload`
2. **Send test events:** `python3 scripts/kafka_producer_test.py`
3. **Verify:**
   - Events appear in stream
   - Severity badges are correct
   - Filtering works
   - Click opens detail drawer

### WebSocket Testing

Use `test-websocket.html` to verify WebSocket messages:

```bash
open test-websocket.html
```

---

## Backend Requirements

### Must Implement

1. ✅ **WebSocket endpoint:** `/ws/live`
2. ✅ **Initial state message:** Sends recent threats on connection
3. ✅ **New threat broadcast:** Sends `new_threat` when threat is detected
4. ✅ **REST API endpoint:** `GET /api/threats/recent`

### Expected Behavior

- WebSocket connection accepts multiple clients
- Messages are JSON-encoded
- Threats are sent in reverse chronological order (newest first)
- `initial_state` sent immediately after connection
- `new_threat` broadcast to all connected clients

---

## Related Features

- [FEATURE_THREAT_MAP.md](./FEATURE_THREAT_MAP.md) - Uses event coordinates for visualization
- [FEATURE_ANALYTICS.md](./FEATURE_ANALYTICS.md) - Uses events for top sources analysis
- [WEBSOCKET_PROTOCOL.md](./WEBSOCKET_PROTOCOL.md) - Complete WebSocket specification
- [API_REFERENCE.md](./API_REFERENCE.md) - REST API details

---

**Last Updated:** December 27, 2025
