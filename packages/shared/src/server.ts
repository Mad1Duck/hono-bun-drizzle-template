import { createServer as createNodeServer } from 'node:http';

export interface Server {
  stop: (closeActiveConnections?: boolean) => void;
  port: number;
}

interface CreateServerOptions {
  port: number;
  fetch: (req: Request) => Response | Promise<Response>;
  websocket?: any;
}

export const createServer = (options: CreateServerOptions): Server => {
  if (typeof Bun !== 'undefined') {
    const server = Bun.serve({
      ...options,
      port: options.port,
    }) as any;
    return {
      stop: (close) => server.stop(close),
      port: server.port as number,
    };
  }

  if (options.websocket) {
    throw new Error('WebSocket server is only supported under Bun runtime.');
  }

  const nodeServer = createNodeServer(async (req, res) => {
    const url = `http://${req.headers.host || 'localhost'}${req.url}`;
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
    });

    try {
      const response = await options.fetch(request);
      res.statusCode = response.status;

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      }

      res.end();
    } catch {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  nodeServer.listen(options.port);

  return {
    stop: () => nodeServer.close(),
    port: options.port,
  };
};
