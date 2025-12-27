"""
Analytics API Routes
"""
from fastapi import APIRouter
from app.services.metrics_service import get_metrics_service
from app.services.firestore_service import get_firestore_service
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/dashboard")
async def get_dashboard_metrics():
    """
    Get complete dashboard metrics.

    Returns:
        Dashboard statistics including:
        - Events processed
        - Threats detected
        - Alerts generated
        - Detection time
        - Latency history
    """
    metrics = get_metrics_service()
    dashboard_stats = metrics.get_dashboard_stats()

    return dashboard_stats


@router.get("/risk-index")
async def get_risk_index():
    """
    Get current risk index.

    Returns:
        Risk index with value (0-100), level, and trend
    """
    metrics = get_metrics_service()
    risk_index = metrics.get_current_risk_index()

    return risk_index


@router.get("/timeline")
async def get_risk_timeline():
    """
    Get risk timeline data for charts.

    Returns:
        List of risk data points over time
    """
    metrics = get_metrics_service()
    timeline = metrics.get_risk_timeline()

    return {"timeline": timeline}


@router.get("/summary")
async def get_analytics_summary():
    """
    Get complete analytics summary.

    Returns:
        Comprehensive analytics including:
        - Dashboard stats
        - Risk index
        - Timeline
        - Threat statistics
    """
    metrics = get_metrics_service()
    db = get_firestore_service()

    dashboard_stats = metrics.get_dashboard_stats()
    risk_index = metrics.get_current_risk_index()
    timeline = metrics.get_risk_timeline()
    threat_stats = await db.get_threat_stats()

    return {
        "dashboard_stats": dashboard_stats,
        "risk_index": risk_index,
        "risk_timeline": timeline,
        "threat_stats": threat_stats
    }
