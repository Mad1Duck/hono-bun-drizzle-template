import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LokiStream } from '../loki';

type FetchMock = typeof globalThis.fetch;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createFetchCalls = () => {
  return {
    calls: [] as { url: string; body: unknown }[],
    mock: (() => {
      return new Response('ok', { status: 200 });
    }) as unknown as FetchMock,
  };
};

describe('LokiStream', () => {
  let originalFetch: FetchMock;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('batches and pushes logs to Loki', async () => {
    const { calls, mock } = createFetchCalls();
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: input.toString(), body: init?.body ? JSON.parse(init.body as string) : null });
      return new Response('ok', { status: 200 });
    }) as unknown as FetchMock;

    const stream = new LokiStream({
      url: 'http://loki.test/push',
      labels: { service: 'test' },
      flushIntervalMs: 100,
      batchSize: 2,
    });

    try {
      stream.write(Buffer.from('{"msg":"one"}'));
      stream.write(Buffer.from('{"msg":"two"}'));

      await wait(250);

      expect(calls.length).toBeGreaterThanOrEqual(1);
      const last = calls[calls.length - 1];
      expect(last.url).toBe('http://loki.test/push');
      expect(last.body).toMatchObject({
        streams: [
          {
            stream: { service: 'test' },
            values: expect.arrayContaining([[expect.any(String), expect.stringContaining('one')], [expect.any(String), expect.stringContaining('two')]]),
          },
        ],
      });
    } finally {
      stream.end();
      globalThis.fetch = original;
    }
  });

  it('does not lose logs when the first push fails', async () => {
    const calls: { status: number; body: unknown }[] = [];
    let attempt = 0;
    const original = globalThis.fetch;

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      attempt++;
      const body = init?.body ? JSON.parse(init.body as string) : null;
      if (attempt === 1) {
        calls.push({ status: 500, body });
        return new Response('Internal Server Error', { status: 500 });
      }
      calls.push({ status: 200, body });
      return new Response('ok', { status: 200 });
    }) as unknown as FetchMock;

    const stream = new LokiStream({
      url: 'http://loki.test/push',
      flushIntervalMs: 50,
      batchSize: 1,
      maxRetries: 2,
    });

    try {
      stream.write(Buffer.from('{"msg":"retry-me"}'));

      await wait(400);

      expect(calls.length).toBeGreaterThanOrEqual(2);
      expect(calls[0].status).toBe(500);
      expect(calls[calls.length - 1].status).toBe(200);
      const lastBody = calls[calls.length - 1].body as any;
      const values = lastBody?.streams?.[0]?.values ?? [];
      expect(values.some((v: [string, string]) => v[1].includes('retry-me'))).toBe(true);
    } finally {
      stream.end();
      globalThis.fetch = original;
    }
  });

  it('drops the oldest entries when the buffer exceeds maxBufferSize', async () => {
    const calls: { body: unknown }[] = [];
    const original = globalThis.fetch;

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ body: init?.body ? JSON.parse(init.body as string) : null });
      return new Response('ok', { status: 200 });
    }) as unknown as FetchMock;

    const stream = new LokiStream({
      url: 'http://loki.test/push',
      maxBufferSize: 3,
      flushIntervalMs: 10000,
      batchSize: 100,
    });

    try {
      stream.write(Buffer.from('{"msg":"first"}'));
      stream.write(Buffer.from('{"msg":"second"}'));
      stream.write(Buffer.from('{"msg":"third"}'));
      stream.write(Buffer.from('{"msg":"fourth"}'));

      const finished = new Promise<void>((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
      stream.end();
      await finished;

      expect(calls.length).toBe(1);
      const body = calls[0].body as any;
      const lines = (body?.streams?.[0]?.values ?? []).map((v: [string, string]) => v[1]);
      expect(lines.length).toBe(3);
      expect(lines.some((l: string) => l.includes('first'))).toBe(false);
      expect(lines.some((l: string) => l.includes('fourth'))).toBe(true);
    } finally {
      globalThis.fetch = original;
    }
  });
});
