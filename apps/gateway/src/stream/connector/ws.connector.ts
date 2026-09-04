import { ServerWebSocket } from "bun";
import { createBunWebSocket } from "hono/bun";
import { eventHub, encode, decode, versionedTopic } from "@repo/shared";

const { websocket, upgradeWebSocket } = createBunWebSocket();

const clients = new Map<ServerWebSocket, Set<string>>();

eventHub.subscribe((topic, payload) => {
  const channel = versionedTopic(topic);
  const envelope = JSON.stringify(encode(topic, payload));
  for (const [ws, channels] of clients.entries()) {
    if (channels.has(channel)) {
      ws.send(envelope);
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
    onOpen(_, ws) {
      const rawWs = ws.raw as ServerWebSocket;
      if (!clients.has(rawWs)) {
        clients.set(rawWs, new Set());
      }
      clients.get(rawWs)?.add(channel);
      rawWs.subscribe(channel);
    },
    onMessage(evt) {
      const parsed = decode<unknown>(evt.data as string | ArrayBuffer);
      eventHub.broadcast(parsed.topic, parsed.payload);
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
    },
  };
});
