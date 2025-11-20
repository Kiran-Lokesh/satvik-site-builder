import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8083';

/**
 * WebSocket client for real-time order updates
 */
export class WebSocketClient {
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;

  connect(
    onNewOrder: (order: any) => void,
    onOrderUpdate: (order: any) => void,
    onError?: (error: any) => void
  ) {
    try {
      if (this.client && this.client.connected) {
        console.log('WebSocket already connected');
        return;
      }

      // Get WebSocket URL for SockJS
      // SockJS uses HTTP/HTTPS URLs, not ws:// - it handles protocol negotiation internally
      const wsUrl = BACKEND_API_URL + '/ws';
      
      console.log('🔌 Connecting to WebSocket via SockJS:', wsUrl);
      console.log('🔌 Backend API URL:', BACKEND_API_URL);

      this.client = new Client({
        webSocketFactory: () => {
          try {
            return new SockJS(wsUrl) as any;
          } catch (error) {
            console.error('Failed to create SockJS connection:', error);
            throw error;
          }
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('✅ WebSocket connected successfully');
          this.reconnectAttempts = 0;

          try {
            // Subscribe to new orders
            const newOrderSubscription = this.client?.subscribe('/topic/orders/new', (message) => {
              try {
                console.log('📨 Raw new order message received:', message.body);
                const order = JSON.parse(message.body);
                console.log('📨 Parsed new order:', order.orderNumber, order.id);
                onNewOrder(order);
              } catch (error) {
                console.error('Failed to parse new order message:', error, message.body);
              }
            });
            console.log('✅ Subscribed to /topic/orders/new', newOrderSubscription);

            // Subscribe to order updates
            const updateSubscription = this.client?.subscribe('/topic/orders/update', (message) => {
              try {
                console.log('📨 Raw order update message received:', message.body);
                const order = JSON.parse(message.body);
                console.log('📨 Parsed order update:', order.orderNumber, order.id);
                onOrderUpdate(order);
              } catch (error) {
                console.error('Failed to parse order update message:', error, message.body);
              }
            });
            console.log('✅ Subscribed to /topic/orders/update', updateSubscription);
          } catch (error) {
            console.error('Failed to subscribe to WebSocket topics:', error);
          }
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          onError?.(frame);
        },
        onWebSocketClose: () => {
          console.log('WebSocket closed');
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
        },
        onWebSocketError: (error) => {
          console.error('WebSocket error:', error);
          onError?.(error);
        },
      });

      this.client.activate();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      onError?.(error);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      console.log('WebSocket disconnected');
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export const websocketClient = new WebSocketClient();

