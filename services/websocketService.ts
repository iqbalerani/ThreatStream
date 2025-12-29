/**
 * WebSocket Service
 * Manages real-time connection to ThreatStream backend
 */

import { BackendWebSocketMessage } from '../backendTypes';

// Get WebSocket URL from environment
const WS_URL = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000/ws/live';

export type WebSocketMessageHandler = (message: BackendWebSocketMessage) => void;
export type WebSocketStatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

export class ThreatStreamWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<WebSocketMessageHandler> = new Set();
  private statusHandlers: Set<WebSocketStatusHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimer: number | null = null;
  private isManualClose = false;

  /**
   * Connect to backend WebSocket
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isManualClose = false;
    this.notifyStatus('connecting');

    try {
      console.log(`Connecting to WebSocket: ${WS_URL}`);
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.notifyStatus('error');
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.isManualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.notifyStatus('disconnected');
  }

  /**
   * Send a message to the backend
   */
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected. Cannot send message:', data);
    }
  }

  /**
   * Send handshake with scenario epoch (for epoch-aware state)
   */
  sendHandshake(epoch: number) {
    this.send({
      type: 'handshake',
      epoch: epoch
    });
    console.log(`🤝 Sent handshake with epoch: ${epoch}`);
  }

  /**
   * Request current state from backend
   */
  requestState() {
    this.send({ type: 'request_state' });
  }

  /**
   * Subscribe to WebSocket messages
   */
  onMessage(handler: WebSocketMessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to WebSocket status changes
   */
  onStatus(handler: WebSocketStatusHandler) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen() {
    console.log('WebSocket connected successfully');
    this.reconnectAttempts = 0;
    this.notifyStatus('connected');

    // NOTE: Initial state is now requested via handshake from the client
    // This allows epoch-aware state management to prevent stale data on reconnect
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent) {
    try {
      const message: BackendWebSocketMessage = JSON.parse(event.data);

      // Ignore heartbeat messages (or handle separately if needed)
      if (message.type === 'heartbeat') {
        return;
      }

      // Notify all message handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    this.notifyStatus('error');
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent) {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.notifyStatus('disconnected');

    // Attempt to reconnect unless it was a manual close
    if (!this.isManualClose) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Notify all status handlers
   */
  private notifyStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error') {
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  /**
   * Get current connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }
}

// Singleton instance
let wsInstance: ThreatStreamWebSocket | null = null;

/**
 * Get WebSocket service instance (singleton)
 */
export function getWebSocketService(): ThreatStreamWebSocket {
  if (!wsInstance) {
    wsInstance = new ThreatStreamWebSocket();
  }
  return wsInstance;
}

export default getWebSocketService;
