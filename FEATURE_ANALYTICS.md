# Feature: Analytics & Reporting

**Components:** `TopSources.tsx`, `Timeline.tsx`, `KafkaMetrics.tsx`
**Backend Endpoints:** Analytics aggregation
**Purpose:** Threat intelligence and trend analysis

---

## Overview

The Analytics feature provides insights into threat patterns, source distributions, and system performance. It includes top threat sources ranking, risk timeline visualization, and event stream metrics.

---

## UI Components

### 1. Top Sources

**Component:** `TopSources.tsx`

**Purpose:** Display top malicious source IPs/countries

**Data Aggregation:**
```typescript
// Group events by source IP
const sourceGroups = events.reduce((acc, event) => {
  const key = event.sourceIp;
  if (!acc[key]) {
    acc[key] = {
      ip: event.sourceIp,
      country: event.country,
      count: 0,
      severity: event.severity
    };
  }
  acc[key].count++;
  return acc;
}, {});

// Sort by count and take top 10
const topSources = Object.values(sourceGroups)
  .sort((a, b) => b.count - a.count)
  .slice(0, 10);
```

**Display:**
- Ranked list (1-10)
- IP address
- Country flag/name
- Event count
- Severity indicator

---

### 2. Risk Timeline

**Component:** `Timeline.tsx`

**Purpose:** Visualize risk score over time

**Data Structure:**
```typescript
interface TimelineData {
  time: string;   // "HH:MM:SS"
  risk: number;   // 0-100
}
```

**Chart Type:** Line chart
- X-axis: Time (30-minute window)
- Y-axis: Risk score
- Auto-scrolling as new data arrives

---

### 3. Kafka/Event Metrics

**Component:** `KafkaMetrics.tsx`

**Purpose:** Display event stream statistics

**Metrics:**
- **EPS (Events Per Second):** Current event rate
- **Stream Status:** LIVE / PAUSED
- **Connection Status:** Connected / Disconnected

---

## Required Backend Endpoints

### 1. Get Analytics Summary

#### **Endpoint:** `GET /api/analytics/summary`

**Purpose:** Fetch comprehensive analytics data

**Example Response:**
```json
{
  "dashboard_stats": {
    "processed": 41,
    "blocked": 0,
    "critical": 41,
    "avg_detect_time": 584,
    "latency_history": [1846, 409, 397, 398, 398]
  },
  "risk_index": {
    "value": 85,
    "level": "SUSPICIOUS",
    "trend": "RISING"
  },
  "risk_timeline": [
    {
      "timestamp": "2025-12-27T16:50:00Z",
      "risk_score": 70,
      "threats_detected": 5
    },
    {
      "timestamp": "2025-12-27T16:51:00Z",
      "risk_score": 75,
      "threats_detected": 8
    }
  ],
  "threat_stats": {
    "by_severity": {
      "CRITICAL": 38,
      "HIGH": 3,
      "MEDIUM": 0,
      "LOW": 0,
      "INFO": 0
    },
    "by_type": {
      "AUTHENTICATION": 30,
      "MALWARE": 5,
      "DDOS": 3,
      "BRUTE_FORCE": 3
    },
    "by_country": {
      "KP": 15,  // North Korea
      "IR": 12,  // Iran
      "CN": 8,   // China
      "RU": 6    // Russia
    },
    "top_sources": [
      {
        "ip": "185.234.72.91",
        "country": "KP",
        "count": 15,
        "last_seen": "2025-12-27T16:53:32.540332+00:00"
      }
    ]
  }
}
```

---

### 2. Get Threat Statistics

#### **Endpoint:** `GET /api/threats/stats/summary`

**Purpose:** Fetch threat distribution statistics

**Example Response:**
```json
{
  "total_threats": 41,
  "severity_distribution": {
    "CRITICAL": 38,
    "HIGH": 3,
    "MEDIUM": 0,
    "LOW": 0,
    "INFO": 0
  },
  "type_distribution": {
    "AUTHENTICATION": 30,
    "BRUTE_FORCE": 5,
    "DDOS": 3,
    "MALWARE": 3
  },
  "time_range": {
    "start": "2025-12-27T16:00:00Z",
    "end": "2025-12-27T17:00:00Z"
  }
}
```

---

### 3. Get Risk Timeline

#### **Endpoint:** `GET /api/analytics/timeline`

**Purpose:** Fetch historical risk data

**Query Parameters:**
```typescript
{
  minutes?: number;  // Time range (default: 30)
  interval?: number; // Data point interval in seconds (default: 60)
}
```

**Example Response:**
```json
{
  "timeline": [
    {
      "timestamp": "2025-12-27T16:30:00Z",
      "risk_score": 65,
      "threats_detected": 3
    },
    {
      "timestamp": "2025-12-27T16:31:00Z",
      "risk_score": 70,
      "threats_detected": 5
    }
  ],
  "summary": {
    "min_risk": 60,
    "max_risk": 85,
    "avg_risk": 72,
    "total_threats": 28
  }
}
```

---

## Frontend Analytics Calculations

### Top Sources (Client-Side)

**File:** `components/TopSources.tsx`

```typescript
const topSources = useMemo(() => {
  // Group by source IP
  const groups = events.reduce((acc, event) => {
    if (!acc[event.sourceIp]) {
      acc[event.sourceIp] = {
        ip: event.sourceIp,
        country: event.country,
        countryCode: event.country,
        count: 0,
        latestSeverity: event.severity
      };
    }
    acc[event.sourceIp].count++;

    // Update to highest severity seen
    if (severityRank[event.severity] > severityRank[acc[event.sourceIp].latestSeverity]) {
      acc[event.sourceIp].latestSeverity = event.severity;
    }

    return acc;
  }, {} as Record<string, any>);

  // Sort by count and take top 10
  return Object.values(groups)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);
}, [events]);
```

### EPS Calculation (Client-Side)

**File:** `App.tsx` or `KafkaMetrics.tsx`

```typescript
const [eps, setEps] = useState(0);
const eventTimestamps = useRef<number[]>([]);

useEffect(() => {
  // Track event arrivals
  const now = Date.now();
  eventTimestamps.current.push(now);

  // Remove timestamps older than 1 second
  eventTimestamps.current = eventTimestamps.current.filter(
    ts => now - ts < 1000
  );

  // Calculate EPS
  setEps(eventTimestamps.current.length);
}, [events]);
```

---

## Backend Analytics Service

### Implementation Example

```python
class AnalyticsService:
    def get_threat_stats(self) -> dict:
        """Get threat distribution statistics"""

        threats = self.firestore.get_all_threats()

        # Severity distribution
        severity_dist = {}
        for threat in threats:
            severity_dist[threat.severity] = severity_dist.get(threat.severity, 0) + 1

        # Type distribution
        type_dist = {}
        for threat in threats:
            type_dist[threat.threat_type] = type_dist.get(threat.threat_type, 0) + 1

        # Country distribution
        country_dist = {}
        for threat in threats:
            code = threat.source_country_code or 'UNKNOWN'
            country_dist[code] = country_dist.get(code, 0) + 1

        # Top sources
        ip_counts = {}
        for threat in threats:
            ip = threat.source_ip
            if ip not in ip_counts:
                ip_counts[ip] = {
                    'ip': ip,
                    'country': threat.source_country_code,
                    'count': 0,
                    'last_seen': threat.timestamp
                }
            ip_counts[ip]['count'] += 1

        top_sources = sorted(
            ip_counts.values(),
            key=lambda x: x['count'],
            reverse=True
        )[:10]

        return {
            'total_threats': len(threats),
            'severity_distribution': severity_dist,
            'type_distribution': type_dist,
            'by_country': country_dist,
            'top_sources': top_sources
        }
```

---

## UI Visualizations

### Top Sources Display

```
┌─────────────────────────────────────┐
│  INGRESS ORIGINS                    │
│  Top Malicious Sources              │
├─────────────────────────────────────┤
│  #1  185.234.72.91     KP    [15]  │
│  #2  201.45.123.88     IR    [12]  │
│  #3  103.42.67.123     DE    [ 8]  │
│  #4  192.168.45.22     CN    [ 6]  │
│  #5  10.0.3.15         US    [ 4]  │
└─────────────────────────────────────┘
```

### Risk Timeline Chart

```
Risk
100 ┤                               ╭──
 90 ┤                          ╭────╯
 80 ┤                     ╭────╯
 70 ┤              ╭──────╯
 60 ┤         ╭────╯
 50 ┤    ╭────╯
    └────────────────────────────────> Time
    10:30  10:35  10:40  10:45  10:50
```

---

## Real-time Updates

Analytics update via:

1. **WebSocket:** `metrics_update`, `new_threat` messages
2. **Client-side computation:** TopSources, EPS calculated from event array
3. **Periodic polling:** (Optional) REST API every 5-10 seconds

---

## Performance Considerations

### Client-Side Aggregation

- Limited to 50 events in memory
- O(n) complexity for grouping operations
- Memoized calculations (React useMemo)

### Server-Side Aggregation

- Database queries with indexes
- Caching for frequently accessed stats
- Pre-aggregated data (update on event processing)

---

## Testing

1. Generate diverse threats (multiple IPs, countries, types)
2. Verify top sources accurately rank by count
3. Check timeline updates in real-time
4. Validate EPS calculation
5. Test analytics summary endpoint

---

## Related Features

- [FEATURE_THREAT_STREAM.md](./FEATURE_THREAT_STREAM.md) - Data source
- [FEATURE_DASHBOARD_STATS.md](./FEATURE_DASHBOARD_STATS.md) - Core metrics
- [API_REFERENCE.md](./API_REFERENCE.md) - API details

---

**Last Updated:** December 27, 2025
