import { Writable } from 'node:stream';

interface LokiValue {
  ts: string;
  line: string;
}

interface LokiStreamRecord {
  stream: Record<string, string>;
  values: [string, string][];
}

interface LokiPushBody {
  streams: LokiStreamRecord[];
}

export interface LokiStreamOptions {
  url: string;
  labels?: Record<string, string>;
  batchSize?: number;
  flushIntervalMs?: number;
  maxBufferSize?: number;
  maxRetries?: number;
}

export class LokiStream extends Writable {
  private buffer: LokiValue[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private flushing = false;
  private stopped = false;

  constructor(private readonly opts: LokiStreamOptions) {
    super({ objectMode: false });
    this.opts = {
      batchSize: 100,
      flushIntervalMs: 5000,
      maxBufferSize: 1000,
      maxRetries: 3,
      ...opts,
    };
    this.timer = setInterval(() => this.flush(), this.opts.flushIntervalMs);
    this.timer.unref?.();
  }

  _write(chunk: Buffer, _encoding: string, callback: (error?: Error | null) => void): void {
    if (this.stopped) {
      callback();
      return;
    }

    const line = chunk.toString().trim();
    if (!line) {
      callback();
      return;
    }

    let ts = Date.now() * 1_000_000;
    try {
      const parsed = JSON.parse(line) as { time?: number; level?: number | string; msg?: string };
      if (typeof parsed.time === 'number') {
        ts = Math.floor(parsed.time) * 1_000_000;
      }
    } catch {
      // keep current timestamp if line is not JSON
    }

    if (this.buffer.length >= (this.opts.maxBufferSize ?? 1000)) {
      // cap memory: drop oldest entry
      this.buffer.shift();
    }

    this.buffer.push({ ts: ts.toString(), line });

    if (this.buffer.length >= (this.opts.batchSize ?? 100)) {
      this.flush();
    }

    callback();
  }

  _final(callback: (error?: Error | null) => void): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    // attempt final flush with hard timeout so shutdown does not hang
    const timeout = 5000;
    const timeoutTimer = setTimeout(() => {
      console.error('[loki] final flush timed out');
      callback();
    }, timeout);

    this.flush()
      .then(() => {
        clearTimeout(timeoutTimer);
        callback();
      })
      .catch((err) => {
        clearTimeout(timeoutTimer);
        console.error('[loki] final flush error:', err);
        callback();
      });
  }

  private async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;

    this.flushing = true;
    const batchSize = this.opts.batchSize ?? 100;
    const batch = this.buffer.slice(0, batchSize);

    const body: LokiPushBody = {
      streams: [
        {
          stream: this.opts.labels ?? { service: 'unknown' },
          values: batch.map((v) => [v.ts, v.line]),
        },
      ],
    };

    try {
      const res = await fetch(this.opts.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`push failed: ${res.status} ${await res.text()}`);
      }

      // only remove from buffer after successful push
      this.buffer.splice(0, batch.length);
      this.retryCount = 0;
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    } catch (err) {
      console.error('[loki] push error:', err);
      this.retryCount++;
      const maxRetries = this.opts.maxRetries ?? 3;
      if (this.retryCount <= maxRetries && !this.stopped) {
        const delay = Math.min(2 ** this.retryCount * (this.opts.flushIntervalMs ?? 5000), 30000);
        if (!this.retryTimer) {
          this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            void this.flush();
          }, delay);
        }
      }
    } finally {
      this.flushing = false;
    }
  }
}
