import type { Context, MiddlewareHandler } from 'hono';

export interface WebSocketConnection {
  send(data: any): void;
  subscribe(topic: string): void;
  unsubscribe(topic: string): void;
  publish(topic: string, data: any): void;
}

export interface WebSocketHandler {
  onOpen?: (connection: WebSocketConnection) => void;
  onMessage?: (connection: WebSocketConnection, data: string | ArrayBuffer) => void;
  onClose?: (connection: WebSocketConnection) => void;
}

export interface WebSocketServerAdapter {
  upgradeWebSocket: (handler: (c: Context) => WebSocketHandler | Promise<WebSocketHandler>) => MiddlewareHandler;
  websocket?: any;
}

export const createWebSocketServer = async (): Promise<WebSocketServerAdapter> => {
  if (typeof Bun !== 'undefined') {
    const { createBunWebSocketAdapter } = await import('./bun-adapter');
    return createBunWebSocketAdapter();
  }

  throw new Error('WebSocket server requires Bun runtime. Node/ws support is not yet implemented.');
};
