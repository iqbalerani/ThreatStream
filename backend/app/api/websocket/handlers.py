"""
WebSocket Message Handlers
Handles WebSocket messages and sends initial state
"""
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from app.api.websocket.manager import ConnectionManager
from app.services.firestore_service import get_firestore_service
from app.services.metrics_service import get_metrics_service
from app.utils.logger import get_logger

logger = get_logger(__name__)


class WebSocketHandler:
    """Handles WebSocket communication with clients."""

    def __init__(self, websocket: WebSocket, manager: ConnectionManager):
        self.websocket = websocket
        self.manager = manager
        self.db = get_firestore_service()
        self.metrics = get_metrics_service()

    async def send_initial_state(self, client_epoch: Optional[int] = None):
        """
        Send epoch-aware initial application state to newly connected client.

        If client_epoch doesn't match CURRENT_SCENARIO_ID, sends baseline state
        to prevent stale risk metrics on reconnect during scenario transitions.

        This implements state-aware stream processing - same pattern as Apache Flink.
        """
        try:
            # Import current scenario epoch from main module
            from app.main import CURRENT_SCENARIO_ID

            # Get current metrics (always needed)
            dashboard_stats = self.metrics.get_dashboard_stats()
            risk_timeline = self.metrics.get_risk_timeline()

            # Epoch-aware state: Check for stale client reconnecting during scenario transition
            if client_epoch is not None and CURRENT_SCENARIO_ID is not None and client_epoch != CURRENT_SCENARIO_ID:
                # Client is from old epoch - send baseline state instead of stale cached state
                logger.info(
                    f"⏭️  Epoch mismatch detected: client_epoch={client_epoch}, "
                    f"server_epoch={CURRENT_SCENARIO_ID} - sending baseline state"
                )

                # RESET METRICS SERVICE TO BASELINE (prevents stale risk from cached state)
                self.metrics.current_risk_index = 5
                self.metrics.risk_history = [5]
                self.metrics.risk_trend = "STABLE"

                # Baseline state for new scenario epoch
                risk_index = {"value": 5, "level": "NORMAL", "trend": "STABLE"}
                recent_threats = []  # Empty - will rebuild from live stream
                active_alerts = []   # Empty - will rebuild from live stream

            else:
                # Normal flow: epochs match or no epoch provided - send full cached state
                if client_epoch is not None:
                    logger.info(f"✅ Epoch match: {client_epoch} - sending full cached state")
                else:
                    logger.debug("No client epoch provided - sending full cached state (backwards compatible)")

                risk_index = self.metrics.get_current_risk_index()
                recent_threats = await self.db.get_recent_threats(limit=20)
                active_alerts = await self.db.get_active_alerts(limit=10)

            # Prepare message with JSON-serializable data
            message = {
                "type": "initial_state",
                "data": {
                    "threats": recent_threats,
                    "alerts": active_alerts,
                    "dashboard_stats": dashboard_stats,
                    "risk_index": risk_index,
                    "risk_timeline": risk_timeline
                }
            }

            # Convert to JSON-serializable format (handles datetime, etc.)
            serializable_message = jsonable_encoder(message)

            # Send initial state
            await self.manager.send_to_client(self.websocket, serializable_message)

            logger.debug("Sent initial state to client")

        except Exception as e:
            logger.error(f"Error sending initial state: {e}")

    async def handle_message(self, data: Dict[str, Any]):
        """
        Handle incoming messages from client.

        Supported message types:
        - handshake: Initial connection with epoch information
        - subscribe: Subscribe to specific event types
        - unsubscribe: Unsubscribe from event types
        - request_state: Request current state update
        """
        message_type = data.get("type")

        if message_type == "handshake":
            # Handle handshake with epoch
            client_epoch = data.get("epoch")
            logger.info(f"🤝 Received handshake from client with epoch: {client_epoch}")
            # Send epoch-aware initial state
            await self.send_initial_state(client_epoch=client_epoch)

        elif message_type == "request_state":
            # Request state update (optionally with epoch)
            client_epoch = data.get("epoch")
            await self.send_initial_state(client_epoch=client_epoch)

        elif message_type == "subscribe":
            # Handle subscription logic
            logger.debug(f"Client subscribed to: {data.get('topics', [])}")

        elif message_type == "unsubscribe":
            # Handle unsubscription logic
            logger.debug(f"Client unsubscribed from: {data.get('topics', [])}")

        else:
            logger.warning(f"Unknown message type: {message_type}")
