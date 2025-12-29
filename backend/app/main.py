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

# State-aware streaming: Current scenario epoch ID
# Events with different scenario_id are considered stale and will be dropped
CURRENT_SCENARIO_ID = None


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
    risk_index_task = asyncio.create_task(metrics_service.start_risk_index_publisher())

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
    risk_index_task.cancel()

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
    WebSocket endpoint for real-time threat stream with epoch-aware state.

    Clients connect here to receive real-time updates about:
    - new_threat: New threat detected
    - new_alert: Critical alert created
    - metrics_update: Real-time metrics
    - risk_update: Risk index change
    - heartbeat: Keep-alive ping

    Protocol:
    1. Client sends handshake with current scenario epoch
    2. Server responds with epoch-aware initial state
    3. Subsequent messages are handled normally
    """
    await ws_manager.connect(websocket)
    handler = WebSocketHandler(websocket, ws_manager)

    try:
        # Wait for initial handshake message from client with epoch
        # This prevents sending stale cached state on reconnects
        first_message = await websocket.receive_json()

        if first_message.get("type") == "handshake":
            # Client sent handshake with epoch - proper protocol
            client_epoch = first_message.get("epoch")
            logger.info(f"🤝 Client connected with handshake, epoch: {client_epoch}")
            await handler.handle_message(first_message)
        else:
            # Backwards compatibility: Client didn't send handshake
            # Send initial state without epoch validation
            logger.debug("Client connected without handshake - backwards compatible mode")
            await handler.send_initial_state()
            # Process the first message normally
            await handler.handle_message(first_message)

        # Handle subsequent messages
        while True:
            data = await websocket.receive_json()
            await handler.handle_message(data)

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


@app.post("/api/ai/analyze")
async def analyze_threats(request: dict):
    """
    Generate AI reasoning and analysis for security threats.

    Args:
        request: {
            "threats": [threat_data, ...],  # Array of threat objects
            "context": "optional context"
        }

    Returns:
        AI analysis with MITRE mapping, confidence, and recommended actions
    """
    try:
        from app.core.gemini_analyzer import GeminiThreatAnalyzer

        threats = request.get("threats", [])
        if not threats:
            return {"error": "No threats provided"}

        # Take the most recent/critical threat for analysis
        primary_threat = threats[0]

        # Create analyzer
        analyzer = GeminiThreatAnalyzer()

        # Build comprehensive event data for analysis
        event_data = {
            "event_id": primary_threat.get("id", "unknown"),
            "event_type": primary_threat.get("threat_type", primary_threat.get("type", "unknown")),
            "source_ip": primary_threat.get("sourceIp", primary_threat.get("source_ip", "unknown")),
            "destination_ip": primary_threat.get("destination_ip", "10.0.0.1"),
            "severity": primary_threat.get("severity", "MEDIUM"),
            "description": primary_threat.get("description", "Security event detected"),
            "timestamp": primary_threat.get("timestamp", ""),
            "metadata": {
                "all_threats": threats,
                "threat_count": len(threats)
            }
        }

        # Get AI analysis
        analysis = await analyzer.analyze(event_data)

        # Return formatted response matching frontend expectations
        return {
            "explanation": analysis.contextual_analysis,
            "factors": analysis.contributing_signals,
            "confidence": "High" if analysis.confidence >= 0.8 else "Medium" if analysis.confidence >= 0.5 else "Low",
            "summary": analysis.description,
            "mitreAttack": f"{analysis.mitre_attack_id} - {analysis.mitre_attack_name}" if analysis.mitre_attack_id else "N/A",
            "recommendedActions": analysis.recommended_actions,
            "severity": analysis.severity.value,
            "threat_type": analysis.threat_type.value,
            "audit_ref": analysis.audit_ref
        }

    except Exception as e:
        logger.error(f"AI analysis error: {e}", exc_info=True)
        return {
            "explanation": "AI analysis temporarily unavailable. System operating in fallback mode.",
            "factors": ["Service unavailable"],
            "confidence": "Low",
            "summary": "AI Analysis Unavailable",
            "mitreAttack": "N/A",
            "recommendedActions": ["Review manually", "Check system logs"],
            "error": str(e)
        }


@app.post("/api/simulate/event")
async def simulate_event(event_data: dict):
    """
    Simulate processing a security event (for testing).

    Publishes raw event to security.raw.logs topic, which is then
    consumed and processed by the Kafka consumer pipeline.

    ALSO processes the event immediately for instant WebSocket broadcast,
    bypassing Kafka consumer lag for real-time display.

    Updates CURRENT_SCENARIO_ID for state-aware streaming.

    Args:
        event_data: Security event data

    Returns:
        Acknowledgment
    """
    global CURRENT_SCENARIO_ID, threat_processor

    try:
        # Update current scenario ID if present (state-aware streaming)
        metadata = event_data.get("metadata", {})
        if "scenario_id" in metadata:
            new_scenario_id = metadata["scenario_id"]
            if CURRENT_SCENARIO_ID != new_scenario_id:
                logger.info(f"📌 Scenario epoch changed: {CURRENT_SCENARIO_ID} → {new_scenario_id}")
                CURRENT_SCENARIO_ID = new_scenario_id

        # Get Kafka producer
        producer = get_producer()

        # Publish raw event to security.raw.logs topic
        # This simulates external systems sending raw logs to Kafka
        if producer:
            producer.produce_threat(event_data, settings.kafka_raw_topic)
            logger.debug(f"📝 Published raw event to Kafka topic: {settings.kafka_raw_topic}")
        else:
            logger.warning("Kafka producer not available - event not published")

        # IMMEDIATE PROCESSING: Process event directly for instant display
        # This bypasses Kafka consumer lag and provides real-time updates
        if threat_processor:
            from app.models.events import SecurityEvent

            # Convert dict to SecurityEvent model
            security_event = SecurityEvent(**event_data)

            # Process immediately (will broadcast via WebSocket)
            await threat_processor.process_event(security_event)
            logger.debug(f"⚡ Immediately processed simulation event {security_event.event_id}")

        return {
            "status": "success",
            "message": "Event published and processed successfully"
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
