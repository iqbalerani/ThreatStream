"""
Real-time Metrics Service
Aggregates and tracks system performance metrics
"""
import asyncio
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from fastapi.encoders import jsonable_encoder
from app.models.threat import Threat, RiskLevel
from app.models.analytics import TimelineData
from app.core.kafka_producer import get_producer
from app.api.websocket.manager import get_connection_manager
from app.config import settings
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

        # Current risk index (baseline for healthy systems)
        self.current_risk_index = 5
        self.risk_trend = "STABLE"

        # Risk history for trend calculation (last 10 values)
        self.risk_history = [5]
        self.max_risk_history = 10

        # Kafka producer for publishing metrics
        self.producer = get_producer()

        # WebSocket manager for real-time updates
        self.ws_manager = get_connection_manager()

        # Risk index publishing state (for change detection)
        self.last_published_risk_value = None
        self.last_publish_time = 0.0

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

        # Update risk history for trend calculation
        self.risk_history.append(self.current_risk_index)
        if len(self.risk_history) > self.max_risk_history:
            self.risk_history = self.risk_history[-self.max_risk_history:]

        # Calculate trend
        self.risk_trend = self._calculate_risk_trend()

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

            # Broadcast updated risk index after decay
            risk_index = self.get_current_risk_index()
            await self.ws_manager.broadcast(jsonable_encoder({
                "type": "risk_update",
                "data": risk_index
            }))

            # Publish metrics snapshot to Kafka
            await self._publish_metrics_snapshot()

    def _calculate_risk_contribution(self, threat: Threat) -> float:
        """
        Calculate how much a threat contributes to risk index.

        Positive values increase risk (threats detected).
        Negative values decrease risk (healthy traffic confirms no threats).
        """
        severity_contribution = {
            "CRITICAL": 15.0,   # Major threat - significant risk increase
            "HIGH": 8.0,        # Serious threat - moderate risk increase
            "MEDIUM": 3.0,      # Minor threat - small risk increase
            "LOW": 1.0,         # Low-priority event - minimal risk increase
            "INFO": -3.0        # Healthy traffic - actively reduces risk
        }

        base_contribution = severity_contribution.get(threat.severity.value, 1.0)

        # Multiply by confidence
        contribution = base_contribution * threat.confidence

        return contribution

    def _decay_risk_index(self):
        """Gradually decay risk index over time if no new threats."""
        # Decay by 15% every 30 seconds for faster recovery during healthy periods
        # Minimum risk of 5 represents truly healthy baseline
        self.current_risk_index = max(5, self.current_risk_index * 0.85)

        # Update risk history
        self.risk_history.append(self.current_risk_index)
        if len(self.risk_history) > self.max_risk_history:
            self.risk_history = self.risk_history[-self.max_risk_history:]

        # Recalculate trend
        self.risk_trend = self._calculate_risk_trend()

    def _calculate_risk_trend(self) -> str:
        """Calculate risk trend based on recent history."""
        if len(self.risk_history) < 3:
            return "STABLE"

        # Compare recent average to older average
        recent_avg = sum(self.risk_history[-3:]) / 3
        older_avg = sum(self.risk_history[:-3]) / len(self.risk_history[:-3]) if len(self.risk_history) > 3 else recent_avg

        difference = recent_avg - older_avg

        # Threshold for trend detection
        if difference > 5:
            return "RISING"
        elif difference < -5:
            return "FALLING"
        else:
            return "STABLE"

    def _determine_risk_level(self, risk_value: int) -> str:
        """Determine risk level from numeric value."""
        if risk_value >= 70:
            return "CRITICAL"
        elif risk_value >= 45:
            return "SUSPICIOUS"
        elif risk_value >= 25:
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

    async def start_risk_index_publisher(self):
        """
        Publish risk index to Kafka on meaningful change OR heartbeat.

        Publishing Logic:
        - Check every 2 seconds for changes
        - Publish if risk changed by ≥1 point
        - Publish if 10 seconds elapsed (heartbeat)

        This provides:
        - Event-driven efficiency (no spam)
        - Real-time updates (2s latency max)
        - Regular snapshots (10s heartbeat)
        - Historical audit trail
        """
        logger.info("🔄 Risk index publisher started")

        while True:
            try:
                await asyncio.sleep(2)  # Check every 2 seconds

                now = time.monotonic()
                risk = self.get_current_risk_index()

                # Determine if we should publish
                changed = (
                    self.last_published_risk_value is None or
                    abs(risk["value"] - self.last_published_risk_value) >= settings.risk_change_threshold
                )

                heartbeat_due = (now - self.last_publish_time) >= settings.risk_heartbeat_interval

                if changed or heartbeat_due:
                    # Import CURRENT_SCENARIO_ID from main module
                    from app.main import CURRENT_SCENARIO_ID

                    # Build enhanced risk snapshot
                    risk_snapshot = {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "value": int(risk["value"]),
                        "level": risk["level"],
                        "trend": risk["trend"],
                        "scenario_id": CURRENT_SCENARIO_ID,
                        "confidence": 0.87,  # TODO: Make dynamic based on data quality
                        "source": "metrics_engine",
                        "version": "v1",
                        "publish_reason": "change" if changed else "heartbeat"
                    }

                    # Publish to Kafka
                    if self.producer:
                        self.producer.produce_risk_index(risk_snapshot)
                        logger.debug(
                            f"📈 Risk index published: {risk['value']} ({risk['level']}) - "
                            f"Reason: {risk_snapshot['publish_reason']}"
                        )

                    # Broadcast to WebSocket for real-time timeline visualization
                    # This ensures timeline reflects the same data as Kafka
                    timeline_update = {
                        "time": datetime.now().strftime("%H:%M:%S"),
                        "risk": int(risk["value"]),
                        "timestamp": risk_snapshot["timestamp"]
                    }
                    await self.ws_manager.broadcast(jsonable_encoder({
                        "type": "risk_timeline_update",
                        "data": timeline_update
                    }))

                    # Update state
                    self.last_published_risk_value = risk["value"]
                    self.last_publish_time = now

            except Exception as e:
                logger.error(f"Error in risk index publisher: {e}", exc_info=True)
                await asyncio.sleep(5)  # Back off on error


# Global instance
_metrics_service = None


def get_metrics_service() -> MetricsService:
    """Get the global MetricsService instance."""
    global _metrics_service
    if _metrics_service is None:
        _metrics_service = MetricsService()
    return _metrics_service
