# Feature: Alert Management

**Backend Endpoints:** Alert CRUD operations
**WebSocket:** Real-time alert notifications
**Primary Use:** Alert lifecycle management

---

## Overview

The Alert Management feature tracks and manages security alerts generated from detected threats. Alerts have a lifecycle (NEW → ACKNOWLEDGED → INVESTIGATING → RESOLVED) and support analyst workflows for incident response.

---

## Required Backend Endpoints

### 1. Get Active Alerts

#### **Endpoint:** `GET /api/alerts/active`

**Purpose:** Fetch current active alerts

**Query Parameters:**
```typescript
{
  limit?: number;  // Max alerts to return (default: 50)
}
```

**Example Request:**
```http
GET /api/alerts/active?limit=50
Host: localhost:8000
```

**Example Response:**
```json
{
  "alerts": [
    {
      "id": "ALT-FBCF17B5",
      "threat_id": "THR-8B00500B",
      "severity": "CRITICAL",
      "priority": "P1",
      "status": "NEW",
      "description": "Brute force attack detected from hostile zone",
      "created_at": "2025-12-27T16:53:32.540332+00:00",
      "acknowledged_at": null,
      "acknowledged_by": null,
      "resolved_at": null,
      "resolved_by": null,
      "resolution": null,
      "notes": null
    }
  ],
  "count": 1
}
```

---

### 2. Acknowledge Alert

#### **Endpoint:** `POST /api/alerts/{alert_id}/acknowledge`

**Purpose:** Acknowledge an alert (analyst taking ownership)

**Path Parameters:**
- `alert_id` (string): Alert ID (e.g., "ALT-FBCF17B5")

**Request Body:**
```json
{
  "analyst_id": "analyst-john-doe",
  "notes": "Investigating source IP activity"
}
```

**Example Request:**
```http
POST /api/alerts/ALT-FBCF17B5/acknowledge
Host: localhost:8000
Content-Type: application/json

{
  "analyst_id": "analyst-john-doe",
  "notes": "Investigating source IP activity"
}
```

**Example Response:**
```json
{
  "id": "ALT-FBCF17B5",
  "status": "ACKNOWLEDGED",
  "acknowledged_at": "2025-12-27T16:55:00.000000+00:00",
  "acknowledged_by": "analyst-john-doe",
  "notes": "Investigating source IP activity"
}
```

---

### 3. Resolve Alert

#### **Endpoint:** `POST /api/alerts/{alert_id}/resolve`

**Purpose:** Mark alert as resolved

**Path Parameters:**
- `alert_id` (string): Alert ID

**Request Body:**
```json
{
  "analyst_id": "analyst-john-doe",
  "resolution": "False positive - legitimate admin activity",
  "notes": "Verified with IT team. Source IP is corporate VPN exit node."
}
```

**Example Request:**
```http
POST /api/alerts/ALT-FBCF17B5/resolve
Host: localhost:8000
Content-Type: application/json

{
  "analyst_id": "analyst-john-doe",
  "resolution": "False positive - legitimate admin activity",
  "notes": "Verified with IT team"
}
```

**Example Response:**
```json
{
  "id": "ALT-FBCF17B5",
  "status": "RESOLVED",
  "resolved_at": "2025-12-27T17:00:00.000000+00:00",
  "resolved_by": "analyst-john-doe",
  "resolution": "False positive - legitimate admin activity"
}
```

---

## WebSocket - Real-time Alert Notifications

### Message Type: `new_alert`

**Purpose:** Notify connected clients of new alerts

**Message Format:**
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

---

## Data Types

### Backend Type: `BackendAlert`

**File:** `backendTypes.ts`

```typescript
export interface BackendAlert {
  id: string;                  // ALT-XXXXXXXX
  threat_id: string;           // Associated threat ID
  severity: string;            // CRITICAL, HIGH, MEDIUM, LOW
  priority: BackendAlertPriority;
  status: BackendAlertStatus;
  description: string;
  created_at: string;          // ISO 8601
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution?: string;
  notes?: string;
}

export enum BackendAlertStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE'
}

export enum BackendAlertPriority {
  P1 = 'P1',  // Critical - immediate action
  P2 = 'P2',  // High - same day
  P3 = 'P3',  // Medium - this week
  P4 = 'P4'   // Low - backlog
}
```

---

## Frontend Implementation

### WebSocket Handler

**File:** `App.tsx`

```typescript
case 'new_alert':
  // Handle new alert (could show notification)
  console.log('New alert:', message.data);

  // Optional: Add to UI alert list
  // setAlerts(prev => [message.data, ...prev]);

  // Optional: Show browser notification
  if (Notification.permission === 'granted') {
    new Notification('ThreatStream Alert', {
      body: message.data.description,
      icon: '/alert-icon.png'
    });
  }
  break;
```

### Service Layer

**File:** `services/backendService.ts`

```typescript
export async function getActiveAlerts(limit: number = 50): Promise<BackendAlertsResponse> {
  return fetchAPI<BackendAlertsResponse>(`/api/alerts/active?limit=${limit}`);
}

export async function acknowledgeAlert(
  alertId: string,
  analystId: string,
  notes?: string
): Promise<any> {
  return fetchAPI(`/api/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ analyst_id: analystId, notes }),
  });
}

export async function resolveAlert(
  alertId: string,
  analystId: string,
  resolution: string,
  notes?: string
): Promise<any> {
  return fetchAPI(`/api/alerts/${alertId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ analyst_id: analystId, resolution, notes }),
  });
}
```

---

## Alert Generation Logic

### Backend Implementation

**File:** `backend/app/services/alert_service.py` (example)

```python
def create_alert_from_threat(self, threat: Threat) -> Alert:
    """
    Automatically create alert for high-severity threats

    Rules:
    - CRITICAL severity → P1 alert
    - HIGH severity → P2 alert
    - MEDIUM severity → P3 alert
    - LOW/INFO → No alert
    """
    if threat.severity not in ['CRITICAL', 'HIGH', 'MEDIUM']:
        return None

    priority_map = {
        'CRITICAL': 'P1',
        'HIGH': 'P2',
        'MEDIUM': 'P3'
    }

    alert = Alert(
        id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
        threat_id=threat.id,
        severity=threat.severity,
        priority=priority_map[threat.severity],
        status='NEW',
        description=threat.description,
        created_at=datetime.utcnow()
    )

    self.alerts.append(alert)
    return alert
```

---

## Alert Lifecycle

```
NEW
  ↓ (Analyst acknowledges)
ACKNOWLEDGED
  ↓ (Analyst investigates)
INVESTIGATING
  ↓ (Analyst resolves)
RESOLVED / FALSE_POSITIVE
```

**Status Transitions:**
1. **NEW** - Alert just created
2. **ACKNOWLEDGED** - Analyst aware and taking ownership
3. **INVESTIGATING** - Active investigation (optional intermediate state)
4. **RESOLVED** - Incident resolved
5. **FALSE_POSITIVE** - Not a real threat

---

## UI Implementation (Optional)

### Alert Dashboard Component

```typescript
interface AlertDashboardProps {
  alerts: BackendAlert[];
}

const AlertDashboard: React.FC<AlertDashboardProps> = ({ alerts }) => {
  const handleAcknowledge = async (alertId: string) => {
    await BackendService.acknowledgeAlert(alertId, 'current-user', 'Investigating');
    // Refresh alerts
  };

  const handleResolve = async (alertId: string) => {
    const resolution = prompt('Resolution notes:');
    if (resolution) {
      await BackendService.resolveAlert(alertId, 'current-user', resolution);
      // Refresh alerts
    }
  };

  return (
    <div>
      {alerts.map(alert => (
        <div key={alert.id}>
          <h3>{alert.description}</h3>
          <span>{alert.status}</span>

          {alert.status === 'NEW' && (
            <button onClick={() => handleAcknowledge(alert.id)}>
              Acknowledge
            </button>
          )}

          {alert.status === 'ACKNOWLEDGED' && (
            <button onClick={() => handleResolve(alert.id)}>
              Resolve
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## Backend Requirements

### Must Implement

1. ✅ **Alert Storage:** In-memory or database
2. ✅ **Auto-generation:** Create alerts for CRITICAL/HIGH threats
3. ✅ **Status Management:** Track alert lifecycle
4. ✅ **REST Endpoints:** GET, POST acknowledge, POST resolve
5. ✅ **WebSocket Broadcast:** Send `new_alert` when created

### Data Persistence

Alerts should persist across system restarts (use database or file storage).

---

## Testing

### Manual Testing

1. Trigger CRITICAL threat
2. Verify alert created via `GET /api/alerts/active`
3. Acknowledge alert via `POST /api/alerts/{id}/acknowledge`
4. Verify status changed to ACKNOWLEDGED
5. Resolve alert via `POST /api/alerts/{id}/resolve`
6. Verify status changed to RESOLVED

---

## Related Features

- [FEATURE_PLAYBOOKS.md](./FEATURE_PLAYBOOKS.md) - Automated response to alerts
- [FEATURE_THREAT_STREAM.md](./FEATURE_THREAT_STREAM.md) - Source of alerts
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API reference

---

**Last Updated:** December 27, 2025
