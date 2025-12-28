# WebSocket Protocol Specification

**Endpoint:** `ws://localhost:8000/ws/live`
**Protocol:** WebSocket (RFC 6455)
**Message Format:** JSON

---

## Overview

The ThreatStream WebSocket protocol enables real-time bidirectional communication between the backend and frontend. The server broadcasts threat updates, metrics, and system events to all connected clients.

---

## Connection Lifecycle

### 1. Connect

**Client → Server:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/live');
```

**Server Response:**
- Connection accepted
- Immediate `initial_state` message sent

---

### 2. Initial State

**Server → Client:**

Upon successful connection, the server sends the current system state:

```json
{
  "type": "initial_state",
  "data": {
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
    "alerts": [
      {
        "id": "ALT-CD301FA3",
        "threat_id": "THR-841CA944",
        "severity": "CRITICAL",
        "priority": "P1",
        "status": "NEW",
        "description": "Event detected: malware",
        "created_at": "2025-12-27T16:53:40.622200+00:00"
      }
    ],
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
      "latency_history": [1846, 409, 397, 398, 398],
      "alerts_generated": 5,
      "threats_detected": 5
    }
  }
}
```

**Purpose:** Load current threats, alerts, risk score, and metrics

**Frontend Action:**
- Display initial threats in event stream
- Set initial risk score
- Update dashboard stats

---

### 3. Ongoing Messages

#### Message Type: `new_threat`

**Server → Client:**

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

**Trigger:** New threat detected by backend

**Frontend Action:**
- Add threat to event stream
- Update risk score if provided
- Update threat map
- Trigger AI analysis (if CRITICAL)

---

#### Message Type: `new_alert`

**Server → Client:**

```json
{
  "type": "new_alert",
  "data": {
    "id": "ALT-CD89BEB7",
    "threat_id": "THR-D86E0BD7",
    "severity": "CRITICAL",
    "priority": "P1",
    "status": "NEW",
    "description": "SQL injection attempt detected",
    "created_at": "2025-12-27T16:53:32.951156+00:00"
  }
}
```

**Trigger:** High-severity threat generates alert

**Frontend Action:**
- Show notification (browser alert or in-app)
- Add to alerts list
- Play alert sound (optional)

---

#### Message Type: `metrics_update`

**Server → Client:**

```json
{
  "type": "metrics_update",
  "data": {
    "processed": 42,
    "blocked": 1,
    "critical": 38,
    "avg_detect_time": 590,
    "latency_history": [1846, 409, 397, 398, 398, 405, 410],
    "alerts_generated": 42,
    "threats_detected": 42
  }
}
```

**Trigger:** Metrics change (e.g., new event processed)

**Frontend Action:**
- Update dashboard stats
- Update latency chart

---

#### Message Type: `risk_update`

**Server → Client:**

```json
{
  "type": "risk_update",
  "data": {
    "value": 88,
    "level": "CRITICAL",
    "trend": "RISING"
  }
}
```

**Trigger:** Risk score recalculated

**Frontend Action:**
- Update risk meter
- Change threat level
- Trigger AI analysis if CRITICAL

---

#### Message Type: `heartbeat`

**Server → Client:**

```json
{
  "type": "heartbeat",
  "timestamp": "2025-12-27T16:54:00.000000Z"
}
```

**Frequency:** Every 30 seconds (configurable)

**Purpose:** Keep connection alive, detect disconnections

**Frontend Action:**
- Ignore (connection maintenance)
- Optional: Update "last seen" timestamp

---

### 4. Client → Server Messages

#### Request State

**Client → Server:**

```json
{
  "type": "request_state"
}
```

**Purpose:** Request current state refresh

**Server Response:** Sends `initial_state` message

---

#### Ping

**Client → Server:**

```json
{
  "type": "ping"
}
```

**Server Response:**

```json
{
  "type": "pong",
  "timestamp": "2025-12-27T16:54:00.000000Z"
}
```

---

### 5. Disconnection

**Client:**
```javascript
ws.close();
```

**Server:**
- Removes client from connection pool
- No further messages sent

**Reconnection:**
- Client automatically reconnects (exponential backoff)
- Max 5 reconnection attempts
- 3-second initial delay, doubling each attempt

---

## Message Format Specification

### All Messages

```typescript
interface WebSocketMessage {
  type: string;      // Message type identifier
  data?: any;        // Message payload (optional)
  timestamp?: string; // ISO 8601 timestamp (optional)
}
```

### Type Union

```typescript
type BackendWebSocketMessage =
  | BackendInitialStateMessage
  | BackendNewThreatMessage
  | BackendNewAlertMessage
  | BackendMetricsUpdateMessage
  | BackendRiskUpdateMessage
  | BackendHeartbeatMessage;
```

---

## Frontend WebSocket Service

### Implementation

**File:** `services/websocketService.ts`

```typescript
export class ThreatStreamWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<WebSocketMessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.requestState();  // Request initial state
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Ignore heartbeats
      if (message.type === 'heartbeat') return;

      // Notify handlers
      this.messageHandlers.forEach(handler => handler(message));
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  requestState() {
    this.send({ type: 'request_state' });
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: WebSocketMessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }
}
```

---

## Backend WebSocket Manager

### Connection Management

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)

        # Send initial state
        await self.send_initial_state(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove connection"""
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Send message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting: {e}")
                self.disconnect(connection)

    async def send_initial_state(self, websocket: WebSocket):
        """Send current system state to newly connected client"""
        threats = await firestore.get_recent_threats(limit=50)
        alerts = await firestore.get_active_alerts(limit=50)
        risk_index = analytics.get_risk_index()
        stats = metrics.get_dashboard_stats()

        await websocket.send_json({
            "type": "initial_state",
            "data": {
                "threats": threats,
                "alerts": alerts,
                "risk_index": risk_index,
                "stats": stats
            }
        })
```

---

## Error Handling

### Connection Errors

- **Client:** Automatic reconnection with exponential backoff
- **Server:** Log error, remove from connection pool

### Message Parse Errors

- **Client:** Log error, ignore malformed message
- **Server:** Validate message format before broadcast

### Timeout

- **Heartbeat:** 30-second interval
- **Reconnect:** Max 5 attempts with 3s base delay

---

## Security Considerations

### Authentication (Optional)

Add authentication via query parameters or headers:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/live?token=abc123');
```

### Rate Limiting

- Limit messages per connection per second
- Prevent WebSocket flooding

### Message Validation

- Validate message structure before processing
- Sanitize user input (if accepting client messages)

---

## Testing

### Test Tools

1. **Browser Console:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/live');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

2. **test-websocket.html:**
```bash
open test-websocket.html
```

3. **wscat (CLI tool):**
```bash
npm install -g wscat
wscat -c ws://localhost:8000/ws/live
```

---

## Related Documentation

- [FEATURE_THREAT_STREAM.md](./FEATURE_THREAT_STREAM.md) - Uses WebSocket for events
- [FEATURE_DASHBOARD_STATS.md](./FEATURE_DASHBOARD_STATS.md) - Uses metrics_update
- [API_REFERENCE.md](./API_REFERENCE.md) - REST API endpoints

---

**Last Updated:** December 27, 2025
