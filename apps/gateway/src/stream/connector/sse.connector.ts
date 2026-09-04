import { eventHub, encode, versionedTopic } from "@repo/shared";

type SseClient = {
  topic: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const clients = new Set<SseClient>();

eventHub.subscribe((topic, payload) => {
  const channel = versionedTopic(topic);
  const message = `data: ${JSON.stringify(encode(topic, payload))}\n\n`;
  const bytes = new TextEncoder().encode(message);
  for (const client of clients) {
    if (client.topic === channel) {
      client.controller.enqueue(bytes);
    }
  }
});

export const sseConnector = {
  subscribe(topic: string): ReadableStream<Uint8Array> {
    const channel = versionedTopic(topic);
    let client: SseClient | null = null;

    return new ReadableStream({
      start(controller) {
        client = { topic: channel, controller };
        clients.add(client);
      },
      cancel() {
        if (client) {
          clients.delete(client);
          client = null;
        }
      },
    });
  },
};
