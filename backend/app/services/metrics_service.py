"""
Real-time Metrics Service
Aggregates and tracks system performance metrics
"""
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, List
from app.models.threat import Threat, RiskLevel
from app.models.analytics import TimelineData
from app.core.kafka_producer import get_producer
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MetricsService:
    """Service for real-time metrics aggregation and tracking."""

    def __init__(self):
        self.events_processed = 0
        self.threats_detected = 0
        self.alerts_generated = 0
        self.events_blocked = 0

        # Performance metrics
        self.detection_times = []
        self.max_detection_times = 100

        # Risk timeline (last 30 data points)
        self.risk_timeline: List[TimelineData] = []
        self.max_timeline_points = 30

        # Current risk index
        self.current_risk_index = 10
        self.risk_trend = "STABLE"

        # Kafka producer for publishing metrics
        self.producer = get_producer()

        logger.info("MetricsService initialized")

    async def record_event_processed(self):
        """Record that an event was processed."""
        self.events_processed += 1

    async def record_threat(self, threat: Threat):
        """Record a detected threat."""
        self.threats_detected += 1

        # Update risk timeline
        now = datetime.now()
        time_str = now.strftime("%H:%M:%S")

        # Calculate risk based on threat
        risk_contribution = self._calculate_risk_contribution(threat)
        self.current_risk_index = min(100, max(0, self.current_risk_index + risk_contribution))

        timeline_point = TimelineData(time=time_str, risk=self.current_risk_index)
        self.risk_timeline.append(timeline_point)

        # Keep only recent points
        if len(self.risk_timeline) > self.max_timeline_points:
            self.risk_timeline = self.risk_timeline[-self.max_timeline_points:]

    async def record_alert(self):
        """Record that an alert was generated."""
        self.alerts_generated += 1

    async def record_detection_time(self, time_ms: int):
        """Record detection time in milliseconds."""
        self.detection_times.append(time_ms)
        if len(self.detection_times) > self.max_detection_times:
            self.detection_times = self.detection_times[-self.max_detection_times:]

    def get_current_risk_index(self) -> Dict:
        """Get current risk index."""
        risk_level = self._determine_risk_level(self.current_risk_index)

        return {
            "value": int(self.current_risk_index),
            "level": risk_level,
            "trend": self.risk_trend
        }

    def get_risk_timeline(self) -> List[Dict]:
        """Get risk timeline data."""
        return [{"time": point.time, "risk": point.risk} for point in self.risk_timeline]

    def get_dashboard_stats(self) -> Dict:
        """Get complete dashboard statistics."""
        avg_detection_time = int(sum(self.detection_times) / len(self.detection_times)) if self.detection_times else 120

        return {
            "processed": self.events_processed,
            "blocked": self.events_blocked,
            "critical": self.threats_detected,
            "avg_detect_time": avg_detection_time,
            "latency_history": self.detection_times[-15:] if self.detection_times else [120, 125, 118, 110, 105],
            "alerts_generated": self.alerts_generated,
            "threats_detected": self.threats_detected
        }

    async def start_aggregation(self):
        """Start background metrics aggregation and publishing task."""
        while True:
            await asyncio.sleep(30)  # Update every 30 seconds
            self._decay_risk_index()

            # Publish metrics snapshot to Kafka
            await self._publish_metrics_snapshot()

    def _calculate_risk_contribution(self, threat: Threat) -> float:
        """Calculate how much a threat contributes to risk index."""
        severity_contribution = {
            "CRITICAL": 15.0,
            "HIGH": 8.0,
            "MEDIUM": 3.0,
            "LOW": 1.0,
            "INFO": 0.0
        }

        base_contribution = severity_contribution.get(threat.severity.value, 1.0)

        # Multiply by confidence
        contribution = base_contribution * threat.confidence

        return contribution

    def _decay_risk_index(self):
        """Gradually decay risk index over time if no new threats."""
        # Decay by 2% every 30 seconds if no activity
        self.current_risk_index = max(10, self.current_risk_index * 0.98)

    def _determine_risk_level(self, risk_value: int) -> str:
        """Determine risk level from numeric value."""
        if risk_value >= 86:
            return "CRITICAL"
        elif risk_value >= 61:
            return "SUSPICIOUS"
        elif risk_value >= 31:
            return "ELEVATED"
        else:
            return "NORMAL"

    async def _publish_metrics_snapshot(self):
        """Publish current metrics snapshot to Kafka."""
        if not self.producer:
            return

        # Build metrics snapshot
        dashboard_stats = self.get_dashboard_stats()
        risk_index = self.get_current_risk_index()

        metrics_snapshot = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dashboard_stats": dashboard_stats,
            "risk_index": risk_index,
            "system_health": {
                "events_processed": self.events_processed,
                "threats_detected": self.threats_detected,
                "alerts_generated": self.alerts_generated,
                "events_blocked": self.events_blocked
            }
        }

        # Publish to Kafka
        self.producer.produce_metrics(metrics_snapshot)
        logger.info(f"📊 Published metrics snapshot to Kafka - Risk: {risk_index['value']}, Processed: {self.events_processed}")


# Global instance
_metrics_service = None


def get_metrics_service() -> MetricsService:
    """Get the global MetricsService instance."""
    global _metrics_service
    if _metrics_service is None:
        _metrics_service = MetricsService()
    return _metrics_service
