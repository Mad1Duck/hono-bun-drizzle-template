import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    pool: 'forks',
    include: ['**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    env: {
      LOG_LEVEL: 'silent',
    },
    deps: {
      optimizer: {
        ssr: {
          include: ['ioredis'],
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      enabled: false,
    },
  },
});
