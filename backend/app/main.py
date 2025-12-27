"""
ThreatStream Backend - Main Application
Real-time AI-powered cybersecurity threat detection platform
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from app.config import settings
from app.api.routes import health, threats, alerts, analytics, playbooks
from app.api.websocket.manager import get_connection_manager
from app.api.websocket.handlers import WebSocketHandler
from app.services.threat_processor import get_threat_processor
from app.services.metrics_service import get_metrics_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Global instances
ws_manager = get_connection_manager()
threat_processor = None
metrics_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global threat_processor, metrics_service

    logger.info("🚀 Starting ThreatStream Backend...")

    # Initialize services
    threat_processor = get_threat_processor()
    metrics_service = get_metrics_service()

    # Start background tasks
    heartbeat_task = asyncio.create_task(ws_manager.heartbeat_loop())
    metrics_task = asyncio.create_task(metrics_service.start_aggregation())

    logger.info("✅ ThreatStream Backend started successfully")
    logger.info(f"📡 Kafka: {settings.kafka_raw_topic if settings.confluent_bootstrap_servers else 'Not configured'}")
    logger.info(f"🧠 AI Engine: {settings.gemini_model if settings.gemini_api_key else 'Not configured'}")
    logger.info(f"🌍 Environment: {settings.environment}")
    logger.info(f"🔌 WebSocket Manager: Active")
    logger.info(f"⚙️  Threat Processor: Initialized")

    yield

    # Shutdown
    logger.info("🛑 Shutting down ThreatStream Backend...")
    heartbeat_task.cancel()
    metrics_task.cancel()
    logger.info("👋 ThreatStream Backend shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="ThreatStream API",
    description="Real-time AI-powered cybersecurity threat detection platform",
    version="3.2.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(threats.router, prefix="/api/threats", tags=["Threats"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(playbooks.router, prefix="/api/playbooks", tags=["Playbooks"])


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time threat stream.

    Clients connect here to receive real-time updates about:
    - new_threat: New threat detected
    - new_alert: Critical alert created
    - metrics_update: Real-time metrics
    - risk_update: Risk index change
    - heartbeat: Keep-alive ping
    """
    await ws_manager.connect(websocket)
    handler = WebSocketHandler(websocket, ws_manager)

    try:
        # Send initial state to client
        await handler.send_initial_state()

        # Handle incoming messages
        while True:
            data = await websocket.receive_json()
            await handler.handle_message(data)

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


@app.post("/api/simulate/event")
async def simulate_event(event_data: dict):
    """
    Simulate processing a security event (for testing).

    Args:
        event_data: Security event data

    Returns:
        Processing result
    """
    try:
        # Process the event through the pipeline
        await threat_processor.process_event(event_data)

        # Get the latest threat
        from app.services.firestore_service import get_firestore_service
        db = get_firestore_service()
        recent_threats = await db.get_recent_threats(limit=1)

        if recent_threats:
            threat = recent_threats[0]

            # Broadcast to WebSocket clients
            await ws_manager.broadcast({
                "type": "new_threat",
                "data": threat
            })

            # If high/critical severity, also broadcast as alert
            if threat.get("severity") in ["CRITICAL", "HIGH"]:
                await ws_manager.broadcast({
                    "type": "new_alert",
                    "data": {
                        "id": f"ALT-{threat['id']}",
                        "threat_id": threat['id'],
                        "severity": threat['severity'],
                        "description": threat['description']
                    }
                })

            return {
                "status": "success",
                "threat": threat,
                "message": "Event processed successfully"
            }

        return {"status": "success", "message": "Event processed"}

    except Exception as e:
        logger.error(f"Error simulating event: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
