import {
  createWebSocketServer,
  WebSocketConnection,
  WebSocketHandler,
  eventHub,
  encode,
  decode,
  versionedTopic,
} from "@repo/shared";

const { websocket, upgradeWebSocket } = await createWebSocketServer();

const clients = new Map<WebSocketConnection, Set<string>>();

eventHub.subscribe((topic, payload) => {
  const channel = versionedTopic(topic);
  const envelope = JSON.stringify(encode(topic, payload));
  for (const [connection, channels] of clients.entries()) {
    if (channels.has(channel)) {
      connection.send(envelope);
    }
  }
});

export { websocket, upgradeWebSocket };

export const wsHandler = upgradeWebSocket((c) => {
  const topic = c.req.param("topic");
  if (!topic) {
    return Promise.reject(new Response("Missing topic", { status: 400 }));
  }

  const channel = versionedTopic(topic);

  return {
    onOpen: (connection) => {
      if (!clients.has(connection)) {
        clients.set(connection, new Set());
      }
      clients.get(connection)?.add(channel);
      connection.subscribe(channel);
    },
    onMessage: (connection, data) => {
      const parsed = decode<unknown>(data as string | ArrayBuffer);
      eventHub.broadcast(parsed.topic, parsed.payload);
    },
    onClose: (connection) => {
      const channels = clients.get(connection);
      if (channels) {
        for (const subscribedChannel of channels) {
          connection.unsubscribe(subscribedChannel);
        }
      }
      clients.delete(connection);
    },
  } as WebSocketHandler;
});
