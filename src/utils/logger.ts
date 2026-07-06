import pino from 'pino';
import { db } from '@/db';
import { appLogs } from '@/db/schema';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

interface LogErrorInput {
  code: string;
  message: string;
  statusCode?: number;
  userId?: string;
  details?: unknown;
}

export const logError = ({ code, message, statusCode, userId, details }: LogErrorInput) => {
  logger.error({ code, statusCode, userId, details }, message);

  db.insert(appLogs)
    .values({
      userId: userId ?? null,
      action: code,
      metadata: { message, statusCode, details },
    })
    .catch((dbError) => {
      logger.error({ err: dbError }, 'Gagal menyimpan log ke app_logs');
    });
};
