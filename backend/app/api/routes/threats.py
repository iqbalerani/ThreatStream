"""
Threats API Routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.firestore_service import get_firestore_service
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/recent")
async def get_recent_threats(
    limit: int = 50,
    severity: Optional[str] = None
):
    """
    Get recent threats.

    Args:
        limit: Maximum number of threats to return
        severity: Filter by severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)

    Returns:
        List of recent threats
    """
    db = get_firestore_service()
    threats = await db.get_recent_threats(limit=limit, severity=severity)
    return {"threats": threats, "count": len(threats)}


@router.get("/{threat_id}")
async def get_threat(threat_id: str):
    """
    Get a specific threat by ID.

    Args:
        threat_id: Threat identifier

    Returns:
        Threat details
    """
    db = get_firestore_service()
    threat = await db.get_threat(threat_id)

    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")

    return threat


@router.get("/stats/summary")
async def get_threat_stats():
    """Get aggregated threat statistics."""
    db = get_firestore_service()
    stats = await db.get_threat_stats()
    return stats
