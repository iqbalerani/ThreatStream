"""
Alerts API Routes
"""
from fastapi import APIRouter, HTTPException
from app.models.alert import AlertAcknowledge, AlertResolve
from app.services.firestore_service import get_firestore_service
from app.services.alert_service import get_alert_service
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/active")
async def get_active_alerts(limit: int = 50):
    """
    Get active alerts.

    Args:
        limit: Maximum number of alerts to return

    Returns:
        List of active alerts
    """
    db = get_firestore_service()
    alerts = await db.get_active_alerts(limit=limit)
    return {"alerts": alerts, "count": len(alerts)}


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, data: AlertAcknowledge):
    """
    Acknowledge an alert.

    Args:
        alert_id: Alert identifier
        data: Acknowledgment data (analyst_id, notes)

    Returns:
        Success status
    """
    alert_service = get_alert_service()
    success = await alert_service.acknowledge_alert(
        alert_id=alert_id,
        analyst_id=data.analyst_id,
        notes=data.notes
    )

    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {"message": "Alert acknowledged successfully"}


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, data: AlertResolve):
    """
    Resolve an alert.

    Args:
        alert_id: Alert identifier
        data: Resolution data (analyst_id, resolution, notes)

    Returns:
        Success status
    """
    alert_service = get_alert_service()
    success = await alert_service.resolve_alert(
        alert_id=alert_id,
        analyst_id=data.analyst_id,
        resolution=data.resolution,
        notes=data.notes
    )

    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {"message": f"Alert resolved as {data.resolution}"}
