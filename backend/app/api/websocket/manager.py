"""
WebSocket Connection Manager
Manages WebSocket connections and broadcasting
"""
import asyncio
from typing import List
from datetime import datetime
from fastapi import WebSocket
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        logger.info("ConnectionManager initialized")

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """
        Broadcast message to all connected clients.

        Args:
            message: Dictionary message to broadcast
        """
        if not self.active_connections:
            return

        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)

        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    async def send_to_client(self, websocket: WebSocket, message: dict):
        """Send message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending to client: {e}")
            self.disconnect(websocket)

    async def heartbeat_loop(self):
        """Send periodic heartbeats to keep connections alive."""
        while True:
            await asyncio.sleep(30)  # Every 30 seconds

            if self.active_connections:
                await self.broadcast({
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat()
                })

    def get_connection_count(self) -> int:
        """Get the number of active connections."""
        return len(self.active_connections)


# Global instance
_connection_manager = None


def get_connection_manager() -> ConnectionManager:
    """Get the global ConnectionManager instance."""
    global _connection_manager
    if _connection_manager is None:
        _connection_manager = ConnectionManager()
    return _connection_manager
