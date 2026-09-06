(globalThis as any).Bun = {
  ...(globalThis as any).Bun,
  password: {
    hash: async (password: string, _opts?: any) => `hashed:${password}`,
    verify: async (password: string, hash: string, _algorithm?: string) =>
      hash === `hashed:${password}`,
  },
  file: (_path: string) => ({
    exists: async () => false,
    text: async () => '',
    arrayBuffer: async () => new ArrayBuffer(0),
  }),
  serve: (_opts: any) => ({
    stop: () => {},
  }),
};
