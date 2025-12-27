"""
Health Check Endpoints
"""
from fastapi import APIRouter
from datetime import datetime
from app.config import settings

router = APIRouter()


@router.get("/api/health")
async def health_check():
    """
    Health check endpoint.

    Returns system health status.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.2.0",
        "environment": settings.environment,
        "services": {
            "kafka": "configured" if settings.confluent_bootstrap_servers else "not_configured",
            "gemini": "configured" if settings.gemini_api_key else "not_configured",
            "firestore": "configured" if settings.google_cloud_project else "not_configured"
        }
    }


@router.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "ThreatStream API",
        "version": "3.2.0",
        "status": "operational",
        "engine": "GEMINI-PRO-ENGINE",
        "cluster_id": "SOC-KAFKA-PROD-01",
        "docs": "/docs",
        "websocket": "/ws/live"
    }
