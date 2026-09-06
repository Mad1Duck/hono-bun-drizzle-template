import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import type { Context, MiddlewareHandler } from 'hono';
import type { WebSocketConnection, WebSocketHandler, WebSocketServerAdapter } from './index';

class BunWebSocketConnection implements WebSocketConnection {
  constructor(private raw: ServerWebSocket) {}

  send(data: any) {
    this.raw.send(data);
  }

  subscribe(topic: string) {
    this.raw.subscribe(topic);
  }

  unsubscribe(topic: string) {
    this.raw.unsubscribe(topic);
  }

  publish(topic: string, data: any) {
    this.raw.publish(topic, data);
  }
}

export const createBunWebSocketAdapter = (): WebSocketServerAdapter => {
  const { websocket, upgradeWebSocket: bunUpgradeWebSocket } = createBunWebSocket();

  const upgradeWebSocket = (
    handler: (c: Context) => WebSocketHandler | Promise<WebSocketHandler>,
  ): MiddlewareHandler =>
    bunUpgradeWebSocket((c) => {
      const h = handler(c);
      if (h instanceof Promise) {
        return h as any;
      }
      let connection: BunWebSocketConnection | null = null;

      const getConnection = (raw: ServerWebSocket): BunWebSocketConnection => {
        if (!connection) {
          connection = new BunWebSocketConnection(raw);
        }
        return connection;
      };

      return {
        onOpen: (_evt: any, ws: any) => {
          const raw = (ws as any).raw as ServerWebSocket;
          h.onOpen?.(getConnection(raw));
        },
        onMessage: (evt: any, ws: any) => {
          const raw = (ws as any).raw as ServerWebSocket;
          h.onMessage?.(getConnection(raw), evt.data as string | ArrayBuffer);
        },
        onClose: (_evt: any, ws: any) => {
          const raw = (ws as any).raw as ServerWebSocket;
          h.onClose?.(getConnection(raw));
        },
      } as any;
    }) as MiddlewareHandler;

  return { websocket, upgradeWebSocket };
};
