import { ServerWebSocket } from 'bun';
import { createBunWebSocket } from 'hono/bun';
import { encode, decode, versionedTopic, parseVersionedTopic } from '@repo/shared';

const { websocket, upgradeWebSocket } = createBunWebSocket();

const clients = new Map<ServerWebSocket, Set<string>>();

export { websocket };

export const wsHandler = upgradeWebSocket((c) => {
  const topic = c.req.param('topic');
  if (!topic) {
    return Promise.reject(new Response('Missing topic', { status: 400 }));
  }

  const channel = versionedTopic(topic);

  return {
    onOpen(_, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      if (!clients.has(rawWs)) {
        clients.set(rawWs, new Set());
      }
      clients.get(rawWs)?.add(channel);
      rawWs.subscribe(channel);

      console.log(`Client connected and subscribed to '${topic}' (channel: ${channel})`);
    },
    onMessage(evt, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      const channels = clients.get(rawWs);

      if (!channels) return;

      const parsed = decode<unknown>(evt.data as string | ArrayBuffer);
      console.log(`Received message on '${topic}':`, parsed);

      const response = JSON.stringify(encode(parsed.topic, parsed.payload));

      for (const subscribedChannel of channels) {
        rawWs.publish(subscribedChannel, response);
      }
    },
    onClose(_, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      const channels = clients.get(rawWs);

      if (channels) {
        for (const subscribedChannel of channels) {
          rawWs.unsubscribe(subscribedChannel);
        }
      }

      clients.delete(rawWs);
      console.log(`Client disconnected from topics: ${Array.from(channels || []).map(parseVersionedTopic)}`);
    },
  };
});

export const broadcastToTopic = (topic: string, message: unknown) => {
  const channel = versionedTopic(topic);
  const envelope = JSON.stringify(encode(topic, message));

  console.log(`Broadcasting to channel '${channel}': ${envelope}`);

  for (const [ws, channels] of clients.entries()) {
    if (channels.has(channel)) {
      ws.send(envelope);
    }
  }
};
