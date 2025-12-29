# ThreatStream REST API Reference

**Base URL:** `http://localhost:8000`
**Protocol:** HTTP/1.1
**Content-Type:** `application/json`
**Version:** 3.2.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health & System](#health--system)
3. [Threats](#threats)
4. [Alerts](#alerts)
5. [Analytics](#analytics)
6. [Playbooks](#playbooks)
7. [Simulation](#simulation)
8. [Error Handling](#error-handling)

---

## Authentication

**Current Status:** No authentication required (development mode)

**Production Recommendation:** Implement API key or JWT authentication

**Example (Future):**
```http
GET /api/threats/recent
Authorization: Bearer YOUR_API_TOKEN
```

---

## Health & System

### Get System Health

**Endpoint:** `GET /api/health`

**Description:** Check backend health status

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-12-27T15:14:35.089078",
  "version": "3.2.0",
  "environment": "development",
  "services": {
    "kafka": "configured",
    "gemini": "configured",
    "firestore": "configured"
  }
}
```

**Response Codes:**
- `200 OK` - System healthy
- `503 Service Unavailable` - System degraded

---

## Threats

### Get Recent Threats

**Endpoint:** `GET /api/threats/recent`

**Description:** Fetch recent threats with optional filtering

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Max threats to return |
| `severity` | string | No | all | Filter by severity: CRITICAL, HIGH, MEDIUM, LOW, INFO |

**Request:**
```http
GET /api/threats/recent?limit=10&severity=CRITICAL HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
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
      "recommended_actions": [
        "Review event manually",
        "Check related events"
      ],
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

### Get Threat by ID

**Endpoint:** `GET /api/threats/{threat_id}`

**Description:** Fetch specific threat details

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `threat_id` | string | Yes | Threat ID (e.g., "THR-841CA944") |

**Request:**
```http
GET /api/threats/THR-841CA944 HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
```json
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
  "contextual_analysis": "Fallback analysis",
  "contributing_signals": ["10.0.3.15"],
  "mitre_attack_id": null,
  "mitre_attack_name": null,
  "recommended_actions": ["Review event manually"],
  "auto_blocked": false,
  "processing_time_ms": 398,
  "analyzed_at": "2025-12-27T16:53:40.622200+00:00",
  "audit_ref": "FALLBACK-ENGINE"
}
```

**Response Codes:**
- `200 OK` - Threat found
- `404 Not Found` - Threat ID not found

---

### Get Threat Statistics

**Endpoint:** `GET /api/threats/stats/summary`

**Description:** Get threat distribution statistics

**Request:**
```http
GET /api/threats/stats/summary HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
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
  }
}
```

---

## Alerts

### Get Active Alerts

**Endpoint:** `GET /api/alerts/active`

**Description:** Fetch active alerts

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Max alerts to return |

**Request:**
```http
GET /api/alerts/active?limit=10 HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
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

### Acknowledge Alert

**Endpoint:** `POST /api/alerts/{alert_id}/acknowledge`

**Description:** Acknowledge an alert

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `alert_id` | string | Yes | Alert ID (e.g., "ALT-FBCF17B5") |

**Request Body:**
```json
{
  "analyst_id": "analyst-john-doe",
  "notes": "Investigating source IP activity"
}
```

**Request:**
```http
POST /api/alerts/ALT-FBCF17B5/acknowledge HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "analyst_id": "analyst-john-doe",
  "notes": "Investigating source IP activity"
}
```

**Response:** `200 OK`
```json
{
  "id": "ALT-FBCF17B5",
  "status": "ACKNOWLEDGED",
  "acknowledged_at": "2025-12-27T16:55:00.000000+00:00",
  "acknowledged_by": "analyst-john-doe",
  "notes": "Investigating source IP activity"
}
```

**Response Codes:**
- `200 OK` - Alert acknowledged
- `404 Not Found` - Alert ID not found
- `400 Bad Request` - Invalid request body

---

### Resolve Alert

**Endpoint:** `POST /api/alerts/{alert_id}/resolve`

**Description:** Resolve an alert

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `alert_id` | string | Yes | Alert ID |

**Request Body:**
```json
{
  "analyst_id": "analyst-john-doe",
  "resolution": "False positive - legitimate admin activity",
  "notes": "Verified with IT team"
}
```

**Request:**
```http
POST /api/alerts/ALT-FBCF17B5/resolve HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "analyst_id": "analyst-john-doe",
  "resolution": "False positive",
  "notes": "Verified with IT team"
}
```

**Response:** `200 OK`
```json
{
  "id": "ALT-FBCF17B5",
  "status": "RESOLVED",
  "resolved_at": "2025-12-27T17:00:00.000000+00:00",
  "resolved_by": "analyst-john-doe",
  "resolution": "False positive"
}
```

---

## Analytics

### Get Dashboard Metrics

**Endpoint:** `GET /api/analytics/dashboard`

**Description:** Get real-time dashboard statistics

**Request:**
```http
GET /api/analytics/dashboard HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
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

---

### Get Risk Index

**Endpoint:** `GET /api/analytics/risk-index`

**Description:** Get current risk score and classification

**Request:**
```http
GET /api/analytics/risk-index HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
```json
{
  "value": 85,
  "level": "SUSPICIOUS",
  "trend": "STABLE"
}
```

**Risk Levels:**
- `LOW` - Score 0-35
- `MEDIUM` - Score 36-65
- `HIGH` - Score 66-85
- `CRITICAL` - Score 86-100

---

### Get Risk Timeline

**Endpoint:** `GET /api/analytics/timeline`

**Description:** Get historical risk score data

**Request:**
```http
GET /api/analytics/timeline HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
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
    }
  ]
}
```

---

### Get Analytics Summary

**Endpoint:** `GET /api/analytics/summary`

**Description:** Get comprehensive analytics (all-in-one)

**Request:**
```http
GET /api/analytics/summary HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
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
    "trend": "STABLE"
  },
  "risk_timeline": [...],
  "threat_stats": {
    "total_threats": 41,
    "severity_distribution": {...},
    "type_distribution": {...}
  }
}
```

---

## Playbooks

### Get Available Playbooks

**Endpoint:** `GET /api/playbooks`

**Description:** Fetch all available response playbooks

**Request:**
```http
GET /api/playbooks HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
```json
{
  "playbooks": [
    {
      "id": "pb-brute-001",
      "name": "Brute Force Mitigation",
      "description": "Automated response to brute force attacks",
      "severity_trigger": ["CRITICAL", "HIGH"],
      "threat_types": ["BRUTE_FORCE", "AUTHENTICATION"],
      "steps": [
        "Block source IP at firewall",
        "Disable compromised accounts",
        "Enable rate limiting"
      ],
      "estimated_duration_seconds": 120,
      "auto_execute": false
    }
  ],
  "count": 1
}
```

---

### Execute Playbook

**Endpoint:** `POST /api/playbooks/execute`

**Description:** Execute a playbook for a threat

**Request Body:**
```json
{
  "playbook_id": "pb-brute-001",
  "threat_id": "THR-8B00500B"
}
```

**Request:**
```http
POST /api/playbooks/execute HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "playbook_id": "pb-brute-001",
  "threat_id": "THR-8B00500B"
}
```

**Response:** `200 OK`
```json
{
  "execution_id": "exec-1234567890",
  "playbook_id": "pb-brute-001",
  "threat_id": "THR-8B00500B",
  "status": "RUNNING",
  "started_at": "2025-12-27T17:00:00.000000+00:00",
  "current_step": 1,
  "total_steps": 5
}
```

---

### Get Playbook History

**Endpoint:** `GET /api/playbooks/history`

**Description:** Get past playbook executions

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Max executions to return |

**Request:**
```http
GET /api/playbooks/history?limit=10 HTTP/1.1
Host: localhost:8000
```

**Response:** `200 OK`
```json
{
  "executions": [
    {
      "execution_id": "exec-1234567890",
      "playbook_id": "pb-brute-001",
      "playbook_name": "Brute Force Mitigation",
      "threat_id": "THR-8B00500B",
      "status": "COMPLETED",
      "started_at": "2025-12-27T17:00:00.000000+00:00",
      "completed_at": "2025-12-27T17:02:00.000000+00:00",
      "duration_seconds": 120,
      "steps_completed": 5,
      "steps_failed": 0,
      "executed_by": "system-auto",
      "result": "Success"
    }
  ],
  "count": 1
}
```

---

## Simulation

### Simulate Security Event

**Endpoint:** `POST /api/simulate/event`

**Description:** Simulate a security event for testing

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
    "usernames": ["admin", "root", "user"]
  },
  "metadata": {
    "scenario": "brute_force",
    "test": true
  }
}
```

**Request:**
```http
POST /api/simulate/event HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "event_id": "SIM-1766854407",
  "timestamp": "2025-12-27T16:53:27.000000Z",
  "event_type": "brute_force",
  "source_ip": "185.234.72.91",
  "destination_ip": "10.0.0.100",
  "destination_port": 22,
  "protocol": "TCP",
  "payload": {"attempts": 150},
  "metadata": {"scenario": "brute_force"}
}
```

**Response:** `200 OK`
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

**Response Codes:**
- `200 OK` - Event simulated successfully
- `400 Bad Request` - Invalid event format

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Threat THR-INVALID not found",
    "details": {}
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `400` | Bad Request | Invalid request format |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Server error |
| `503` | Service Unavailable | Service degraded |

---

## Rate Limiting

**Current:** No rate limiting (development)

**Recommendation:** Implement rate limiting in production
- 1000 requests per minute per IP
- 100 requests per minute per API key

---

## CORS

**Allowed Origins:**
- `http://localhost:3000`
- `http://localhost:3001`
- Production frontend URL (configurable)

**Allowed Methods:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

**Allowed Headers:** `*`

---

## Testing

### Using curl

```bash
# Health check
curl http://localhost:8000/api/health

# Get recent threats
curl "http://localhost:8000/api/threats/recent?limit=10"

# Simulate event
curl -X POST http://localhost:8000/api/simulate/event \
  -H "Content-Type: application/json" \
  -d '{"event_id":"TEST-123","timestamp":"2025-12-27T17:00:00Z","event_type":"brute_force","source_ip":"1.2.3.4","destination_ip":"10.0.0.1","destination_port":22,"protocol":"TCP","payload":{},"metadata":{}}'
```

### Using Postman

Import the following collection:
```json
{
  "info": { "name": "ThreatStream API", "schema": "..." },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:8000/api/health"
      }
    }
  ]
}
```

---

## Related Documentation

- [WEBSOCKET_PROTOCOL.md](./WEBSOCKET_PROTOCOL.md) - WebSocket specification
- [FEATURE_*.md](./FEATURE_THREAT_STREAM.md) - Feature-specific endpoint details

---

**Last Updated:** December 27, 2025
