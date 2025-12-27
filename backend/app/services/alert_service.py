"""
Alert Service - Alert creation and management
"""
import uuid
from datetime import datetime
from app.models.alert import Alert, AlertPriority, AlertStatus
from app.models.threat import Threat, SeverityLevel
from app.services.firestore_service import get_firestore_service
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AlertService:
    """Service for managing security alerts."""

    def __init__(self):
        self.db = get_firestore_service()
        logger.info("AlertService initialized")

    async def create_alert(self, threat: Threat) -> Alert:
        """
        Create an alert from a threat.

        Args:
            threat: Threat object to create alert from

        Returns:
            Created Alert object
        """
        priority = self._determine_priority(threat)

        alert = Alert(
            id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
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
        logger.info(f"Created {priority.value} alert: {alert.id} for threat: {threat.id}")

        return alert

    async def acknowledge_alert(self, alert_id: str, analyst_id: str, notes: str = None) -> bool:
        """Acknowledge an alert."""
        success = await self.db.update_alert_status(
            alert_id,
            AlertStatus.ACKNOWLEDGED.value,
            analyst_id
        )

        if success:
            logger.info(f"Alert {alert_id} acknowledged by {analyst_id}")

        return success

    async def resolve_alert(self, alert_id: str, analyst_id: str, resolution: str, notes: str = None) -> bool:
        """Resolve an alert."""
        status = AlertStatus.RESOLVED.value if resolution == "RESOLVED" else AlertStatus.FALSE_POSITIVE.value

        success = await self.db.update_alert_status(alert_id, status, analyst_id)

        if success:
            logger.info(f"Alert {alert_id} resolved as {resolution} by {analyst_id}")

        return success

    def _determine_priority(self, threat: Threat) -> AlertPriority:
        """
        Determine alert priority from threat characteristics.

        Priority Rules:
        - P1 (Immediate): CRITICAL severity or HIGH with risk >= 80
        - P2 (Urgent): HIGH severity with risk < 80 or MEDIUM with risk >= 60
        - P3 (Medium): MEDIUM severity with risk < 60
        - P4 (Low): All others
        """
        if threat.severity == SeverityLevel.CRITICAL:
            return AlertPriority.P1

        if threat.severity == SeverityLevel.HIGH:
            return AlertPriority.P1 if threat.risk_score >= 80 else AlertPriority.P2

        if threat.severity == SeverityLevel.MEDIUM:
            return AlertPriority.P2 if threat.risk_score >= 60 else AlertPriority.P3

        return AlertPriority.P4


# Global instance
_alert_service = None


def get_alert_service() -> AlertService:
    """Get the global AlertService instance."""
    global _alert_service
    if _alert_service is None:
        _alert_service = AlertService()
    return _alert_service
