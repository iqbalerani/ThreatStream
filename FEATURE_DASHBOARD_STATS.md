# Feature: Dashboard Statistics

**Component:** `StatsBar.tsx`
**Primary Communication:** WebSocket + REST API
**Update Frequency:** Real-time (1-2 seconds)

---

## Overview

The Dashboard Statistics feature displays key performance indicators (KPIs) for the threat detection system. Stats are updated in real-time via WebSocket and include total events processed, blocked events, critical threats, and average detection time.

---

## UI Component

### Component: `StatsBar`

**Location:** `components/StatsBar.tsx`

**Props:**
```typescript
interface StatsBarProps {
  stats: DashboardStats;
}
```

**Display Fields:**
- **Processed:** Total events processed
- **Blocked:** Total events blocked
- **Critical:** Current critical threats
- **Avg Detect Time:** Average detection time in milliseconds

---

## Required Backend Endpoints

### 1. WebSocket - Metrics Update

#### **Message Type:** `metrics_update`

**Purpose:** Real-time stats broadcasting

**Message Format:**
```json
{
  "type": "metrics_update",
  "data": {
    "processed": 41,
    "blocked": 0,
    "critical": 41,
    "avg_detect_time": 584,
    "latency_history": [1846, 409, 397, 398, 398, 400, 405, 410, 420, 425],
    "alerts_generated": 41,
    "threats_detected": 41
  }
}
```

**Fields:**
- `processed` (number): Total events processed since system start
- `blocked` (number): Total events auto-blocked
- `critical` (number): Current critical threats count
- `avg_detect_time` (number): Average detection time in milliseconds
- `latency_history` (number[]): Recent detection times (for charting)
- `alerts_generated` (number): Total alerts created
- `threats_detected` (number): Total threats detected

---

### 2. REST API - Get Dashboard Metrics

#### **Endpoint:** `GET /api/analytics/dashboard`

**Purpose:** Fetch current dashboard statistics

**Example Request:**
```http
GET /api/analytics/dashboard
Host: localhost:8000
```

**Example Response:**
```json
{
  "processed": 41,
  "blocked": 0,
  "critical": 41,
  "avg_detect_time": 584,
  "latency_history": [1846, 409, 397, 398, 398],
  "alerts_generated": 41,
  "threats_detected": 41
}
```

**Response Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Server error

---

## Frontend Implementation

### WebSocket Message Handling

**File:** `App.tsx` (lines 102-105)

```typescript
case 'metrics_update':
  // Update dashboard stats
  setStats(mapBackendDashboardStatsToFrontend(message.data));
  break;
```

### Type Mapping

**File:** `typeMappers.ts`

```typescript
/**
 * Convert backend DashboardStats to frontend DashboardStats
 */
export function mapBackendDashboardStatsToFrontend(
  backendStats: BackendDashboardStats
): DashboardStats {
  return {
    processed: backendStats.processed,
    blocked: backendStats.blocked,
    critical: backendStats.critical,
    avgDetectTime: backendStats.avg_detect_time,
    latencyHistory: backendStats.latency_history || []
  };
}
```

---

## Data Types

### Frontend Type: `DashboardStats`

**File:** `types.ts`

```typescript
export interface DashboardStats {
  processed: number;          // Total events processed
  blocked: number;            // Total events blocked
  critical: number;           // Current critical threats
  avgDetectTime: number;      // Average detection time (ms)
  latencyHistory: number[];   // Recent latencies (for chart)
}
```

### Backend Type: `BackendDashboardStats`

**File:** `backendTypes.ts`

```typescript
export interface BackendDashboardStats {
  processed: number;
  blocked: number;
  critical: number;
  avg_detect_time: number;
  latency_history: number[];
  alerts_generated?: number;  // Optional
  threats_detected?: number;  // Optional
}
```

---

## UI Behavior

### Display Format

Each stat is displayed with:
- **Icon** (visual indicator)
- **Value** (large, bold number)
- **Label** (description)

### Real-time Updates

- Stats update automatically when `metrics_update` WebSocket message is received
- Smooth number transitions (could add animation)
- Color coding based on values (e.g., red for high critical count)

### Initial State

Default values when no backend data:
```typescript
const [stats, setStats] = useState<DashboardStats>({
  processed: 12847,
  blocked: 234,
  critical: 0,
  avgDetectTime: 127,
  latencyHistory: [130, 125, 128, 122, 127, 120, 115, 118, 110, 105]
});
```

---

## Backend Requirements

### Must Implement

1. ✅ **WebSocket message:** `metrics_update` type
2. ✅ **REST endpoint:** `GET /api/analytics/dashboard`
3. ✅ **Real-time updates:** Broadcast metrics when they change
4. ✅ **Accurate counting:** Track all stats correctly

### Expected Behavior

- **Processed** increments with every event
- **Blocked** increments when `auto_blocked = true`
- **Critical** reflects current CRITICAL severity threats (not cumulative)
- **Avg Detect Time** is calculated across recent events
- **Latency History** maintains last 10-15 values

---

## Calculation Logic

### Backend Implementation

**File:** `backend/app/services/metrics_service.py`

```python
class MetricsService:
    def __init__(self):
        self.total_processed = 0
        self.total_blocked = 0
        self.latencies = []  # Recent detection times
        self.max_latency_history = 15

    async def record_event(self, processing_time_ms: int, blocked: bool):
        """Record event metrics"""
        self.total_processed += 1
        if blocked:
            self.total_blocked += 1

        # Track latency
        self.latencies.append(processing_time_ms)
        if len(self.latencies) > self.max_latency_history:
            self.latencies.pop(0)

    def get_dashboard_stats(self, critical_count: int) -> DashboardStats:
        """Get current dashboard statistics"""
        return {
            "processed": self.total_processed,
            "blocked": self.total_blocked,
            "critical": critical_count,  # Passed from threat storage
            "avg_detect_time": int(sum(self.latencies) / len(self.latencies)) if self.latencies else 0,
            "latency_history": self.latencies.copy(),
            "alerts_generated": self.total_processed,  # Example
            "threats_detected": self.total_processed
        }
```

---

## Performance Considerations

### Update Frequency

- Updates sent after each event processed
- Potential optimization: Batch updates every 1-2 seconds instead of per-event
- Frontend handles high-frequency updates gracefully

### State Management

- Stats stored in top-level `App.tsx` state
- Passed down to `StatsBar` component as props
- No complex state management needed

---

## Testing

### Manual Testing

1. Start backend and frontend
2. Send test events via simulation or Kafka producer
3. Verify stats update in UI:
   - `Processed` increments
   - `Critical` reflects current count
   - `Avg Detect Time` shows reasonable values

### WebSocket Testing

```javascript
// In test-websocket.html
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'metrics_update') {
    console.log('Metrics Update:', message.data);
    // Verify fields present
  }
};
```

---

## Related Features

- [FEATURE_RISK_ANALYSIS.md](./FEATURE_RISK_ANALYSIS.md) - Risk score display
- [FEATURE_ANALYTICS.md](./FEATURE_ANALYTICS.md) - Extended analytics
- [WEBSOCKET_PROTOCOL.md](./WEBSOCKET_PROTOCOL.md) - WebSocket specification
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoints

---

**Last Updated:** December 27, 2025
