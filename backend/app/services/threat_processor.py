"""
Threat Processor - Main event processing pipeline
Orchestrates event ingestion, AI analysis, and alert generation
"""
import uuid
import time
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi.encoders import jsonable_encoder
from app.core.gemini_analyzer import GeminiThreatAnalyzer
from app.core.kafka_producer import get_producer
from app.models.threat import Threat, SecurityEvent, SeverityLevel
from app.services.geo_service import get_geo_service
from app.services.firestore_service import get_firestore_service
from app.services.metrics_service import get_metrics_service
from app.services.alert_service import get_alert_service
from app.api.websocket.manager import get_connection_manager
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ThreatProcessor:
    """Main threat processing pipeline orchestrator."""

    def __init__(self):
        self.analyzer = GeminiThreatAnalyzer()
        self.geo = get_geo_service()
        self.db = get_firestore_service()
        self.metrics = get_metrics_service()
        self.alerts = get_alert_service()
        self.producer = get_producer()
        self.ws_manager = get_connection_manager()

        self.events_processed = 0
        self.threats_detected = 0
        self.alerts_created = 0

        logger.info("ThreatProcessor initialized")

    async def process_event(self, event_data: Dict[str, Any]):
        """
        Main processing pipeline for security events.

        Pipeline Steps:
        0. Check scenario epoch (state-aware streaming)
        1. Parse event
        2. Geo enrichment
        3. AI analysis
        4. Risk scoring
        5. Create threat object
        6. Store in database
        7. Update metrics
        8. Generate alert (if CRITICAL/HIGH)
        9. Log high-severity threats

        Args:
            event_data: Raw security event data
        """
        start_time = time.time()

        try:
            # Step 0: State-aware streaming - Drop stale events from old scenarios
            # Import CURRENT_SCENARIO_ID from main module
            from app.main import CURRENT_SCENARIO_ID

            event_scenario_id = event_data.get("metadata", {}).get("scenario_id")
            if event_scenario_id is not None and CURRENT_SCENARIO_ID is not None:
                if event_scenario_id != CURRENT_SCENARIO_ID:
                    logger.debug(
                        f"⏭️  Dropping stale event from old scenario epoch: "
                        f"{event_scenario_id} (current: {CURRENT_SCENARIO_ID})"
                    )
                    return  # Drop event - it's from an old scenario

            # Step 1: Parse event
            event = SecurityEvent(**event_data)
            self.events_processed += 1

            # Step 2: Geo enrichment
            geo_info = self.geo.lookup_ip(event.source_ip)

            # Step 3: AI analysis
            analysis = await self.analyzer.analyze(event_data)

            # Step 4: Calculate risk score
            risk_score = self._calculate_risk_score(analysis, event_data, geo_info)

            # Step 5: Create threat object
            processing_time = int((time.time() - start_time) * 1000)

            threat = Threat(
                id=f"THR-{uuid.uuid4().hex[:8].upper()}",
                event_id=event.event_id,
                timestamp=event.timestamp,
                severity=analysis.severity,
                threat_type=analysis.threat_type,
                risk_score=risk_score,
                source_ip=event.source_ip,
                source_country=geo_info.get("country"),
                source_country_code=geo_info.get("country_code"),
                source_zone=geo_info.get("zone"),
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
                processing_time_ms=processing_time,
                analyzed_at=datetime.now(timezone.utc),
                audit_ref=analysis.audit_ref
            )

            # Step 6: Store in database
            await self.db.store_threat(threat)

            # Step 6.5: Publish analyzed threat to Kafka
            if self.producer:
                threat_dict = threat.model_dump()
                self.producer.produce_threat(threat_dict)
                logger.info(f"📡 Published threat {threat.id} to Kafka topic: security.analyzed.threats")

            # Step 6.6: Broadcast to WebSocket clients
            await self.ws_manager.broadcast(jsonable_encoder({
                "type": "new_threat",
                "data": threat.model_dump()
            }))

            # Step 7: Update metrics
            await self.metrics.record_event_processed()

            # Always record threat for risk index calculation (including INFO events with negative contribution)
            await self.metrics.record_threat(threat)

            # Only increment threat counter for actual threats (non-INFO)
            if analysis.severity != SeverityLevel.INFO:
                self.threats_detected += 1

            # Step 7.5: Broadcast updated risk index to WebSocket clients
            risk_index = self.metrics.get_current_risk_index()
            await self.ws_manager.broadcast(jsonable_encoder({
                "type": "risk_update",
                "data": risk_index
            }))

            await self.metrics.record_detection_time(processing_time)

            # Step 8: Generate alert for CRITICAL/HIGH threats
            if analysis.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH]:
                alert = await self.alerts.create_alert(threat)
                self.alerts_created += 1
                await self.metrics.record_alert()

                # Publish critical alert to Kafka alerts topic
                if self.producer:
                    alert_dict = alert.model_dump()
                    self.producer.produce_alert(alert_dict)
                    logger.info(f"📢 Published alert {alert.id} to Kafka topic: security.critical.alerts")

                # Broadcast alert to WebSocket clients
                await self.ws_manager.broadcast(jsonable_encoder({
                    "type": "new_alert",
                    "data": alert.model_dump()
                }))

            # Step 9: Log high-severity threats
            if analysis.severity in [SeverityLevel.CRITICAL, SeverityLevel.HIGH]:
                logger.warning(
                    f"🚨 {analysis.severity.value}: {analysis.threat_type.value} "
                    f"from {event.source_ip} [{geo_info.get('country_code', 'XX')}] - "
                    f"{analysis.description}"
                )

            logger.debug(f"Processed event {event.event_id} in {processing_time}ms")

        except Exception as e:
            logger.error(f"Failed to process event: {e}", exc_info=True)
            raise

    def _calculate_risk_score(self, analysis, event_data: Dict, geo_info: Dict) -> int:
        """
        Calculate composite risk score (0-100).

        Scoring Algorithm:
        - Severity Level:      40% weight (0-40 points)
        - AI Confidence:       20% weight (0-20 points)
        - Attack Type:         20% weight (0-20 points)
        - Geographic Risk:     20% weight (0-20 points)

        Returns:
            Integer risk score from 0 (no risk) to 100 (critical risk)
        """
        score = 0

        # Component 1: Severity contribution (0-40)
        severity_scores = {
            SeverityLevel.CRITICAL: 40,
            SeverityLevel.HIGH: 30,
            SeverityLevel.MEDIUM: 20,
            SeverityLevel.LOW: 10,
            SeverityLevel.INFO: 0
        }
        score += severity_scores.get(analysis.severity, 10)

        # Component 2: Confidence contribution (0-20)
        score += int(analysis.confidence * 20)

        # Component 3: Attack type severity (0-20)
        high_risk_types = ["BRUTE_FORCE", "SQL_INJECTION", "RANSOMWARE", "DDOS_ATTACK"]
        medium_risk_types = ["DATA_EXFILTRATION", "MALWARE", "PORT_SCAN"]

        if analysis.threat_type.value in high_risk_types:
            score += 20
        elif analysis.threat_type.value in medium_risk_types:
            score += 15
        else:
            score += 10

        # Component 4: Geographic risk (0-20)
        risk_multiplier = geo_info.get("risk_multiplier", 1.0)
        score += int(risk_multiplier * 10)

        return min(100, max(0, score))

    def get_stats(self) -> Dict:
        """Get processor statistics for monitoring."""
        return {
            "events_processed": self.events_processed,
            "threats_detected": self.threats_detected,
            "alerts_created": self.alerts_created,
            "analyzer_stats": self.analyzer.get_metrics()
        }


# Global instance
_threat_processor = None


def get_threat_processor() -> ThreatProcessor:
    """Get the global ThreatProcessor instance."""
    global _threat_processor
    if _threat_processor is None:
        _threat_processor = ThreatProcessor()
    return _threat_processor
