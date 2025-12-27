# ThreatStream Backend - Implementation Guide

## Current Status (as of 2025-12-27)

### ✅ **Completed (50%)**

**Foundation & Infrastructure:**
- ✅ Directory structure
- ✅ Configuration management (`config.py`)
- ✅ All Pydantic models (threat, alert, analytics, simulation, playbook)
- ✅ Utilities (logger, MITRE mapping, IP utils)
- ✅ Kafka consumer & producer
- ✅ Gemini AI analyzer
- ✅ Docker configuration (Dockerfile, docker-compose.yml)
- ✅ Basic FastAPI app with health endpoint

**Services:**
- ✅ `geo_service.py` - IP geolocation & country mapping
- ✅ `firestore_service.py` - In-memory database (ready for Firestore integration)
- ✅ `metrics_service.py` - Real-time metrics aggregation

### ❌ **Remaining (50%)**

**Critical Services (Required for Core Functionality):**
1. `app/services/alert_service.py` - Alert creation logic
2. `app/services/playbook_service.py` - Automated response execution
3. `app/services/threat_processor.py` - **MOST CRITICAL** - Main processing pipeline

**API Routes (Expose Functionality):**
4. `app/api/routes/threats.py` - Threat endpoints
5. `app/api/routes/alerts.py` - Alert CRUD operations
6. `app/api/routes/analytics.py` - Dashboard data
7. `app/api/routes/simulation.py` - Simulation controls
8. `app/api/routes/playbooks.py` - Playbook execution
9. `app/api/routes/kafka_metrics.py` - Kafka metrics

**WebSocket (Real-time Updates):**
10. `app/api/websocket/manager.py` - Connection pool
11. `app/api/websocket/handlers.py` - Message routing
12. Update `app/main.py` - Add WebSocket endpoint

**Simulation Engine (Demo/Testing):**
13. `simulator/event_generator.py` - Base generator
14. `simulator/attack_patterns.py` - Attack definitions
15. `simulator/scenarios/` - Individual scenario implementations

---

## Quick Start Templates

### 1. Alert Service (`app/services/alert_service.py`)

```python
"""Alert Service - Alert creation and management"""
import uuid
from datetime import datetime
from app.models.alert import Alert, AlertPriority, AlertStatus
from app.models.threat import Threat, SeverityLevel
from app.services.firestore_service import get_firestore_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

class AlertService:
    def __init__(self):
        self.db = get_firestore_service()

    async def create_alert(self, threat: Threat) -> Alert:
        """Create an alert from a threat."""
        priority = self._determine_priority(threat)

        alert = Alert(
            id=f"ALT-{uuid.uuid4().hex[:8]}",
            threat_id=threat.id,
            title=f"{threat.threat_type.value}: {threat.description}",
            description=threat.contextual_analysis,
            severity=threat.severity.value,
            priority=priority,
            status=AlertStatus.NEW,
            created_at=datetime.utcnow(),
            source_ip=threat.source_ip,
            source_country=threat.source_country,
            mitre_attack_id=threat.mitre_attack_id
        )

        await self.db.store_alert(alert)
        logger.info(f"Created alert: {alert.id} for threat: {threat.id}")
        return alert

    def _determine_priority(self, threat: Threat) -> AlertPriority:
        """Determine alert priority from threat."""
        if threat.severity == SeverityLevel.CRITICAL:
            return AlertPriority.P1
        elif threat.severity == SeverityLevel.HIGH:
            return AlertPriority.P2 if threat.risk_score < 80 else AlertPriority.P1
        elif threat.severity == SeverityLevel.MEDIUM:
            return AlertPriority.P3
        return AlertPriority.P4

def get_alert_service() -> AlertService:
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService()
    return _alert_service

_alert_service = None
```

### 2. Threat Processor (`app/services/threat_processor.py`)

This is the **MOST CRITICAL** component - it orchestrates the entire threat detection pipeline:

```python
"""Threat Processor - Main event processing pipeline"""
import uuid
import time
from datetime import datetime, timezone
from typing import Dict, Any
from app.core.gemini_analyzer import GeminiThreatAnalyzer
from app.models.threat import Threat, SecurityEvent, SeverityLevel
from app.services.geo_service import get_geo_service
from app.services.firestore_service import get_firestore_service
from app.services.metrics_service import get_metrics_service
from app.services.alert_service import get_alert_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

class ThreatProcessor:
    def __init__(self):
        self.analyzer = GeminiThreatAnalyzer()
        self.geo = get_geo_service()
        self.db = get_firestore_service()
        self.metrics = get_metrics_service()
        self.alerts = get_alert_service()

    async def process_event(self, event_data: Dict[str, Any]):
        """Main processing pipeline for security events."""
        start_time = time.time()

        try:
            # Step 1: Parse event
            event = SecurityEvent(**event_data)

            # Step 2: Geo enrichment
            geo_info = self.geo.lookup_ip(event.source_ip)

            # Step 3: AI analysis
            analysis = await self.analyzer.analyze(event_data)

            # Step 4: Calculate risk score
            risk_score = self._calculate_risk_score(analysis, event_data, geo_info)

            # Step 5: Create threat object
            threat = Threat(
                id=f"THR-{uuid.uuid4().hex[:8]}",
                event_id=event.event_id,
                timestamp=event.timestamp,
                severity=analysis.severity,
                threat_type=analysis.threat_type,
                risk_score=risk_score,
                source_ip=event.source_ip,
                source_country=geo_info["country"],
                source_country_code=geo_info["country_code"],
                source_zone=geo_info["zone"],
                destination_ip=event.destination_ip,
                destination_port=event.destination_port,
                confidence=analysis.confidence,
                description=analysis.description,
                contextual_analysis=analysis.contextual_analysis,
                contributing_signals=analysis.contributing_signals,
                mitre_attack_id=analysis.mitre_attack_id,
                mitre_attack_name=analysis.mitre_attack_name,
                recommended_actions=analysis.recommended_actions,
                auto_blocked=False,
                processing_time_ms=int((time.time() - start_time) * 1000),
                analyzed_at=datetime.now(timezone.utc),
                audit_ref=analysis.audit_ref
            )

            # Step 6: Store threat
            await self.db.store_threat(threat)

            # Step 7: Update metrics
            await self.metrics.record_event_processed()
            await self.metrics.record_threat(threat)
            await self.metrics.record_detection_time(threat.processing_time_ms)

            # Step 8: Create alert for CRITICAL/HIGH threats
            if analysis.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH]:
                alert = await self.alerts.create_alert(threat)
                await self.metrics.record_alert()

            # Step 9: Log high-severity threats
            if analysis.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH]:
                logger.warning(
                    f"🚨 {analysis.severity.value}: {analysis.threat_type.value} "
                    f"from {event.source_ip} [{geo_info['country_code']}] - "
                    f"{analysis.description}"
                )

        except Exception as e:
            logger.error(f"Failed to process event: {e}")
            raise

    def _calculate_risk_score(self, analysis, event_data: Dict, geo_info: Dict) -> int:
        """Calculate composite risk score (0-100)."""
        score = 0

        # Severity (0-40)
        severity_scores = {
            SeverityLevel.CRITICAL: 40,
            SeverityLevel.HIGH: 30,
            SeverityLevel.MEDIUM: 20,
            SeverityLevel.LOW: 10,
            SeverityLevel.INFO: 0
        }
        score += severity_scores.get(analysis.severity, 10)

        # Confidence (0-20)
        score += int(analysis.confidence * 20)

        # Attack type (0-20)
        if analysis.threat_type.value in ["BRUTE_FORCE", "SQL_INJECTION", "RANSOMWARE", "DDOS_ATTACK"]:
            score += 20
        elif analysis.threat_type.value in ["DATA_EXFILTRATION"]:
            score += 18
        else:
            score += 10

        # Geographic risk (0-20)
        score += int(geo_info["risk_multiplier"] * 10)

        return min(100, max(0, score))
```

### 3. WebSocket Manager (`app/api/websocket/manager.py`)

```python
"""WebSocket Connection Manager"""
import asyncio
from typing import List
from fastapi import WebSocket
from app.utils.logger import get_logger

logger = get_logger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

    async def heartbeat_loop(self):
        """Send periodic heartbeats to clients."""
        while True:
            await asyncio.sleep(30)
            await self.broadcast({"type": "heartbeat", "timestamp": datetime.utcnow().isoformat()})
```

---

## Next Steps

1. **Implement the 3 templates above** (alert_service, threat_processor, websocket manager)
2. **Add API routes** - See examples in `app/api/routes/health.py`
3. **Update `app/main.py`** to include all routes and WebSocket endpoint
4. **Test the complete pipeline** with simulated events

## Testing Commands

```bash
# Run the backend
uvicorn app.main:app --reload

# Test health endpoint
curl http://localhost:8000/api/health

# View API docs
open http://localhost:8000/docs

# Test WebSocket (from browser console)
const ws = new WebSocket('ws://localhost:8000/ws/live');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

## Integration with Frontend

Once backend is complete:
1. Update frontend `.env.local` with `VITE_API_URL=http://localhost:8000`
2. Replace simulated Kafka stream with WebSocket connection
3. Call backend APIs instead of generating events in frontend

---

**Priority Implementation Order:**
1. threat_processor.py (enables core functionality)
2. alert_service.py (automated alert creation)
3. WebSocket manager (real-time updates)
4. API routes (expose functionality)
5. Simulation engine (testing/demo data)
