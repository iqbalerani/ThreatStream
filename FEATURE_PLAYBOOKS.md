# Feature: Automated Response Playbooks

**Backend Endpoints:** Playbook management and execution
**Purpose:** Automated threat response workflows

---

## Overview

Playbooks are pre-configured automated response workflows that execute a series of mitigation actions when triggered. They follow industry best practices for incident response (e.g., NIST, SANS) and can be manually or automatically executed.

---

## Required Backend Endpoints

### 1. Get Available Playbooks

#### **Endpoint:** `GET /api/playbooks`

**Purpose:** Fetch all available playbooks

**Example Request:**
```http
GET /api/playbooks
Host: localhost:8000
```

**Example Response:**
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
        "Enable rate limiting",
        "Alert security team",
        "Generate incident report"
      ],
      "estimated_duration_seconds": 120,
      "auto_execute": false
    },
    {
      "id": "pb-malware-001",
      "name": "Malware Containment",
      "description": "Isolate and contain malware infections",
      "severity_trigger": ["CRITICAL"],
      "threat_types": ["MALWARE", "RANSOMWARE"],
      "steps": [
        "Isolate infected host",
        "Disable network access",
        "Initiate forensic capture",
        "Scan connected systems",
        "Alert SOC team"
      ],
      "estimated_duration_seconds": 180,
      "auto_execute": false
    },
    {
      "id": "pb-ddos-001",
      "name": "DDoS Mitigation",
      "description": "Mitigate distributed denial of service attacks",
      "severity_trigger": ["CRITICAL"],
      "threat_types": ["DDOS"],
      "steps": [
        "Enable DDoS protection",
        "Route traffic through scrubbing center",
        "Block malicious source networks",
        "Scale infrastructure",
        "Monitor traffic patterns"
      ],
      "estimated_duration_seconds": 90,
      "auto_execute": true
    },
    {
      "id": "pb-phishing-001",
      "name": "Phishing Response",
      "description": "Respond to phishing attempts",
      "severity_trigger": ["HIGH", "MEDIUM"],
      "threat_types": ["PHISHING"],
      "steps": [
        "Block sender domain",
        "Quarantine related emails",
        "Reset affected credentials",
        "User awareness notification",
        "Log incident"
      ],
      "estimated_duration_seconds": 60,
      "auto_execute": false
    }
  ],
  "count": 4
}
```

---

### 2. Execute Playbook

#### **Endpoint:** `POST /api/playbooks/execute`

**Purpose:** Execute a playbook for a specific threat

**Request Body:**
```json
{
  "playbook_id": "pb-brute-001",
  "threat_id": "THR-8B00500B",
  "auto_execute": false
}
```

**Example Request:**
```http
POST /api/playbooks/execute
Host: localhost:8000
Content-Type: application/json

{
  "playbook_id": "pb-brute-001",
  "threat_id": "THR-8B00500B"
}
```

**Example Response:**
```json
{
  "execution_id": "exec-1234567890",
  "playbook_id": "pb-brute-001",
  "threat_id": "THR-8B00500B",
  "status": "RUNNING",
  "started_at": "2025-12-27T17:00:00.000000+00:00",
  "current_step": 1,
  "total_steps": 5,
  "steps_completed": [],
  "steps_failed": []
}
```

---

### 3. Get Playbook Execution History

#### **Endpoint:** `GET /api/playbooks/history`

**Purpose:** Fetch past playbook executions

**Query Parameters:**
```typescript
{
  limit?: number;  // Max executions to return (default: 50)
}
```

**Example Request:**
```http
GET /api/playbooks/history?limit=50
Host: localhost:8000
```

**Example Response:**
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
      "result": "Success - All steps completed successfully"
    }
  ],
  "count": 1
}
```

---

## Data Types

### Playbook Model

```typescript
interface Playbook {
  id: string;
  name: string;
  description: string;
  severity_trigger: string[];      // CRITICAL, HIGH, MEDIUM, LOW
  threat_types: string[];          // BRUTE_FORCE, MALWARE, etc.
  steps: string[];                 // Ordered steps
  estimated_duration_seconds: number;
  auto_execute: boolean;           // Auto-trigger on matching threats
}
```

### Playbook Execution Model

```typescript
interface PlaybookExecution {
  execution_id: string;
  playbook_id: string;
  playbook_name: string;
  threat_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  current_step?: number;
  total_steps: number;
  steps_completed: number;
  steps_failed: number;
  executed_by: string;             // analyst ID or 'system-auto'
  result?: string;
}
```

---

## Frontend Implementation

### Service Layer

**File:** `services/backendService.ts`

```typescript
export async function getPlaybooks(): Promise<any> {
  return fetchAPI('/api/playbooks');
}

export async function executePlaybook(
  playbookId: string,
  threatId: string
): Promise<any> {
  return fetchAPI('/api/playbooks/execute', {
    method: 'POST',
    body: JSON.stringify({
      playbook_id: playbookId,
      threat_id: threatId
    }),
  });
}

export async function getPlaybookHistory(limit: number = 50): Promise<any> {
  return fetchAPI(`/api/playbooks/history?limit=${limit}`);
}
```

### UI Simulation (Current)

**File:** `App.tsx` (lines 188-197)

```typescript
const handleExecuteMitigation = async () => {
  setMitigationActive(true);

  const steps = [
    "ISOLATING_TARGET_SEGMENTS",
    "ENACTING_ACL_OVERRIDE",
    "RESETTING_SESSION_HANDSHAKES",
    "DEPLOYING_IP_QUARANTINE"
  ];

  for (const step of steps) {
    setPlaybookStep(step);
    await new Promise(r => setTimeout(r, 1200));  // 1.2s per step
  }

  setPlaybookStep("PROTECTION_VERIFIED");
  setTimeout(() => setPlaybookStep(null), 3000);
};
```

**Note:** This is currently a UI simulation. For real execution, call:

```typescript
const handleExecuteMitigation = async () => {
  try {
    const threat = events.find(e => e.severity === Severity.CRITICAL);
    if (!threat) return;

    // Find matching playbook
    const playbooks = await BackendService.getPlaybooks();
    const playbook = playbooks.playbooks.find(pb =>
      pb.threat_types.includes(threat.type)
    );

    if (playbook) {
      // Execute playbook
      const execution = await BackendService.executePlaybook(
        playbook.id,
        threat.id
      );

      // Show progress
      setMitigationActive(true);
      // Poll execution status or use WebSocket for updates
    }
  } catch (error) {
    console.error('Playbook execution failed:', error);
  }
};
```

---

## Playbook Execution Flow

### Backend Implementation

```python
class PlaybookService:
    async def execute_playbook(
        self,
        playbook_id: str,
        threat_id: str,
        executed_by: str = "system-auto"
    ) -> PlaybookExecution:
        """Execute playbook steps"""

        playbook = self.get_playbook(playbook_id)
        execution = PlaybookExecution(
            execution_id=f"exec-{int(time.time())}",
            playbook_id=playbook_id,
            threat_id=threat_id,
            status="RUNNING",
            started_at=datetime.utcnow(),
            executed_by=executed_by
        )

        try:
            for i, step in enumerate(playbook.steps):
                # Execute step logic
                await self.execute_step(step, threat_id)
                execution.steps_completed += 1

                # Broadcast progress via WebSocket
                await ws_manager.broadcast({
                    "type": "playbook_progress",
                    "data": {
                        "execution_id": execution.execution_id,
                        "step": i + 1,
                        "total": len(playbook.steps),
                        "description": step
                    }
                })

            execution.status = "COMPLETED"
            execution.completed_at = datetime.utcnow()

        except Exception as e:
            execution.status = "FAILED"
            execution.result = str(e)

        return execution
```

---

## Auto-Execution

### Trigger Logic

When a threat is detected:

```python
async def process_threat(threat: Threat):
    # Create threat
    # ... threat processing logic

    # Check for matching playbooks
    for playbook in self.playbooks:
        if self.should_auto_execute(playbook, threat):
            await self.execute_playbook(playbook.id, threat.id)

def should_auto_execute(self, playbook: Playbook, threat: Threat) -> bool:
    """Determine if playbook should auto-execute"""
    return (
        playbook.auto_execute and
        threat.severity in playbook.severity_trigger and
        threat.threat_type in playbook.threat_types
    )
```

---

## WebSocket Progress Updates

### Message Type: `playbook_progress`

```json
{
  "type": "playbook_progress",
  "data": {
    "execution_id": "exec-1234567890",
    "step": 3,
    "total": 5,
    "description": "Enable rate limiting",
    "status": "RUNNING"
  }
}
```

Frontend can display this as a progress bar or step-by-step indicator.

---

## Backend Requirements

### Must Implement

1. ✅ **Playbook Storage:** Pre-configured playbooks
2. ✅ **Execution Engine:** Execute playbook steps
3. ✅ **Progress Tracking:** Track execution state
4. ✅ **History:** Store execution records
5. ✅ **Auto-execution:** Trigger on matching threats (optional)

### Step Execution

Each playbook step should map to actual system actions:
- "Block source IP" → Firewall API call
- "Disable account" → IAM API call
- "Enable rate limiting" → WAF configuration
- etc.

---

## Testing

### Manual Testing

1. Get available playbooks: `GET /api/playbooks`
2. Trigger threat that matches playbook criteria
3. Execute playbook: `POST /api/playbooks/execute`
4. Monitor progress via WebSocket
5. Verify completion: `GET /api/playbooks/history`

---

## Related Features

- [FEATURE_AI_REASONING.md](./FEATURE_AI_REASONING.md) - AI recommends playbooks
- [FEATURE_ALERTS.md](./FEATURE_ALERTS.md) - Alerts can trigger playbooks
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API reference

---

**Last Updated:** December 27, 2025
