# Feature: Risk Analysis & Scoring

**Components:** `RiskMeter.tsx`, `Timeline.tsx`
**Primary Communication:** WebSocket + REST API
**Update Frequency:** Real-time (per threat)

---

## Overview

Risk Analysis provides real-time risk scoring (0-100) and threat level classification. The risk score is calculated based on detected threats and displayed via an animated gauge meter. A 30-minute timeline graph shows risk history and trends.

---

## UI Components

### Component: `RiskMeter`

**Location:** `components/RiskMeter.tsx`

**Props:**
```typescript
interface RiskMeterProps {
  score: number;           // 0-100
  level: ThreatLevel;      // NORMAL | SUSPICIOUS | CRITICAL
}
```

**Display:**
- Circular gauge visualization
- Color-coded by threat level
- Animated score transitions
- Large score number display

### Component: `Timeline`

**Location:** `components/Timeline.tsx`

**Props:**
```typescript
interface TimelineProps {
  data: TimelineData[];
}

interface TimelineData {
  time: string;   // HH:MM:SS format
  risk: number;   // Risk score at that time
}
```

**Display:**
- Line chart showing risk over time
- 30-minute rolling window
- Real-time updates

---

## Required Backend Endpoints

### 1. WebSocket - Risk Update

#### **Message Type:** `risk_update`

**Purpose:** Real-time risk score broadcasting

**Message Format:**
```json
{
  "type": "risk_update",
  "data": {
    "value": 85,
    "level": "SUSPICIOUS",
    "trend": "RISING"
  }
}
```

**Fields:**
- `value` (number): Risk score 0-100
- `level` (string): Risk level classification
  - `"LOW"` - Score 0-35
  - `"MEDIUM"` - Score 36-65
  - `"HIGH"` - Score 66-85
  - `"CRITICAL"` - Score 86-100
- `trend` (string): Risk direction
  - `"RISING"` - Increasing risk
  - `"FALLING"` - Decreasing risk
  - `"STABLE"` - No significant change

---

### 2. WebSocket - New Threat (includes risk_score)

**Message Type:** `new_threat`

Each new threat includes a `risk_score` field:

```json
{
  "type": "new_threat",
  "data": {
    "id": "THR-8B00500B",
    "risk_score": 78,
    // ... other threat fields
  }
}
```

The frontend uses this to update the risk score.

---

### 3. REST API - Get Risk Index

#### **Endpoint:** `GET /api/analytics/risk-index`

**Purpose:** Fetch current risk index

**Example Request:**
```http
GET /api/analytics/risk-index
Host: localhost:8000
```

**Example Response:**
```json
{
  "value": 85,
  "level": "SUSPICIOUS",
  "trend": "STABLE"
}
```

---

### 4. REST API - Get Risk Timeline

#### **Endpoint:** `GET /api/analytics/timeline`

**Purpose:** Fetch historical risk timeline data

**Example Request:**
```http
GET /api/analytics/timeline
Host: localhost:8000
```

**Example Response:**
```json
{
  "timeline": [
    {
      "timestamp": "2025-12-27T16:50:00Z",
      "risk_score": 70,
      "threats_detected": 5
    },
    {
      "timestamp": "2025-12-27T16:51:00Z",
      "risk_score": 75,
      "threats_detected": 8
    },
    {
      "timestamp": "2025-12-27T16:52:00Z",
      "risk_score": 85,
      "threats_detected": 12
    }
  ]
}
```

---

## Frontend Implementation

### Risk Score Update Logic

**File:** `App.tsx` (lines 86-95, 107-110)

```typescript
// When new threat arrives
case 'new_threat':
  const newEvent = mapBackendThreatToSecurityEvent(message.data);
  setEvents(prev => [newEvent, ...prev].slice(0, 50));

  // Update risk score based on threat severity
  if (message.data.risk_score) {
    setRiskScore(message.data.risk_score);
  }
  break;

// Dedicated risk update message
case 'risk_update':
  setRiskScore(message.data.value);
  break;
```

### Threat Level Classification

**File:** `App.tsx` (lines 144-152)

```typescript
useEffect(() => {
  // Classify threat level based on risk score
  if (riskScore > 65) setThreatLevel(ThreatLevel.CRITICAL);
  else if (riskScore > 35) setThreatLevel(ThreatLevel.SUSPICIOUS);
  else setThreatLevel(ThreatLevel.NORMAL);

  // Update timeline
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  setTimeline(prev => [...prev, { time: timeStr, risk: riskScore }].slice(-30));
}, [riskScore]);
```

---

## Data Types

### Frontend Types

**File:** `types.ts`

```typescript
export enum ThreatLevel {
  NORMAL = 'Normal',
  SUSPICIOUS = 'Suspicious',
  CRITICAL = 'Critical'
}

export interface TimelineData {
  time: string;   // Formatted time
  risk: number;   // Risk score
}
```

### Backend Types

**File:** `backendTypes.ts`

```typescript
export interface BackendRiskIndex {
  value: number;                              // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

export interface BackendTimelinePoint {
  timestamp: string;      // ISO 8601
  risk_score: number;
  threats_detected: number;
}
```

---

## UI Behavior

### Risk Meter

**Visual States:**

1. **NORMAL** (0-35)
   - Color: Green (#10b981)
   - Text: "NORMAL"
   - No alerts

2. **SUSPICIOUS** (36-65)
   - Color: Orange (#f97316)
   - Text: "SUSPICIOUS"
   - Moderate alert state

3. **CRITICAL** (66-100)
   - Color: Red (#ef4444)
   - Text: "CRITICAL"
   - Full screen red border pulse
   - AI analysis triggered

### Timeline Graph

- **X-Axis:** Time (last 30 data points)
- **Y-Axis:** Risk score (0-100)
- **Auto-scroll:** Moves left as new data arrives
- **Color gradient:** Matches risk level
- **Update frequency:** Every time risk score changes

---

## Risk Calculation Algorithm

### Backend Implementation

**File:** `backend/app/services/threat_processor.py` (example)

```python
def calculate_risk_score(self, threat: Threat) -> int:
    """
    Calculate risk score based on multiple factors

    Factors:
    - Severity level (0-40 points)
    - Source zone (0-30 points)
    - Confidence level (0-20 points)
    - Recent threat velocity (0-10 points)
    """
    score = 0

    # Severity contribution
    severity_scores = {
        "CRITICAL": 40,
        "HIGH": 30,
        "MEDIUM": 20,
        "LOW": 10,
        "INFO": 5
    }
    score += severity_scores.get(threat.severity, 0)

    # Source zone contribution
    zone_scores = {
        "HOSTILE_ZONE": 30,
        "EXTERNAL_NETWORK": 20,
        "INTERNAL_NETWORK": 10,
        "TRUSTED_PARTNER": 5,
        "UNKNOWN": 15
    }
    score += zone_scores.get(threat.source_zone, 0)

    # Confidence contribution
    score += int(threat.confidence * 20)

    # Recent threat velocity
    recent_threats = self.get_recent_threats_count(minutes=5)
    velocity_score = min(recent_threats, 10)
    score += velocity_score

    return min(score, 100)  # Cap at 100
```

---

## Backend Requirements

### Must Implement

1. ✅ **Risk score calculation** - Algorithm to compute score
2. ✅ **WebSocket broadcast** - Send `risk_update` or include in `new_threat`
3. ✅ **REST endpoints** - `/api/analytics/risk-index` and `/api/analytics/timeline`
4. ✅ **Timeline tracking** - Store risk history (at least 30 minutes)

### Expected Behavior

- Risk score updates with every new threat
- Trend calculation (rising/falling/stable)
- Level classification based on thresholds
- Timeline data preserved across restarts (optional)

---

## Testing

### Manual Testing

1. Start with low risk (NORMAL)
2. Trigger CRITICAL threat simulation
3. Verify:
   - Risk score increases
   - Meter color changes to red
   - Threat level becomes CRITICAL
   - Timeline graph updates
   - Screen border turns red (visual alert)

### Automated Testing

```typescript
// Test risk level classification
describe('Risk Level Classification', () => {
  it('should classify as NORMAL when score ≤ 35', () => {
    expect(classifyThreatLevel(20)).toBe(ThreatLevel.NORMAL);
  });

  it('should classify as SUSPICIOUS when score 36-65', () => {
    expect(classifyThreatLevel(50)).toBe(ThreatLevel.SUSPICIOUS);
  });

  it('should classify as CRITICAL when score > 65', () => {
    expect(classifyThreatLevel(80)).toBe(ThreatLevel.CRITICAL);
  });
});
```

---

## Performance Considerations

### Timeline Data Management

- Max 30 data points in memory
- Oldest data points dropped automatically
- No database storage needed (ephemeral)

### Update Frequency

- Risk score updates per threat (not time-based)
- Timeline appends new point per score change
- No throttling needed (events are already rate-limited)

---

## Related Features

- [FEATURE_AI_REASONING.md](./FEATURE_AI_REASONING.md) - Triggered at CRITICAL level
- [FEATURE_DASHBOARD_STATS.md](./FEATURE_DASHBOARD_STATS.md) - Complementary metrics
- [WEBSOCKET_PROTOCOL.md](./WEBSOCKET_PROTOCOL.md) - risk_update message spec
- [API_REFERENCE.md](./API_REFERENCE.md) - Analytics endpoints

---

**Last Updated:** December 27, 2025
