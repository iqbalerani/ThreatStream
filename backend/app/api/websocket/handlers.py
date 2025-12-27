"""
WebSocket Message Handlers
Handles WebSocket messages and sends initial state
"""
from typing import Dict, Any
from fastapi import WebSocket
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

    async def send_initial_state(self):
        """Send initial application state to newly connected client."""
        try:
            # Get recent threats
            recent_threats = await self.db.get_recent_threats(limit=20)

            # Get active alerts
            active_alerts = await self.db.get_active_alerts(limit=10)

            # Get current metrics
            dashboard_stats = self.metrics.get_dashboard_stats()
            risk_index = self.metrics.get_current_risk_index()
            risk_timeline = self.metrics.get_risk_timeline()

            # Send initial state
            await self.manager.send_to_client(self.websocket, {
                "type": "initial_state",
                "data": {
                    "threats": recent_threats,
                    "alerts": active_alerts,
                    "dashboard_stats": dashboard_stats,
                    "risk_index": risk_index,
                    "risk_timeline": risk_timeline
                }
            })

            logger.debug("Sent initial state to client")

        except Exception as e:
            logger.error(f"Error sending initial state: {e}")

    async def handle_message(self, data: Dict[str, Any]):
        """
        Handle incoming messages from client.

        Supported message types:
        - subscribe: Subscribe to specific event types
        - unsubscribe: Unsubscribe from event types
        - request_state: Request current state update
        """
        message_type = data.get("type")

        if message_type == "request_state":
            await self.send_initial_state()

        elif message_type == "subscribe":
            # Handle subscription logic
            logger.debug(f"Client subscribed to: {data.get('topics', [])}")

        elif message_type == "unsubscribe":
            # Handle unsubscription logic
            logger.debug(f"Client unsubscribed from: {data.get('topics', [])}")

        else:
            logger.warning(f"Unknown message type: {message_type}")
