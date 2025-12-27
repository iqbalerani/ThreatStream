"""
Firestore Database Service
Storage and retrieval of threats, alerts, and analytics
"""
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from app.models.threat import Threat
from app.models.alert import Alert
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class FirestoreService:
    """
    Service for Firestore database operations.

    Note: This is a simplified in-memory implementation for demonstration.
    In production, integrate with actual Google Cloud Firestore.
    """

    def __init__(self):
        # In-memory storage (replace with Firestore in production)
        self.threats: List[Dict] = []
        self.alerts: List[Dict] = []
        self.max_threats = 1000  # Keep last 1000 threats in memory

        logger.info("FirestoreService initialized (in-memory mode)")

    async def store_threat(self, threat: Threat) -> None:
        """Store a threat in the database."""
        try:
            threat_dict = threat.dict()
            self.threats.insert(0, threat_dict)  # Add to beginning

            # Keep only recent threats
            if len(self.threats) > self.max_threats:
                self.threats = self.threats[:self.max_threats]

            logger.debug(f"Stored threat: {threat.id}")
        except Exception as e:
            logger.error(f"Failed to store threat: {e}")
            raise

    async def get_threat(self, threat_id: str) -> Optional[Dict]:
        """Get a specific threat by ID."""
        for threat in self.threats:
            if threat.get("id") == threat_id:
                return threat
        return None

    async def get_recent_threats(self, limit: int = 50, severity: Optional[str] = None) -> List[Dict]:
        """Get recent threats, optionally filtered by severity."""
        threats = self.threats

        if severity:
            threats = [t for t in threats if t.get("severity") == severity]

        return threats[:limit]

    async def store_alert(self, alert: Alert) -> None:
        """Store an alert in the database."""
        try:
            alert_dict = alert.dict()
            self.alerts.insert(0, alert_dict)
            logger.debug(f"Stored alert: {alert.id}")
        except Exception as e:
            logger.error(f"Failed to store alert: {e}")
            raise

    async def get_active_alerts(self, limit: int = 50) -> List[Dict]:
        """Get active alerts."""
        active_alerts = [
            a for a in self.alerts
            if a.get("status") in ["NEW", "ACKNOWLEDGED", "INVESTIGATING"]
        ]
        return active_alerts[:limit]

    async def update_alert_status(self, alert_id: str, status: str, analyst_id: Optional[str] = None) -> bool:
        """Update alert status."""
        for alert in self.alerts:
            if alert.get("id") == alert_id:
                alert["status"] = status
                if analyst_id:
                    alert["assigned_to"] = analyst_id
                    alert["assigned_at"] = datetime.utcnow().isoformat()
                logger.debug(f"Updated alert {alert_id} status to {status}")
                return True
        return False

    async def get_threat_stats(self) -> Dict:
        """Get aggregated threat statistics."""
        total = len(self.threats)

        # Count by severity
        severity_counts = {}
        for threat in self.threats:
            severity = threat.get("severity", "UNKNOWN")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        # Count by type
        type_counts = {}
        for threat in self.threats:
            threat_type = threat.get("threat_type", "UNKNOWN")
            type_counts[threat_type] = type_counts.get(threat_type, 0) + 1

        return {
            "total_threats": total,
            "severity_distribution": severity_counts,
            "type_distribution": type_counts
        }


# Global instance
_firestore_service = None


def get_firestore_service() -> FirestoreService:
    """Get the global FirestoreService instance."""
    global _firestore_service
    if _firestore_service is None:
        _firestore_service = FirestoreService()
    return _firestore_service
