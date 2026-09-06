import {
  createWebSocketServer,
  WebSocketConnection,
  WebSocketHandler,
  encode,
  decode,
  versionedTopic,
  parseVersionedTopic,
} from '@repo/shared';

const { websocket, upgradeWebSocket } = await createWebSocketServer();

const clients = new Map<WebSocketConnection, Set<string>>();

export { websocket };

export const wsHandler = upgradeWebSocket((c) => {
  const topic = c.req.param('topic');
  if (!topic) {
    return Promise.reject(new Response('Missing topic', { status: 400 }));
  }

  const channel = versionedTopic(topic);

  return {
    onOpen: (connection) => {
      if (!clients.has(connection)) {
        clients.set(connection, new Set());
      }
      clients.get(connection)?.add(channel);
      connection.subscribe(channel);

      console.log(`Client connected and subscribed to '${topic}' (channel: ${channel})`);
    },
    onMessage: (connection, data) => {
      const channels = clients.get(connection);

      if (!channels) return;

      const parsed = decode<unknown>(data as string | ArrayBuffer);
      console.log(`Received message on '${topic}':`, parsed);

      const response = JSON.stringify(encode(parsed.topic, parsed.payload));

      for (const subscribedChannel of channels) {
        connection.publish(subscribedChannel, response);
      }
    },
    onClose: (connection) => {
      const channels = clients.get(connection);

      if (channels) {
        for (const subscribedChannel of channels) {
          connection.unsubscribe(subscribedChannel);
        }
      }

      clients.delete(connection);
      console.log(`Client disconnected from topics: ${Array.from(channels || []).map(parseVersionedTopic)}`);
    },
  } as WebSocketHandler;
});

export const broadcastToTopic = (topic: string, message: unknown) => {
  const channel = versionedTopic(topic);
  const envelope = JSON.stringify(encode(topic, message));

  console.log(`Broadcasting to channel '${channel}': ${envelope}`);

  for (const [connection, channels] of clients.entries()) {
    if (channels.has(channel)) {
      connection.send(envelope);
    }
  }
};
