import pino from 'pino';

const level = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';
const prettyEnabled = process.env.LOG_PRETTY === 'true' || (!isProduction && process.env.LOG_PRETTY !== 'false');

const options: pino.LoggerOptions = { level };

if (prettyEnabled) {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

// Pure pino logger, tanpa dependency ke database -- aman dipakai gateway.
// Untuk sink terpusat (Loki/CloudWatch/OpenTelemetry), set LOG_TARGET=<transport-module>
// di production dan pastikan transport module tersedia di runtime/container.
export const logger = pino(options);
