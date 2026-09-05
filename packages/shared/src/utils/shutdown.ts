import { logger } from '@repo/logger';

export type ShutdownTask = {
  name: string;
  close: () => Promise<void> | void;
};

export type GracefulShutdownOptions = {
  timeoutMs?: number;
  logger?: {
    info: (msg: string | Record<string, unknown>, ...args: unknown[]) => void;
    error: (msg: string | Record<string, unknown>, ...args: unknown[]) => void;
  };
};

const runWithTimeout = <T>(fn: () => Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`shutdown timed out after ${ms}ms`)), ms);
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
};

const runShutdown = async (
  signal: string,
  tasks: ShutdownTask[],
  options: GracefulShutdownOptions,
) => {
  const log = options.logger ?? logger;
  const timeoutMs = options.timeoutMs ?? 10_000;

  log.info({ signal }, 'graceful shutdown started');

  const runTasks = async () => {
    for (const task of tasks) {
      try {
        await task.close();
        log.info({ task: task.name }, 'shutdown task completed');
      } catch (err) {
        log.error({ err, task: task.name }, 'shutdown task failed');
      }
    }
  };

  try {
    await runWithTimeout(runTasks, timeoutMs);
    log.info('graceful shutdown complete');
  } catch (err) {
    log.error({ err }, 'graceful shutdown did not finish in time');
  } finally {
    process.exit(0);
  }
};

export const registerGracefulShutdown = (
  tasks: ShutdownTask[],
  options: GracefulShutdownOptions = {},
) => {
  const onShutdown = (signal: string) => {
    // Only handle first signal; ignore subsequent to prevent repeated exit calls
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    void runShutdown(signal, tasks, options);
  };

  process.on('SIGTERM', () => onShutdown('SIGTERM'));
  process.on('SIGINT', () => onShutdown('SIGINT'));
};
