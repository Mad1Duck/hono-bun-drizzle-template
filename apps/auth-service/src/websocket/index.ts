import { ServerWebSocket } from 'bun';
import { createBunWebSocket } from 'hono/bun';

const { upgradeWebSocket } = createBunWebSocket();

const clients = new Map<ServerWebSocket, Set<string>>();

export const wsHandler = upgradeWebSocket((c) => {
  const topic = c.req.param('topic');
  if (!topic) {
    return Promise.reject(new Response('Missing topic', { status: 400 }));
  }

  return {
    onOpen(_, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      if (!clients.has(rawWs)) {
        clients.set(rawWs, new Set());
      }
      clients.get(rawWs)?.add(topic);
      rawWs.subscribe(topic);

      console.log(`Client connected and subscribed to '${topic}'`);
    },
    onMessage(evt, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      const topics = clients.get(rawWs);

      if (!topics) return;

      console.log(`Received message: ${evt.data}`);

      for (const subscribedTopic of topics) {
        rawWs.publish(subscribedTopic, evt.data.toString());
      }
    },
    onClose(_, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      const topics = clients.get(rawWs);

      if (topics) {
        for (const topic of topics) {
          rawWs.unsubscribe(topic);
        }
      }

      clients.delete(rawWs);
      console.log(`Client disconnected from topics: ${Array.from(topics || [])}`);
    },
  };
});

export const broadcastToTopic = (topic: string, message: string) => {
  console.log(`Broadcasting to topic '${topic}': ${message}`);

  for (const [ws, topics] of clients.entries()) {
    if (topics.has(topic)) {
      ws.send(message);
    }
  }
};
