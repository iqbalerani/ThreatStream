"""
ThreatStream Backend - Main Application
Real-time AI-powered cybersecurity threat detection platform
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.encoders import jsonable_encoder
import uvicorn

from app.config import settings
from app.api.routes import health, threats, alerts, analytics, playbooks
from app.api.websocket.manager import get_connection_manager
from app.api.websocket.handlers import WebSocketHandler
from app.services.threat_processor import get_threat_processor
from app.services.metrics_service import get_metrics_service
from app.core.kafka_producer import get_producer
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

    # Initialize Kafka consumer (if credentials are configured)
    kafka_consumer = None
    consumer_task = None

    if settings.confluent_bootstrap_servers and settings.confluent_api_key:
        try:
            logger.info("🔌 Initializing Kafka consumer...")
            from app.core.kafka_consumer import ThreatStreamConsumer

            kafka_consumer = ThreatStreamConsumer(
                topic=settings.kafka_raw_topic,
                group_id=settings.kafka_consumer_group
            )

            # Register threat processor as event handler
            kafka_consumer.add_handler(threat_processor.process_event)

            # Start consumer in background
            consumer_task = asyncio.create_task(kafka_consumer.start())

            logger.info(f"✅ Kafka consumer started for topic: {settings.kafka_raw_topic}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Kafka consumer: {e}")
            logger.warning("⚠️  Running without Kafka consumer (REST API mode)")
            kafka_consumer = None
            consumer_task = None
    else:
        logger.warning("⚠️  Kafka credentials not configured - running without Kafka consumer")

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

    # Cancel background tasks
    heartbeat_task.cancel()
    metrics_task.cancel()

    # Stop Kafka consumer if running
    if consumer_task:
        logger.info("🛑 Stopping Kafka consumer...")
        consumer_task.cancel()

    if kafka_consumer:
        kafka_consumer.stop()

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

    Publishes raw event to security.raw.logs topic, which is then
    consumed and processed by the Kafka consumer pipeline.

    Args:
        event_data: Security event data

    Returns:
        Acknowledgment
    """
    try:
        # Get Kafka producer
        producer = get_producer()

        # Publish raw event to security.raw.logs topic
        # This simulates external systems sending raw logs to Kafka
        if producer:
            producer.produce_threat(event_data, settings.kafka_raw_topic)
            logger.info(f"📝 Published raw event to Kafka topic: {settings.kafka_raw_topic}")
        else:
            logger.warning("Kafka producer not available - event not published")
            return {"status": "error", "message": "Kafka producer not available"}

        return {
            "status": "success",
            "message": "Event published to Kafka successfully"
        }

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
